# 🚀 Dayflow HRMS - Human Resource Management System

> **Every workday, perfectly aligned.**

Dayflow is a modern, full-stack **Human Resource Management System (HRMS)** built to streamline employee onboarding, shift attendance tracking, leave request approval workflows, payroll structures, printable payslips, and automated email alerts.

---

## ⚡ Tech Stack

- **Backend**: Python 3.12+, FastAPI, Motor (Async MongoDB Driver), MongoDB Atlas Cloud, PyJWT, Bcrypt
- **Frontend**: React 18, Vite 5, Tailwind CSS v4, Framer Motion, Recharts, Lucide Icons
- **Theme**: Amethyst Haze (OKLCH Color Tokens, Dark/Light Mode Support)

---

## ✨ Features & Functional Matrix

### 🔐 1. Authentication & Security
- **Sign Up / Sign In**: Email & password authentication with bcrypt hashing.
- **Auto-Generated Employee IDs**: Standardized login identifiers (`OI...`).
- **Role-Based Access Control**: Strict segregation between **Employee** and **HR Admin / Officer** roles.

### 📊 2. Role-Based Dashboards
- **Employee Dashboard**: Live shift check-in/check-out widget with real-time timer, leave summary, and personal attendance history.
- **Admin Dashboard**: Real-time workforce metrics, 7-day attendance trend area chart, pending leave counters, and recent employee directory.

### 👤 3. Profile Management
- **Employee View**: Personal details, job details, bank account info, skills, certifications, and editable contact info (Phone, Address, Bio).
- **Admin Control**: Complete workforce directory inspection and employee profile management.

### ⏱️ 4. Attendance Management
- **Shift Tracking**: Instant Check-In / Check-Out actions.
- **Automated Status Calculation**: Evaluates working hours and sets shift status (`Present`, `Half-day` for shifts < 4h, `On Leave`, `Absent`).
- **IST Timezone Tracking**: All shift check-ins, check-outs, and date calculations operate natively in Indian Standard Time (IST, UTC+5:30).
- **CSV Export**: One-click export of workforce attendance reports to CSV for HR.

### 🌴 5. Leave & Time-Off Management
- **Interactive Calendar View**: Visual month calendar grid for choosing and picking leave dates directly.
- **Leave Application**: Employees apply for `Paid`, `Sick`, or `Unpaid` leave with date range selection and reasons.
- **HR Approvals**: HR Admins review pending requests and **Approve** or **Reject** with custom remarks.

### 💰 6. Payroll Management & Payslip PDF
- **Salary Breakdown**: View Basic, HRA, Standard Allowances, PF, Tax, Gross & Net Salary.
- **Printable Payslip PDF**: One-click official **Dayflow HRMS Payslip Statement** download/print view.
- **HR Salary Structure Control**: Admins can edit salary components and toggle payment statuses (`Paid` / `Pending`).

### 📧 7. Email Alerts & Notifications
- **Automated Email Notifications**: Dispatched for Registration Welcome, Shift Check-Ins, Leave Submissions, and HR Approvals/Rejections.
- **System Notification Drawer**: Interactive popover in Navbar with real-time alert logs.

---

## 🛠️ Step-by-Step Setup & How to Run

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB Atlas account (or local MongoDB instance)

---

### 1️⃣ Step 1: Start the Backend (FastAPI)

Open a PowerShell terminal and execute:

```powershell
cd backend
.\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger API Docs**: `http://localhost:8000/docs`

---

### 2️⃣ Step 2: Start the Frontend (React + Vite)

Open a **second PowerShell terminal** and execute:

```powershell
cd frontend
npm run dev
```

- **Application URL**: `http://localhost:5173`

---

## 🔑 Environment Variables Guide

### Backend Environment: `backend/.env`

```env
# Database Connection (MongoDB Atlas or Local)
MONGODB_URL=mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/?appName=Cluster1
DATABASE_NAME=dayflow_db

# Security & JWT Secrets
SECRET_KEY=amethyst-haze-dayflow-super-secret-key-2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Email & SMTP Alert Configuration (Optional - falls back to MongoDB notification logging if blank)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SENDER_EMAIL=noreply@dayflow-hrms.com
```

### Frontend Environment: `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 📜 API Route Endpoints Summary

| Endpoint | Method | Access | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/register` | `POST` | Public | Register new Employee or Admin account |
| `/api/auth/login` | `POST` | Public | Authenticate user and return JWT bearer token |
| `/api/auth/me` | `GET` | Authenticated | Retrieve current session user & employee profile |
| `/api/employees` | `GET` | Admin | Retrieve all workforce employee records & live statuses |
| `/api/employees/me` | `GET / PUT` | Authenticated | Retrieve or update current user's profile |
| `/api/attendance/check-in` | `POST` | Authenticated | Log shift check-in |
| `/api/attendance/check-out` | `POST` | Authenticated | Log shift check-out & calculate hours / status |
| `/api/leaves` | `POST / GET` | Authenticated / Admin | Apply for leave (User) or view all requests (Admin) |
| `/api/leaves/{id}/approve` | `PUT` | Admin | Approve leave request with comments |
| `/api/leaves/{id}/reject` | `PUT` | Admin | Reject leave request with comments |
| `/api/payroll/me` | `GET` | Authenticated | Retrieve employee's read-only salary structure |
| `/api/payroll/{id}` | `PUT` | Admin | Update employee's salary structure & payment status |

---

## 🎨 License

This project was built for hackathon demonstration. All rights reserved.
