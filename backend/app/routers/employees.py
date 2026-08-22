from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import db
from app.core.security import get_password_hash
from app.utils.dependencies import get_current_user, get_current_admin
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from bson import ObjectId
import datetime as dt

router = APIRouter()

def generate_login_id(name: str, joining_date: str, serial: int) -> str:
    parts = name.strip().split()
    first_name = parts[0] if parts else "EM"
    last_name = parts[-1] if len(parts) > 1 else first_name
    
    # Take up to 2 characters from first name and last name
    f_code = first_name[:2].upper()
    l_code = last_name[:2].upper() if len(last_name) >= 2 else last_name.upper()
    # Pad to 2 chars if needed
    if len(f_code) < 2:
        f_code = f_code.ljust(2, 'X')
    if len(l_code) < 2:
        l_code = l_code.ljust(2, 'X')
        
    name_code = f"{f_code}{l_code}"
    
    try:
        # Date comes in YYYY-MM-DD
        year = dt.datetime.strptime(joining_date, "%Y-%m-%d").year
    except Exception:
        year = dt.datetime.now().year
        
    serial_code = str(serial).zfill(4)
    return f"OI{name_code}{year}{serial_code}"

def clean_doc(doc):
    if not doc:
        return doc
    doc["id"] = doc["employee_id"]
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    if "user_id" in doc:
        doc["user_id"] = str(doc["user_id"])
    return doc

@router.get("/employees")
async def get_employees(current_user: dict = Depends(get_current_user)):
    cursor = db.employees.find()
    employees_list = []
    async for doc in cursor:
        employees_list.append(clean_doc(doc))
    return employees_list

@router.get("/employees/{id}")
async def get_employee_by_id(id: str, current_user: dict = Depends(get_current_user)):
    employee = await db.employees.find_one({"employee_id": id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return clean_doc(employee)

@router.post("/employees")
async def create_employee(data: EmployeeCreate, current_admin: dict = Depends(get_current_admin)):
    # Check if employee email already registered
    existing_employee = await db.employees.find_one({"email": data.email})
    if existing_employee:
        raise HTTPException(status_code=400, detail="Employee with this email already exists")
    
    # Calculate serial number
    serial = await db.employees.count_documents({}) + 1
    generated_id = generate_login_id(data.name, data.joiningDate, serial)
    
    # Create corresponding user account first
    default_password = "password123"
    hashed_password = get_password_hash(default_password)
    
    new_user = {
        "employee_id": generated_id,
        "email": data.email,
        "password_hash": hashed_password,
        "role": "employee",
        "is_verified": True,
        "created_at": dt.datetime.utcnow(),
        "updated_at": dt.datetime.utcnow()
    }
    
    user_result = await db.users.insert_one(new_user)
    
    # Save the employee details
    new_employee = {
        "user_id": user_result.inserted_id,
        "employee_id": generated_id,
        "name": data.name,
        "email": data.email,
        "phone": data.phone or "",
        "dob": "",
        "address": "",
        "avatar": None,
        "designation": data.designation,
        "department": data.department,
        "joiningDate": data.joiningDate,
        "location": data.location or "",
        "manager": data.manager or "",
        "employmentStatus": data.employmentStatus,
        "status": "absent"
    }
    
    await db.employees.insert_one(new_employee)
    return clean_doc(new_employee)

@router.put("/employees/{id}")
async def update_employee(id: str, data: EmployeeUpdate, current_user: dict = Depends(get_current_user)):
    # Authorization check: employees can only update their own profile, admin can update anyone
    if current_user.get("role") != "admin" and current_user.get("employee_id") != id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to update this profile"
        )
        
    employee = await db.employees.find_one({"employee_id": id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    # Build update payload
    update_data = {}
    
    update_fields = [
        "name", "email", "phone", "dob", "address", "avatar", 
        "department", "designation", "joiningDate", "location", 
        "manager", "employmentStatus", "status"
    ]
    
    for field in update_fields:
        val = getattr(data, field, None)
        if val is not None:
            update_data[field] = val
            
    if update_data:
        await db.employees.update_one({"employee_id": id}, {"$set": update_data})
        
        # If email was updated, update users collection too
        if "email" in update_data:
            await db.users.update_one({"employee_id": id}, {"$set": {"email": update_data["email"]}})
            
    updated_employee = await db.employees.find_one({"employee_id": id})
    return clean_doc(updated_employee)
