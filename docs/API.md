# Dayflow HRMS API Documentation

All API endpoints are prefixed with `/api`. Authentication requires a Bearer JWT token in the `Authorization` header: `Authorization: Bearer <token>`.

---

## Authentication Endpoints

### Register Admin User
* **Path:** `POST /api/auth/register`
* **Access:** Public (First Admin setup)
* **Payload:**
```json
{
  "employee_id": "OIADM0001",
  "email": "admin@company.com",
  "password": "securepassword",
  "role": "admin"
}
```
* **Response (200 OK):**
```json
{
  "message": "User registered successfully"
}
```

### Login User
* **Path:** `POST /api/auth/login`
* **Access:** Public
* **Payload:**
```json
{
  "loginId": "OIADM0001", // can be employee_id or email
  "password": "securepassword"
}
```
* **Response (200 OK):**
```json
{
  "id": "OIADM0001",
  "user_id": "603d3c8c7d67b2d56a3e5c9f",
  "name": "Administrator",
  "email": "admin@company.com",
  "phone": "",
  "dob": "",
  "address": "",
  "avatar": null,
  "designation": "Administrator",
  "department": "HR",
  "joiningDate": "2026-08-22",
  "location": "",
  "manager": "",
  "employmentStatus": "Active",
  "status": "absent",
  "role": "admin",
  "token": "JWT_ACCESS_TOKEN_STRING"
}
```

### Logout User
* **Path:** `POST /api/auth/logout`
* **Access:** Private
* **Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

### Get Current User Profile
* **Path:** `GET /api/users/me`
* **Access:** Private
* **Response (200 OK):** Same merged profile layout as login response (minus the token).

---

## Employees Endpoints

### List All Employees
* **Path:** `GET /api/employees`
* **Access:** Private

### Get Specific Employee
* **Path:** `GET /api/employees/{id}`
* **Access:** Private

### Create Employee Profile
* **Path:** `POST /api/employees`
* **Access:** Private (Admin only)
* **Payload:**
```json
{
  "name": "Jane Watson",
  "email": "jane@company.com",
  "phone": "+91 99999 88888",
  "department": "Engineering",
  "designation": "Product Engineer",
  "joiningDate": "2026-08-22",
  "location": "Remote",
  "manager": "Alex Mercer",
  "employmentStatus": "Active"
}
```
* **Response (200 OK):** Returns created employee record. Generates default credentials (`password123`).

### Update Employee Profile
* **Path:** `PUT /api/employees/{id}`
* **Access:** Private (Admin or self)

---

## Attendance Endpoints

### Check In
* **Path:** `POST /api/attendance/check-in`
* **Access:** Private (Admin or self)
* **Payload:** `{"employeeId": "EMP001", "remarks": "Ontime"}`

### Check Out
* **Path:** `POST /api/attendance/check-out`
* **Access:** Private (Admin or self)
* **Payload:** `{"employeeId": "EMP001"}`

### List Attendance History
* **Path:** `GET /api/attendance?employeeId={empId}`
* **Access:** Private (Filtered to self if not admin)

---

## Leave Endpoints

### Apply for Leave
* **Path:** `POST /api/leaves`
* **Access:** Private
* **Payload:**
```json
{
  "employeeId": "EMP001",
  "type": "sick", // paid | sick | unpaid
  "startDate": "2026-09-01",
  "endDate": "2026-09-03",
  "reason": "Medical surgery"
}
```

### List Own Leaves History
* **Path:** `GET /api/leaves/me`
* **Access:** Private

### List All Leaves (Admin)
* **Path:** `GET /api/leaves`
* **Access:** Private (Admin only)

### List Pending Leaves (Admin)
* **Path:** `GET /api/leaves/pending`
* **Access:** Private (Admin only)

### Approve Leave
* **Path:** `PUT /api/leaves/{id}/approve`
* **Access:** Private (Admin only)
* **Payload:** `{"admin_comments": "Approved"}`

### Reject Leave
* **Path:** `PUT /api/leaves/{id}/reject`
* **Access:** Private (Admin only)
* **Payload:** `{"admin_comments": "Rejected due to urgent project deliverables"}`

---

## Payroll Endpoints

### Get Own Payroll slips
* **Path:** `GET /api/payroll/me`
* **Access:** Private (Read-only)

### Get All Payroll slips
* **Path:** `GET /api/payroll`
* **Access:** Private (Admin only)

### Process Payroll slip
* **Path:** `POST /api/payroll`
* **Access:** Private (Admin only)
* **Payload:**
```json
{
  "employeeId": "EMP001",
  "month": "2026-08",
  "salaryStructure": {
    "basic": 40000,
    "hra": 15000,
    "allowances": 8000,
    "deductions": 3000
  },
  "paymentStatus": "pending" // pending | paid
}
```

### Update Payroll slip
* **Path:** `PUT /api/payroll/{id}`
* **Access:** Private (Admin only)
* **Payload:** Allows updating `salaryStructure` and `paymentStatus`.

---

## Analytics Endpoints

### Dashboard Stats & Trend
* **Path:** `GET /api/analytics/dashboard`
* **Access:** Private (Admin only)
* **Response (200 OK):**
```json
{
  "stats": {
    "totalEmployees": 10,
    "presentToday": 8,
    "pendingLeaves": 2,
    "monthlyPayroll": 420000.00
  },
  "attendanceTrend": [
    { "date": "2026-08-16", "present": 7, "leave": 1, "absent": 2 },
    { "date": "2026-08-17", "present": 8, "leave": 1, "absent": 1 },
    ...
  ]
}
```
