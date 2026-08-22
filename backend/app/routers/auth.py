from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone, timedelta
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.database import get_database
from app.utils.dependencies import get_current_user
from app.utils.email import send_email_alert
from bson import ObjectId

IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    return datetime.now(IST)

def get_ist_date_str():
    return datetime.now(IST).strftime("%Y-%m-%d")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def generate_login_id(first_name: str, last_name: str, year: int = None, serial: int = 1) -> str:
    if not year:
        year = get_ist_now().year
    f2 = (first_name[:2] if len(first_name) >= 2 else first_name.ljust(2, 'X')).upper()
    l2 = (last_name[:2] if len(last_name) >= 2 else last_name.ljust(2, 'X')).upper()
    return f"OI{f2}{l2}{year}{str(serial).zfill(4)}"

@router.post("/register", response_model=dict)
async def register_user(user_in: UserCreate):
    db = get_database()
    
    # Auto-generate employee_id if not provided or format requested
    emp_id = user_in.employee_id
    if not emp_id or emp_id.strip() == "":
        count = await db.users.count_documents({}) + 1
        emp_id = generate_login_id(user_in.first_name, user_in.last_name, serial=count)
    
    existing_user = await db.users.find_one({
        "$or": [
            {"email": user_in.email},
            {"employee_id": emp_id}
        ]
    })
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or Employee ID already exists"
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    now_ist = get_ist_now()
    new_user = {
        "employee_id": emp_id,
        "email": user_in.email,
        "password_hash": hashed_pwd,
        "role": user_in.role,
        "is_verified": True,
        "created_at": now_ist,
        "updated_at": now_ist
    }
    
    res = await db.users.insert_one(new_user)
    user_id = str(res.inserted_id)
    
    # Calculate detailed Excalidraw salary structure based on monthly wage
    monthly_wage = 75000 if user_in.role == "admin" else 50000
    yearly_wage = monthly_wage * 12
    basic = monthly_wage * 0.50
    hra = basic * 0.50
    std_allowance = 4167.0
    pf_employee = basic * 0.12
    pf_employer = basic * 0.12
    prof_tax = 200.0
    
    new_profile = {
        "user_id": user_id,
        "employee_id": emp_id,
        "personal_details": {
            "first_name": user_in.first_name or "Employee",
            "last_name": user_in.last_name or "",
            "phone": "+1 555-0199",
            "address": "123 Innovation Way, Tech Park",
            "profile_picture": "",
            "gender": "Male",
            "date_of_birth": "1995-06-15",
            "nationality": "American",
            "marital_status": "Single",
            "personal_email": user_in.email
        },
        "job_details": {
            "department": "HR & Admin" if user_in.role == "admin" else "Engineering",
            "designation": "HR Officer" if user_in.role == "admin" else "Software Engineer",
            "join_date": get_ist_date_str(),
            "employment_type": "full-time",
            "manager": "Sarah Mitchell",
            "location": "Headquarters - NY"
        },
        "about": "Passionate professional dedicated to building exceptional software and driving team success.",
        "skills": ["React", "FastAPI", "Python", "JavaScript", "Tailwind CSS"],
        "certifications": ["AWS Certified Developer", "Agile Scrum Master"],
        "bank_details": {
            "account_number": "987654321012",
            "bank_name": "Chase Bank",
            "ifsc_code": "CHAS0123456",
            "pan_no": "ABCDE1234F",
            "uan_no": "100908070605"
        },
        "salary_info": {
            "wage_type": "Fixed Wage",
            "monthly_wage": monthly_wage,
            "yearly_wage": yearly_wage,
            "working_days_per_week": 5,
            "break_time_hrs": 1.0,
            "components": {
                "basic": basic,
                "hra": hra,
                "standard_allowance": std_allowance,
                "performance_bonus": monthly_wage * 0.0833,
                "leave_travel_allowance": monthly_wage * 0.05,
                "fixed_allowance": monthly_wage - (basic + hra + std_allowance)
            },
            "pf_contributions": {
                "employee": pf_employee,
                "employer": pf_employer
            },
            "tax_deductions": {
                "professional_tax": prof_tax
            }
        },
        "documents": [],
        "created_at": now_ist,
        "updated_at": now_ist
    }
    await db.employees.insert_one(new_profile)

    # Initial payroll record
    new_payroll = {
        "employee_id": emp_id,
        "month": now_ist.strftime("%Y-%m"),
        "salary_structure": {
            "basic": basic,
            "hra": hra,
            "allowances": std_allowance + (monthly_wage * 0.05),
            "deductions": pf_employee + prof_tax,
            "gross_salary": monthly_wage,
            "net_salary": monthly_wage - (pf_employee + prof_tax)
        },
        "payment_date": now_ist.strftime("%Y-%m-28"),
        "payment_status": "paid",
        "created_at": now_ist,
        "updated_at": now_ist
    }
    await send_email_alert(
        recipient_email=user_in.email,
        subject="Welcome to Dayflow HRMS 🚀",
        body_html=f"<h3>Welcome to Dayflow, {user_in.first_name}!</h3><p>Your workspace account has been created with Employee ID: <strong>{emp_id}</strong>.</p><p>Role: {user_in.role.upper()}</p>",
        user_id=user_id
    )

    token = create_access_token(user_id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "employee_id": emp_id,
            "email": user_in.email,
            "role": user_in.role,
            "first_name": user_in.first_name,
            "last_name": user_in.last_name
        }
    }

@router.post("/login", response_model=dict)
async def login_user(credentials: UserLogin):
    db = get_database()
    login_input = credentials.email.strip()
    user = await db.users.find_one({
        "$or": [
            {"email": login_input.lower()},
            {"employee_id": login_input.upper()}
        ]
    })
    
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    user_id = str(user["_id"])
    token = create_access_token(user_id)
    
    employee = await db.employees.find_one({"user_id": user_id})
    first_name = employee.get("personal_details", {}).get("first_name", "") if employee else ""
    last_name = employee.get("personal_details", {}).get("last_name", "") if employee else ""

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "employee_id": user["employee_id"],
            "email": user["email"],
            "role": user["role"],
            "first_name": first_name,
            "last_name": last_name
        }
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_database()
    employee = await db.employees.find_one({"user_id": current_user["_id"]})
    if employee:
        employee["_id"] = str(employee["_id"])
        current_user["first_name"] = employee.get("personal_details", {}).get("first_name", "")
        current_user["last_name"] = employee.get("personal_details", {}).get("last_name", "")
    current_user["id"] = str(current_user.get("_id", ""))
    return {
        "user": current_user,
        "employee": employee
    }

