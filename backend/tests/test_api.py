import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient
from unittest.mock import patch
import datetime as dt

# We will mock the database using a mock client before importing app
with patch('motor.motor_asyncio.AsyncIOMotorClient') as mock_client:
    from main import app

client = TestClient(app)

# Helper function to get auth headers
def get_auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(autouse=True)
async def mock_db():
    # Setup mock mongodb
    mock_motor_client = AsyncMongoMockClient()
    mock_db_instance = mock_motor_client["test_db"]
    
    # We patch db in core.database and dependencies
    with patch("app.core.database.db", mock_db_instance), \
         patch("app.utils.dependencies.db", mock_db_instance), \
         patch("app.routers.auth.db", mock_db_instance), \
         patch("app.routers.employees.db", mock_db_instance), \
         patch("app.routers.attendance.db", mock_db_instance), \
         patch("app.routers.leaves.db", mock_db_instance), \
         patch("app.routers.payroll.db", mock_db_instance), \
         patch("app.routers.analytics.db", mock_db_instance):
        yield mock_db_instance

@pytest.mark.anyio
async def test_register_admin(mock_db):
    response = client.post(
        "/api/auth/register",
        json={
            "employee_id": "TESTADM01",
            "email": "admin@example.com",
            "password": "password123",
            "role": "admin"
        }
    )
    assert response.status_code == 200
    assert response.json()["message"] == "User registered successfully"
    
    # Verify DB insertion
    user = await mock_db.users.find_one({"employee_id": "TESTADM01"})
    assert user is not None
    assert user["email"] == "admin@example.com"
    assert user["role"] == "admin"

@pytest.mark.anyio
async def test_login_and_me(mock_db):
    # Register admin first
    client.post(
        "/api/auth/register",
        json={
            "employee_id": "TESTADM01",
            "email": "admin@example.com",
            "password": "password123",
            "role": "admin"
        }
    )
    
    # Login
    response = client.post(
        "/api/auth/login",
        json={
            "loginId": "TESTADM01",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["role"] == "admin"
    assert data["id"] == "TESTADM01"
    
    token = data["token"]
    
    # Test GET /api/users/me
    response_me = client.get("/api/users/me", headers=get_auth_headers(token))
    assert response_me.status_code == 200
    assert response_me.json()["role"] == "admin"

@pytest.mark.anyio
async def test_leave_application_validations(mock_db):
    # Register & login employee
    client.post(
        "/api/auth/register",
        json={
            "employee_id": "TESTEMP01",
            "email": "emp@example.com",
            "password": "password123",
            "role": "employee"
        }
    )
    login_res = client.post(
        "/api/auth/login",
        json={
            "loginId": "TESTEMP01",
            "password": "password123"
        }
    )
    token = login_res.json()["token"]
    
    # Chronology validation error (end date before start date)
    response_invalid_date = client.post(
        "/api/leaves",
        json={
            "employeeId": "TESTEMP01",
            "type": "sick",
            "startDate": "2026-09-05",
            "endDate": "2026-09-01",
            "reason": "Test Chronology"
        },
        headers=get_auth_headers(token)
    )
    assert response_invalid_date.status_code == 400
    assert "End date must be greater than or equal to start date" in response_invalid_date.json()["detail"]

    # Valid leave application
    response_valid = client.post(
        "/api/leaves",
        json={
            "employeeId": "TESTEMP01",
            "type": "sick",
            "startDate": "2026-09-01",
            "endDate": "2026-09-05",
            "reason": "Valid Sick Leave"
        },
        headers=get_auth_headers(token)
    )
    assert response_valid.status_code == 200
    assert response_valid.json()["totalDays"] == 5
    assert response_valid.json()["status"] == "pending"

    # Overlapping request validation error
    response_overlap = client.post(
        "/api/leaves",
        json={
            "employeeId": "TESTEMP01",
            "type": "paid",
            "startDate": "2026-09-03",
            "endDate": "2026-09-07",
            "reason": "Overlapping Request"
        },
        headers=get_auth_headers(token)
    )
    assert response_overlap.status_code == 400
    assert "Overlapping leave request already exists" in response_overlap.json()["detail"]

@pytest.mark.anyio
async def test_payroll_calculations(mock_db):
    # Register & Login Admin
    client.post(
        "/api/auth/register",
        json={
            "employee_id": "TESTADM01",
            "email": "admin@example.com",
            "password": "password123",
            "role": "admin"
        }
    )
    login_res = client.post(
        "/api/auth/login",
        json={
            "loginId": "TESTADM01",
            "password": "password123"
        }
    )
    token = login_res.json()["token"]
    
    # Create employee record
    client.post(
        "/api/employees",
        json={
            "name": "Alex Mercer",
            "email": "alex@company.com",
            "department": "Engineering",
            "designation": "Staff Engineer",
            "joiningDate": "2026-08-22",
            "employmentStatus": "Active"
        },
        headers=get_auth_headers(token)
    )
    
    # Resolve generated employee id
    emp = await mock_db.employees.find_one({"email": "alex@company.com"})
    emp_id = emp["employee_id"]
    
    # Process payroll
    payroll_response = client.post(
        "/api/payroll",
        json={
            "employeeId": emp_id,
            "month": "2026-08",
            "salaryStructure": {
                "basic": 50000.00,
                "hra": 20000.00,
                "allowances": 10000.00,
                "deductions": 5000.00
            },
            "paymentStatus": "pending"
        },
        headers=get_auth_headers(token)
    )
    assert payroll_response.status_code == 200
    data = payroll_response.json()
    assert data["salaryStructure"]["gross_salary"] == 80000.00  # 50k + 20k + 10k
    assert data["salaryStructure"]["net_salary"] == 75000.00    # 80k - 5k
