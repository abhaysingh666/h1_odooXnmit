from fastapi import APIRouter, HTTPException, status, Response, Cookie, Depends, UploadFile, File
from typing import Optional
from datetime import datetime, timedelta
from bson import ObjectId
import secrets

from ..schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    AuthResponse,
    ChangePassword,
    AdminCreateEmployee,
    EmployeeCreatedResponse,
    CompleteRegistration
)
from ..models import UserInDB
from ..core import (
    get_database,
    get_redis,
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    get_cookie_options,
    settings
)
from ..core.cloudinary_config import upload_image_to_cloudinary
from ..utils import (
    get_current_user,
    get_current_admin,
    generate_login_id,
    generate_random_password,
    get_next_serial_number
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/upload-logo")
async def upload_company_logo(file: UploadFile = File(...)):
    """
    Upload company logo to Cloudinary and return the URL.
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WEBP images are allowed"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Upload to Cloudinary
        result = upload_image_to_cloudinary(content)
        
        return {
            "logo_url": result["url"],
            "public_id": result["public_id"],
            "message": "Logo uploaded successfully to Cloudinary"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )


@router.post("/admin/create-employee", response_model=EmployeeCreatedResponse)
async def admin_create_employee(
    employee_data: AdminCreateEmployee,
    admin: UserInDB = Depends(get_current_admin)
):
    """
    Admin creates a new employee.
    
    Flow:
    1. Admin fills employee details
    2. System generates Login ID and temporary password
    3. System creates registration token (valid for 7 days)
    4. Returns credentials + registration link to admin
    5. Admin shares link with employee
    6. Employee completes registration by setting new password
    """
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"email_id": employee_data.email_id},
            {"phone": employee_data.phone}
        ]
    })
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or phone already exists"
        )
    
    # Generate Login ID
    current_year = datetime.utcnow().year
    serial_number = await get_next_serial_number(db, current_year)
    login_id = generate_login_id(
        employee_data.company_name,
        employee_data.name,  # Pass employee name
        current_year,
        serial_number
    )
    
    # Generate temporary password
    temp_password = generate_random_password(12)
    hashed_password = hash_password(temp_password)
    
    # Generate registration token (valid for 7 days)
    registration_token = secrets.token_urlsafe(32)
    token_expires_at = datetime.utcnow() + timedelta(days=7)
    
    # Create user document
    user_doc = {
        "login_id": login_id,
        "company_name": employee_data.company_name,
        "company_logo_url": employee_data.company_logo_url,
        "name": employee_data.name,
        "email_id": employee_data.email_id,
        "phone": employee_data.phone,
        "password": hashed_password,
        "is_first_login": True,
        "role": "employee",
        "is_verified": False,
        "registration_token": registration_token,
        "token_expires_at": token_expires_at,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert user
    await db.users.insert_one(user_doc)
    
    # Generate registration link
    base_url = "http://localhost:5173"  # Frontend URL
    registration_link = f"{base_url}/complete-registration?token={registration_token}"
    
    return EmployeeCreatedResponse(
        login_id=login_id,
        temp_password=temp_password,
        registration_link=registration_link,
        message="Employee created successfully. Share these credentials with the employee."
    )


@router.post("/complete-registration", response_model=AuthResponse)
async def complete_registration(
    registration_data: CompleteRegistration,
    response: Response
):
    """
    Employee completes registration using the token from admin.
    
    Flow:
    1. Employee clicks registration link with token
    2. Employee sets new password
    3. Token is invalidated
    4. is_first_login is set to False
    5. Employee is logged in
    """
    db = get_database()
    
    # Find user by registration token
    user_data = await db.users.find_one({
        "registration_token": registration_data.token
    })
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired registration token"
        )
    
    # Check if token is expired
    if user_data.get("token_expires_at") and user_data["token_expires_at"] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration token has expired. Please contact HR."
        )
    
    # Hash new password
    new_hashed_password = hash_password(registration_data.password)
    
    # Update user: set new password, remove token, set is_first_login to False
    user_id = user_data["_id"]
    await db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "password": new_hashed_password,
                "is_first_login": False,
                "is_verified": True,
                "updated_at": datetime.utcnow()
            },
            "$unset": {
                "registration_token": "",
                "token_expires_at": ""
            }
        }
    )
    
    # Create JWT token
    user_id_str = str(user_id)
    token_data = {
        "_id": user_id_str,
        "role": user_data["role"],
        "email_id": user_data["email_id"],
        "login_id": user_data["login_id"]
    }
    token = create_access_token(token_data)
    
    # Set cookie
    cookie_options = get_cookie_options(settings.is_production)
    response.set_cookie(key="token", value=token, **cookie_options)
    
    # Prepare response
    user_response = UserResponse(
        _id=user_id_str,
        login_id=user_data["login_id"],
        company_name=user_data["company_name"],
        company_logo_url=user_data.get("company_logo_url"),
        name=user_data["name"],
        email_id=user_data["email_id"],
        phone=user_data["phone"],
        role=user_data["role"],
        is_first_login=False,
        is_verified=True
    )
    
    return AuthResponse(
        user=user_response,
        message="Registration completed successfully. Welcome to Dayflow HRMS!"
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_403_FORBIDDEN)
async def register_disabled(user_data: UserRegister, response: Response):
    """
    Public registration is disabled.
    Only HR/Admin can create new employees.
    """
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Public registration is disabled. Please contact your HR/Admin to create an account for you."
    )



@router.post("/admin/promote-to-admin")
async def promote_employee_to_admin(
    employee_email: str,
    admin: UserInDB = Depends(get_current_admin)
):
    """
    Promote an existing employee to admin role.
    Only admins can promote others to admin.
    
    Use this when:
    - You want to create another admin
    - Employee already exists and needs admin access
    """
    db = get_database()
    
    # Find employee by email
    employee = await db.users.find_one({"email_id": employee_email})
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No user found with email: {employee_email}"
        )
    
    # Check if already admin
    if employee.get("role") == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User {employee_email} is already an admin"
        )
    
    # Promote to admin
    await db.users.update_one(
        {"_id": employee["_id"]},
        {
            "$set": {
                "role": "admin",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": f"✅ Successfully promoted {employee.get('name')} ({employee_email}) to admin",
        "login_id": employee.get("login_id"),
        "new_role": "admin"
    }


@router.post("/bootstrap-admin", response_model=AuthResponse)
async def bootstrap_first_admin(response: Response):
    """
    Create the first admin user for the system.
    
    This endpoint can be called when:
    1. No admin exists in the system (first time setup)
    2. Admin was deleted and needs to be recreated
    
    It checks:
    - If any user with this email already exists (prevents duplicates)
    - If admin already exists (returns error with login suggestion)
    
    Uses credentials from environment variables.
    """
    db = get_database()
    
    # Check if admin with this email already exists
    existing_user = await db.users.find_one({"email_id": settings.FIRST_ADMIN_EMAIL})
    if existing_user:
        # If user exists and is admin
        if existing_user.get("role") == "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Admin with email {settings.FIRST_ADMIN_EMAIL} already exists. Please login."
            )
        # If user exists but is not admin
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email {settings.FIRST_ADMIN_EMAIL} already exists as {existing_user.get('role')}. Please use different email in .env"
            )
    
    # Check if ANY admin exists (but with different email)
    any_admin = await db.users.find_one({"role": "admin"})
    if any_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Admin already exists (Login ID: {any_admin.get('login_id')}). If you want to create another admin, please login and use admin panel."
        )
    
    # Generate Login ID for first admin
    current_year = datetime.utcnow().year
    
    # Get next serial number based on ALL users in this year (including employees)
    serial_number = await get_next_serial_number(db, current_year)
    
    login_id = generate_login_id(
        settings.FIRST_ADMIN_COMPANY,
        settings.FIRST_ADMIN_NAME,  # Pass admin name
        current_year,
        serial_number
    )
    
    # Hash password from environment
    hashed_password = hash_password(settings.FIRST_ADMIN_PASSWORD)
    
    # Create admin user
    admin_doc = {
        "login_id": login_id,
        "company_name": settings.FIRST_ADMIN_COMPANY,
        "company_logo_url": None,
        "name": settings.FIRST_ADMIN_NAME,
        "email_id": settings.FIRST_ADMIN_EMAIL,
        "phone": "+0000000000",  # Placeholder
        "password": hashed_password,
        "is_first_login": False,  # Admin can login immediately
        "role": "admin",
        "is_verified": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert admin
    result = await db.users.insert_one(admin_doc)
    admin_id = str(result.inserted_id)
    
    # Create JWT token
    token_data = {
        "_id": admin_id,
        "role": "admin",
        "email_id": settings.FIRST_ADMIN_EMAIL,
        "login_id": login_id
    }
    token = create_access_token(token_data)
    
    # Set cookie
    cookie_options = get_cookie_options(settings.is_production)
    response.set_cookie(key="token", value=token, **cookie_options)
    
    # Prepare response
    admin_response = UserResponse(
        _id=admin_id,
        login_id=login_id,
        company_name=settings.FIRST_ADMIN_COMPANY,
        company_logo_url=None,
        name=settings.FIRST_ADMIN_NAME,
        email_id=settings.FIRST_ADMIN_EMAIL,
        phone="+0000000000",
        role="admin",
        is_first_login=False,
        is_verified=True
    )
    
    return AuthResponse(
        user=admin_response,
        message=f"✅ First admin created successfully! Login ID: {login_id}"
    )


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin, response: Response):
    """
    Login user with Login ID or Email and password.
    Returns JWT token in cookie.
    
    User can login with either:
    - Login ID (e.g., CI20240020001)
    - Email (e.g., john@example.com)
    """
    db = get_database()
    
    # Find user by login_id or email
    user_data = await db.users.find_one({
        "$or": [
            {"login_id": credentials.login_id},
            {"email_id": credentials.login_id}  # Allow email as login
        ]
    })
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_data["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create JWT token
    user_id = str(user_data["_id"])
    token_data = {
        "_id": user_id,
        "role": user_data["role"],
        "email_id": user_data["email_id"],
        "login_id": user_data["login_id"]
    }
    token = create_access_token(token_data)
    
    # Set cookie
    cookie_options = get_cookie_options(settings.is_production)
    response.set_cookie(key="token", value=token, **cookie_options)
    
    # Prepare response
    user_response = UserResponse(
        _id=user_id,
        login_id=user_data["login_id"],
        company_name=user_data["company_name"],
        company_logo_url=user_data.get("company_logo_url"),
        name=user_data["name"],
        email_id=user_data["email_id"],
        phone=user_data["phone"],
        role=user_data["role"],
        is_first_login=user_data.get("is_first_login", False),
        is_verified=user_data.get("is_verified", False)
    )
    
    message = "Logged In Successfully"
    if user_data.get("is_first_login", False):
        message += ". Please change your password after first login."
    
    return AuthResponse(
        user=user_response,
        message=message,
        access_token=token,
        token_type="bearer"
    )


@router.post("/logout")
async def logout(response: Response, token: Optional[str] = Cookie(None)):
    """
    Logout user by adding token to Redis blocklist.
    Equivalent to Node.js logout function.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No token provided"
        )
    
    # Decode token to get expiration
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    # Add token to Redis blocklist
    redis = get_redis()
    exp_timestamp = payload.get("exp")
    
    # Set token as blocked in Redis with expiration
    await redis.set(f"token:{token}", "Blocked")
    if exp_timestamp:
        await redis.expireat(f"token:{token}", exp_timestamp)
    
    # Clear cookie
    response.delete_cookie(
        key="token",
        httponly=True,
        samesite="none" if settings.is_production else "lax",
        secure=settings.is_production
    )
    
    return {"message": "Logged Out Successfully"}


