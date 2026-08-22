from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import db
from app.utils.dependencies import get_current_user, get_current_admin
from app.schemas.payroll import PayrollCreate, PayrollUpdate, PayrollResponse
from bson import ObjectId
import datetime as dt

router = APIRouter()

def calculate_salary(basic: float, hra: float, allowances: float, deductions: float):
    gross = basic + hra + allowances
    net = gross - deductions
    return round(gross, 2), round(net, 2)

@router.get("/payroll/me")
async def get_my_payroll(current_user: dict = Depends(get_current_user)):
    emp_id = current_user.get("employee_id")
    cursor = db.payroll.find({"employee_id": emp_id}).sort("month", -1)
    
    records = []
    async for doc in cursor:
        records.append({
            "id": str(doc["_id"]),
            "employeeId": doc["employee_id"],
            "month": doc["month"],
            "salaryStructure": {
                "basic": doc["salary_structure"]["basic"],
                "hra": doc["salary_structure"]["hra"],
                "allowances": doc["salary_structure"]["allowances"],
                "deductions": doc["salary_structure"]["deductions"],
                "gross_salary": doc["salary_structure"].get("gross_salary", 0.0),
                "net_salary": doc["salary_structure"].get("net_salary", 0.0)
            },
            "paymentDate": doc.get("payment_date"),
            "paymentStatus": doc.get("payment_status", "pending")
        })
    return records

@router.get("/payroll")
async def get_all_payroll(current_admin: dict = Depends(get_current_admin)):
    cursor = db.payroll.find().sort("month", -1)
    
    records = []
    async for doc in cursor:
        records.append({
            "id": str(doc["_id"]),
            "employeeId": doc["employee_id"],
            "month": doc["month"],
            "salaryStructure": {
                "basic": doc["salary_structure"]["basic"],
                "hra": doc["salary_structure"]["hra"],
                "allowances": doc["salary_structure"]["allowances"],
                "deductions": doc["salary_structure"]["deductions"],
                "gross_salary": doc["salary_structure"].get("gross_salary", 0.0),
                "net_salary": doc["salary_structure"].get("net_salary", 0.0)
            },
            "paymentDate": doc.get("payment_date"),
            "paymentStatus": doc.get("payment_status", "pending")
        })
    return records

@router.get("/payroll/employee/{id}")
async def get_employee_payroll(id: str, current_admin: dict = Depends(get_current_admin)):
    cursor = db.payroll.find({"employee_id": id}).sort("month", -1)
    
    records = []
    async for doc in cursor:
        records.append({
            "id": str(doc["_id"]),
            "employeeId": doc["employee_id"],
            "month": doc["month"],
            "salaryStructure": {
                "basic": doc["salary_structure"]["basic"],
                "hra": doc["salary_structure"]["hra"],
                "allowances": doc["salary_structure"]["allowances"],
                "deductions": doc["salary_structure"]["deductions"],
                "gross_salary": doc["salary_structure"].get("gross_salary", 0.0),
                "net_salary": doc["salary_structure"].get("net_salary", 0.0)
            },
            "paymentDate": doc.get("payment_date"),
            "paymentStatus": doc.get("payment_status", "pending")
        })
    return records

@router.post("/payroll")
async def create_payroll(data: PayrollCreate, current_admin: dict = Depends(get_current_admin)):
    # Check if employee exists
    employee = await db.employees.find_one({"employee_id": data.employeeId})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    # Check if record for this month already exists
    existing = await db.payroll.find_one({"employee_id": data.employeeId, "month": data.month})
    if existing:
        raise HTTPException(status_code=400, detail=f"Payroll already processed for {data.employeeId} in month {data.month}")
        
    # Server side calculation of gross and net
    basic = data.salary_structure.basic
    hra = data.salary_structure.hra
    allowances = data.salary_structure.allowances
    deductions = data.salary_structure.deductions
    
    gross, net = calculate_salary(basic, hra, allowances, deductions)
    
    payment_date = None
    if data.payment_status == "paid":
        payment_date = dt.date.today().isoformat()
        
    new_payroll = {
        "employee_id": data.employeeId,
        "month": data.month,
        "salary_structure": {
            "basic": basic,
            "hra": hra,
            "allowances": allowances,
            "deductions": deductions,
            "gross_salary": gross,
            "net_salary": net
        },
        "payment_date": payment_date,
        "payment_status": data.payment_status,
        "created_at": dt.datetime.utcnow(),
        "updated_at": dt.datetime.utcnow()
    }
    
    result = await db.payroll.insert_one(new_payroll)
    
    return {
        "id": str(result.inserted_id),
        "employeeId": data.employeeId,
        "month": data.month,
        "salaryStructure": {
            "basic": basic,
            "hra": hra,
            "allowances": allowances,
            "deductions": deductions,
            "gross_salary": gross,
            "net_salary": net
        },
        "paymentDate": payment_date,
        "paymentStatus": data.payment_status
    }

@router.put("/payroll/{id}")
async def update_payroll(id: str, data: PayrollUpdate, current_admin: dict = Depends(get_current_admin)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid payroll record ID")
        
    payroll = await db.payroll.find_one({"_id": ObjectId(id)})
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
        
    update_data = {}
    
    # If salary structure is provided, recalculate gross and net
    if data.salary_structure:
        basic = data.salary_structure.basic
        hra = data.salary_structure.hra
        allowances = data.salary_structure.allowances
        deductions = data.salary_structure.deductions
        gross, net = calculate_salary(basic, hra, allowances, deductions)
        
        update_data["salary_structure"] = {
            "basic": basic,
            "hra": hra,
            "allowances": allowances,
            "deductions": deductions,
            "gross_salary": gross,
            "net_salary": net
        }
        
    if data.payment_status is not None:
        update_data["payment_status"] = data.payment_status
        if data.payment_status == "paid":
            update_data["payment_date"] = dt.date.today().isoformat()
        else:
            update_data["payment_date"] = None
            
    if update_data:
        update_data["updated_at"] = dt.datetime.utcnow()
        await db.payroll.update_one({"_id": ObjectId(id)}, {"$set": update_data})
        
    updated = await db.payroll.find_one({"_id": ObjectId(id)})
    return {
        "id": str(updated["_id"]),
        "employeeId": updated["employee_id"],
        "month": updated["month"],
        "salaryStructure": {
            "basic": updated["salary_structure"]["basic"],
            "hra": updated["salary_structure"]["hra"],
            "allowances": updated["salary_structure"]["allowances"],
            "deductions": updated["salary_structure"]["deductions"],
            "gross_salary": updated["salary_structure"].get("gross_salary", 0.0),
            "net_salary": updated["salary_structure"].get("net_salary", 0.0)
        },
        "paymentDate": updated.get("payment_date"),
        "paymentStatus": updated.get("payment_status", "pending")
    }
