# Database Schema Documentation

Dayflow HRMS uses a MongoDB database. The connection client is initialized via Motor asynchronously.

## Collections & Indexes

---

### 1. `users`
Stores user credentials, hashed passwords, and authorization roles.

* **Indexes:**
  * `employee_id` (Unique, ascending)
  * `email` (Unique, ascending)

* **Document Schema:**
```json
{
  "_id": "ObjectId",
  "employee_id": "string (unique)",
  "email": "string (unique)",
  "password_hash": "string (bcrypt)",
  "role": "admin | employee",
  "is_verified": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

### 2. `employees`
Stores detailed employee profiles. Maps to user credentials via `user_id`.

* **Indexes:**
  * `employee_id` (Unique, ascending)
  * `user_id` (Ascending)

* **Document Schema:**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "employee_id": "string (unique)",
  "name": "string",
  "email": "string",
  "phone": "string",
  "dob": "string (YYYY-MM-DD)",
  "address": "string",
  "avatar": "string | null (url)",
  "designation": "string",
  "department": "string",
  "joiningDate": "string (YYYY-MM-DD)",
  "location": "string",
  "manager": "string",
  "employmentStatus": "Active | Terminated",
  "status": "present | absent | leave"
}
```

---

### 3. `attendance`
Logs check-in and check-out times, working hours, and daily attendance status.

* **Indexes:**
  * `(employee_id, date)` (Unique composite index)

* **Document Schema:**
```json
{
  "_id": "ObjectId",
  "employee_id": "string",
  "date": "string (YYYY-MM-DD)",
  "check_in": "string (HH:MM) | null",
  "check_out": "string (HH:MM) | null",
  "status": "present | absent | half-day | leave",
  "working_hours": "double",
  "remarks": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

### 4. `leaves`
Manages leave requests applied by employees and approved/rejected by admins.

* **Indexes:**
  * `employee_id` (Ascending)
  * `status` (Ascending)

* **Document Schema:**
```json
{
  "_id": "ObjectId",
  "employee_id": "string",
  "leave_type": "paid | sick | unpaid",
  "start_date": "string (YYYY-MM-DD)",
  "end_date": "string (YYYY-MM-DD)",
  "total_days": "int",
  "reason": "string",
  "status": "pending | approved | rejected",
  "approved_by": "string | null (employee_id of admin)",
  "admin_comments": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

### 5. `payroll`
Processes monthly payslips and records calculated gross and net salaries.

* **Indexes:**
  * `(employee_id, month)` (Unique composite index)

* **Document Schema:**
```json
{
  "_id": "ObjectId",
  "employee_id": "string",
  "month": "string (YYYY-MM)",
  "salary_structure": {
    "basic": "double",
    "hra": "double",
    "allowances": "double",
    "deductions": "double",
    "gross_salary": "double (auto-calculated)",
    "net_salary": "double (auto-calculated)"
  },
  "payment_date": "string (YYYY-MM-DD) | null",
  "payment_status": "pending | paid",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```