@router.post("/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Change user password.
    Users should change password after first login.
    """
    db = get_database()
    
    # Verify old password
    if not verify_password(password_data.old_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Old password is incorrect"
        )
    
    # Hash new password
    new_hashed_password = hash_password(password_data.new_password)
    
    # Update password and set is_first_login to False
    await db.users.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "password": new_hashed_password,
                "is_first_login": False,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "Password changed successfully"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    """
    Get current logged-in user information.
    Protected route that requires authentication.
    """
    return UserResponse(
        _id=str(current_user.id),
        login_id=current_user.login_id,
        company_name=current_user.company_name,
        company_logo_url=current_user.company_logo_url,
        name=current_user.name,
        email_id=current_user.email_id,
        phone=current_user.phone,
        role=current_user.role,
        is_first_login=current_user.is_first_login,
        is_verified=current_user.is_verified
    )


@router.delete("/delete-profile")
async def delete_profile(current_user: UserInDB = Depends(get_current_user)):
    """
    Delete current user's profile.
    Equivalent to Node.js deleteProfile function.
    """
    db = get_database()
    
    # Delete user
    await db.users.delete_one({"_id": current_user.id})
    
    # Delete related data (attendance, leaves, etc.)
    await db.attendance.delete_many({"employee_id": current_user.id})
    await db.leaves.delete_many({"employee_id": current_user.id})
    await db.payroll.delete_many({"employee_id": current_user.id})
    
    return {"message": "Profile Deleted Successfully"}
