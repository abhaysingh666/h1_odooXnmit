from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.database import db
from app.utils.dependencies import get_current_user
from app.schemas.user import UserCreate, UserLogin, UserResponse
from bson import ObjectId
import datetime as dt

router = APIRouter()

@router.post("/auth/register")
async def register(user_in: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"employee_id": user_in.employee_id},
            {"email": user_in.email}
        ]
    })
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this Employee ID or Email already exists"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_in.password)
    
    new_user = {
        "employee_id": user_in.employee_id,
        "email": user_in.email,
        "password_hash": hashed_password,
        "role": user_in.role,
        "is_verified": True,
        "created_at": dt.datetime.utcnow(),
        "updated_at": dt.datetime.utcnow()
    }
    
    result = await db.users.insert_one(new_user)
    
    # Also create employee profile for this user
    # If admin, we create a basic employee card so they can be loaded in profiles
    new_employee = {
        "user_id": result.inserted_id,
        "employee_id": user_in.employee_id,
        "name": user_in.employee_id, # Default name is employee_id
        "email": user_in.email,
        "phone": "",
        "dob": "",
        "address": "",
        "avatar": None,
        "designation": "Administrator" if user_in.role == "admin" else "Employee",
        "department": "HR" if user_in.role == "admin" else "Staff",
        "joiningDate": dt.date.today().isoformat(),
        "location": "",
        "manager": "",
        "employmentStatus": "Active",
        "status": "absent"
    }
    await db.employees.insert_one(new_employee)
    
    return {"message": "User registered successfully"}

@router.post("/auth/login")
async def login(credentials: UserLogin):
    # Find user by employee_id or email
    user = await db.users.find_one({
        "$or": [
            {"employee_id": credentials.loginId},
            {"email": credentials.loginId}
        ]
    })
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Login ID / Email or Password"
        )
        
    access_token = create_access_token(subject=str(user["_id"]))
    
    # Retrieve employee profile details to return to the frontend
    employee = await db.employees.find_one({"employee_id": user["employee_id"]})
    if not employee:
        # Create an employee profile if missing
        employee = {
            "user_id": user["_id"],
            "employee_id": user["employee_id"],
            "name": user["employee_id"],
            "email": user["email"],
            "phone": "",
            "dob": "",
            "address": "",
            "avatar": None,
            "designation": "Administrator" if user["role"] == "admin" else "Employee",
            "department": "HR" if user["role"] == "admin" else "Staff",
            "joiningDate": dt.date.today().isoformat(),
            "location": "",
            "manager": "",
            "employmentStatus": "Active",
            "status": "absent"
        }
        await db.employees.insert_one(employee)
        
    # Build a merged profile that the UI expects
    user_profile = {
        "id": employee["employee_id"],
        "user_id": str(user["_id"]),
        "name": employee["name"],
        "email": employee["email"],
        "phone": employee.get("phone", ""),
        "dob": employee.get("dob", ""),
        "address": employee.get("address", ""),
        "avatar": employee.get("avatar"),
        "designation": employee.get("designation", ""),
        "department": employee.get("department", ""),
        "joiningDate": employee.get("joiningDate", ""),
        "location": employee.get("location", ""),
        "manager": employee.get("manager", ""),
        "employmentStatus": employee.get("employmentStatus", "Active"),
        "status": employee.get("status", "absent"),
        "role": user["role"],
        "token": access_token
    }
    
    return user_profile

@router.post("/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}

@router.get("/users/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    # Retrieve employee profile details
    employee = await db.employees.find_one({"employee_id": current_user["employee_id"]})
    
    user_profile = {
        "id": current_user["employee_id"],
        "user_id": current_user["id"],
        "name": employee["name"] if employee else current_user["employee_id"],
        "email": employee["email"] if employee else current_user["email"],
        "phone": employee.get("phone", "") if employee else "",
        "dob": employee.get("dob", "") if employee else "",
        "address": employee.get("address", "") if employee else "",
        "avatar": employee.get("avatar") if employee else None,
        "designation": employee.get("designation", "") if employee else "Staff",
        "department": employee.get("department", "") if employee else "Staff",
        "joiningDate": employee.get("joiningDate", "") if employee else "",
        "location": employee.get("location", "") if employee else "",
        "manager": employee.get("manager", "") if employee else "",
        "employmentStatus": employee.get("employmentStatus", "Active") if employee else "Active",
        "status": employee.get("status", "absent") if employee else "absent",
        "role": current_user["role"]
    }
    
    return user_profile
