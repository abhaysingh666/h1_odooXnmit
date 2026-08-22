# Dayflow - Human Resource Management System

**Every workday, perfectly aligned.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Implementation Plan](#implementation-plan)
- [Getting Started](#getting-started)
- [User Roles](#user-roles)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Future Enhancements](#future-enhancements)

---

## 🎯 Overview

**Dayflow** is a comprehensive Human Resource Management System (HRMS) designed to digitize and streamline core HR operations. The system provides secure, role-based access for managing employee onboarding, profile management, attendance tracking, leave requests, and payroll visibility.

### Key Objectives
- Simplify employee onboarding and profile management
- Automate attendance tracking with check-in/check-out functionality
- Streamline leave approval workflows
- Provide transparent payroll visibility
- Enable HR/Admin to manage workforce efficiently

---

## 🛠 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI library for building component-based interfaces |
| **Vite** | 5.x | Fast build tool and dev server |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **shadcn/ui** | Latest | Reusable component library (Radix UI + Tailwind) |
| **React Router** | 6.x | Client-side routing |
| **Axios** | Latest | HTTP client for API requests |
| **React Query** | Latest | Data fetching and state management |
| **Recharts** | Latest | Charting library for analytics |
| **date-fns** | Latest | Date manipulation utilities |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Programming language |
| **FastAPI** | 0.110+ | Modern async web framework |
| **Motor** | Latest | Async MongoDB driver |
| **Pydantic** | 2.x | Data validation using Python type hints |
| **Passlib + bcrypt** | Latest | Password hashing |
| **PyJWT** | Latest | JWT token generation and validation |
| **python-dotenv** | Latest | Environment variable management |

### Database
| Technology | Purpose |
|------------|---------|
| **MongoDB** | NoSQL database for flexible schema and scalability |

### Theme
- **Amethyst Haze** - A purple/violet and pink themed design system
- Full dark mode support
- Responsive design for desktop, tablet, and mobile

---

## ✨ Features

### 🔐 Authentication & Authorization
- [x] User registration with Employee ID, Email, Password, and Role
- [x] Secure password hashing (bcrypt)
- [x] JWT-based authentication
- [x] Email verification workflow
- [x] Role-based access control (Employee vs Admin/HR)
- [x] Session management

### 👤 Employee Features
- [x] **Dashboard**
  - Quick access cards (Profile, Attendance, Leave, Logout)
  - Today's status widget
  - Leave balance overview
  - Monthly attendance summary
  - Recent activity feed
  
- [x] **Profile Management**
  - View personal details (name, email, phone, address)
  - View job details (department, designation, join date)
  - View salary structure (read-only)
  - View and upload documents
  - Edit limited fields (address, phone, profile picture)

- [x] **Attendance**
  - Daily check-in/check-out
  - View personal attendance (daily/weekly/monthly)
  - Attendance calendar view
  - Status: Present, Absent, Half-day, Leave

- [x] **Leave Management**
  - Apply for leave (Paid, Sick, Unpaid)
  - Select date range
  - Add remarks/reason
  - Track leave status (Pending, Approved, Rejected)
  - View leave history

- [x] **Payroll**
  - View salary structure (Basic, HRA, Allowances, Deductions)
  - View monthly salary slips (read-only)

### 👨‍💼 Admin/HR Features
- [x] **Dashboard**
  - Total employees count
  - Present today count
  - Pending leave requests
  - Payroll summary
  - Attendance trends chart
  - Quick stats with percentage changes

- [x] **Employee Management**
  - View all employees list
  - Search and filter employees
  - Add new employees
  - Edit all employee details
  - View employee profiles
  - Switch between employee views

- [x] **Attendance Management**
  - View attendance of all employees
  - Filter by date, department, status
  - Export attendance reports
  - Mark attendance manually (if needed)

- [x] **Leave Approval**
  - View all leave requests
  - Filter by status (Pending, Approved, Rejected)
  - Approve/reject requests
  - Add comments to leave decisions
  - Real-time status updates

- [x] **Payroll Management**
  - View payroll of all employees
  - Update salary structures
  - Generate salary slips
  - Payroll accuracy checks

---

## 🏗 Architecture

### System Architecture
```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   React     │ ←──────→ │   FastAPI    │ ←──────→ │   MongoDB    │
│  Frontend   │   REST   │   Backend    │   Motor  │   Database   │
└─────────────┘   API    └──────────────┘          └──────────────┘
```

### Frontend Architecture
```
Pages (Routes)
  ├── Authentication (Public)
  │   ├── Sign In
  │   └── Sign Up
  │
  ├── Employee (Protected)
  │   ├── Dashboard
  │   ├── Profile
  │   ├── Attendance
  │   ├── Leave
  │   └── Payroll
  │
  └── Admin/HR (Protected + Role Check)
      ├── Dashboard
      ├── Employees
      ├── Attendance
      ├── Leave Approvals
      └── Payroll
```

### Backend Architecture
```
FastAPI Application
  ├── Routers (API endpoints)
  │   ├── auth.py
  │   ├── employees.py
  │   ├── attendance.py
  │   ├── leaves.py
  │   └── payroll.py
  │
  ├── Models (MongoDB schemas)
  │   ├── user.py
  │   ├── employee.py
  │   ├── attendance.py
  │   ├── leave.py
  │   └── payroll.py
  │
  ├── Schemas (Pydantic validation)
  │   └── (same structure as models)
  │
  ├── Core
  │   ├── config.py (settings)
  │   ├── security.py (JWT, hashing)
  │   └── database.py (MongoDB connection)
  │
  └── Utils
      ├── email.py (email verification)
      └── dependencies.py (auth dependencies)
```

---

## 📁 Project Structure

```
d:\h1_odooXnmit\
│
├── README.md                    # This file
├── .gitignore
│
├── frontend/                    # React application
│   ├── public/
│   ├── src/
│   │   ├── assets/             # Images, icons
│   │   ├── components/
│   │   │   ├── ui/             # shadcn components
│   │   │   ├── layout/         # Sidebar, Navbar, Footer
│   │   │   └── shared/         # Reusable components
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── SignIn.jsx
│   │   │   │   └── SignUp.jsx
│   │   │   ├── employee/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Profile.jsx
│   │   │   │   ├── Attendance.jsx
│   │   │   │   ├── Leave.jsx
│   │   │   │   └── Payroll.jsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Employees.jsx
│   │   │       ├── Attendance.jsx
│   │   │       ├── LeaveApprovals.jsx
│   │   │       └── Payroll.jsx
│   │   ├── lib/
│   │   │   ├── api.js          # Axios instance
│   │   │   ├── auth.js         # Auth helpers
│   │   │   └── utils.js        # Utility functions
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # Context providers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind + theme variables
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── components.json         # shadcn config
│   └── .env
│
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── employees.py
│   │   │   ├── attendance.py
│   │   │   ├── leaves.py
│   │   │   └── payroll.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── employee.py
│   │   │   ├── attendance.py
│   │   │   ├── leave.py
│   │   │   └── payroll.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── employee.py
│   │   │   ├── attendance.py
│   │   │   ├── leave.py
│   │   │   └── payroll.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── email.py
│   │       └── dependencies.py
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
└── docs/                        # Additional documentation
    ├── API.md                   # API documentation
    ├── DATABASE.md              # Database schema
    └── DEPLOYMENT.md            # Deployment guide
```

---

## 📝 Implementation Plan

### Phase 1: Project Setup (Week 1)
- [x] Initialize Git repository
- [x] Create README.md with full project plan
- [ ] Setup frontend with Vite + React
- [ ] Install and configure Tailwind CSS v4
- [ ] Setup shadcn/ui with Amethyst Haze theme
- [ ] Setup backend with FastAPI
- [ ] Configure MongoDB connection
- [ ] Setup environment variables

### Phase 2: Authentication System (Week 1-2)
- [ ] Backend: User model and schema
- [ ] Backend: JWT authentication
- [ ] Backend: Password hashing
- [ ] Backend: Auth endpoints (register, login, verify)
- [ ] Frontend: Sign In page
- [ ] Frontend: Sign Up page
- [ ] Frontend: Auth context and protected routes
- [ ] Frontend: Role-based route guards

### Phase 3: Employee Module (Week 2-3)
- [ ] Backend: Employee model and CRUD endpoints
- [ ] Backend: Profile endpoints
- [ ] Frontend: Employee dashboard layout
- [ ] Frontend: Employee dashboard stat cards
- [ ] Frontend: Profile view page
- [ ] Frontend: Profile edit functionality
- [ ] Frontend: Document upload feature

### Phase 4: Attendance Module (Week 3-4)
- [ ] Backend: Attendance model
- [ ] Backend: Check-in/check-out endpoints
- [ ] Backend: Attendance query endpoints
- [ ] Frontend: Check-in/check-out widget
- [ ] Frontend: Attendance calendar component
- [ ] Frontend: Daily/weekly/monthly views
- [ ] Admin: View all employee attendance

### Phase 5: Leave Management (Week 4-5)
- [ ] Backend: Leave model
- [ ] Backend: Leave application endpoints
- [ ] Backend: Leave approval endpoints
- [ ] Frontend: Leave application form
- [ ] Frontend: Leave history view
- [ ] Frontend: Leave status tracking
- [ ] Admin: Leave approval interface
- [ ] Admin: Add comments to leave decisions

### Phase 6: Payroll Module (Week 5-6)
- [ ] Backend: Payroll model
- [ ] Backend: Salary structure endpoints
- [ ] Backend: Payroll calculation logic
- [ ] Frontend: Employee payroll view (read-only)
- [ ] Frontend: Salary slip component
- [ ] Admin: Payroll management interface
- [ ] Admin: Update salary structures

### Phase 7: Admin Dashboard (Week 6-7)
- [ ] Backend: Analytics endpoints
- [ ] Backend: Dashboard statistics
- [ ] Frontend: Admin dashboard layout
- [ ] Frontend: Stat cards with trends
- [ ] Frontend: Attendance trend chart (Recharts)
- [ ] Frontend: Employee list with search/filter
- [ ] Frontend: Leave approval quick actions

### Phase 8: Polish & Testing (Week 7-8)
- [ ] Responsive design for mobile/tablet
- [ ] Dark mode implementation
- [ ] Error handling and validation
- [ ] Loading states and skeletons
- [ ] Toast notifications
- [ ] Unit tests (backend)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Performance optimization

### Phase 9: Documentation & Deployment (Week 8)
- [ ] API documentation (Swagger)
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] User manual
- [ ] Deploy backend (Railway/Render)
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Setup CI/CD pipeline

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.11+
- MongoDB 6.0+ (local or Atlas)
- Git

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Copy and edit .env.example

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
# Copy and edit .env.example

# Run development server
npm run dev
```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 👥 User Roles

### Employee
**Access Level:** Limited  
**Permissions:**
- View own profile
- Edit limited profile fields (address, phone, photo)
- Check-in/check-out daily
- View own attendance
- Apply for leave
- View leave status
- View own salary structure (read-only)

### Admin / HR Officer
**Access Level:** Full  
**Permissions:**
- All employee permissions
- View all employee profiles
- Edit all employee details
- Add/remove employees
- View all employee attendance
- Approve/reject leave requests
- Add comments to leave decisions
- View all employee payroll
- Update salary structures
- Generate reports

---

## 🗄 Database Schema

### Users Collection
```json
{
  "_id": "ObjectId",
  "employee_id": "string (unique)",
  "email": "string (unique)",
  "password_hash": "string",
  "role": "employee | admin",
  "is_verified": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Employees Collection
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: Users)",
  "employee_id": "string",
  "personal_details": {
    "first_name": "string",
    "last_name": "string",
    "phone": "string",
    "address": "string",
    "profile_picture": "string (url)"
  },
  "job_details": {
    "department": "string",
    "designation": "string",
    "join_date": "date",
    "employment_type": "full-time | part-time | contract"
  },
  "documents": [
    {
      "name": "string",
      "url": "string",
      "uploaded_at": "datetime"
    }
  ],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Attendance Collection
```json
{
  "_id": "ObjectId",
  "employee_id": "ObjectId (ref: Employees)",
  "date": "date",
  "check_in": "datetime",
  "check_out": "datetime",
  "status": "present | absent | half-day | leave",
  "working_hours": "number",
  "remarks": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Leaves Collection
```json
{
  "_id": "ObjectId",
  "employee_id": "ObjectId (ref: Employees)",
  "leave_type": "paid | sick | unpaid",
  "start_date": "date",
  "end_date": "date",
  "total_days": "number",
  "reason": "string",
  "status": "pending | approved | rejected",
  "approved_by": "ObjectId (ref: Users)",
  "admin_comments": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Payroll Collection
```json
{
  "_id": "ObjectId",
  "employee_id": "ObjectId (ref: Employees)",
  "month": "string (YYYY-MM)",
  "salary_structure": {
    "basic": "number",
    "hra": "number",
    "allowances": "number",
    "deductions": "number",
    "gross_salary": "number",
    "net_salary": "number"
  },
  "payment_date": "date",
  "payment_status": "pending | paid",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
POST   /api/auth/verify-email  - Verify email
POST   /api/auth/refresh       - Refresh JWT token
POST   /api/auth/logout        - Logout user
```

### Employees
```
GET    /api/employees          - Get all employees (admin)
GET    /api/employees/{id}     - Get employee by ID
POST   /api/employees          - Create employee (admin)
PUT    /api/employees/{id}     - Update employee
DELETE /api/employees/{id}     - Delete employee (admin)
GET    /api/employees/me       - Get current user profile
```

### Attendance
```
GET    /api/attendance                      - Get attendance records
GET    /api/attendance/me                   - Get own attendance
POST   /api/attendance/check-in             - Check-in
POST   /api/attendance/check-out            - Check-out
GET    /api/attendance/employee/{id}        - Get employee attendance (admin)
GET    /api/attendance/statistics           - Get attendance stats
```

### Leaves
```
GET    /api/leaves                - Get leave requests
GET    /api/leaves/me             - Get own leaves
POST   /api/leaves                - Apply for leave
PUT    /api/leaves/{id}/approve   - Approve leave (admin)
PUT    /api/leaves/{id}/reject    - Reject leave (admin)
GET    /api/leaves/pending        - Get pending leaves (admin)
```

### Payroll
```
GET    /api/payroll                      - Get all payroll records (admin)
GET    /api/payroll/me                   - Get own payroll
GET    /api/payroll/employee/{id}        - Get employee payroll (admin)
POST   /api/payroll                      - Create payroll (admin)
PUT    /api/payroll/{id}                 - Update payroll (admin)
```

---

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] Email and notification alerts
- [ ] Analytics & reports dashboard
- [ ] Salary slip PDF generation
- [ ] Attendance report export (Excel/CSV)
- [ ] Employee performance tracking
- [ ] Task management integration
- [ ] Multi-language support
- [ ] Mobile app (React Native)

### Advanced Features
- [ ] Biometric attendance integration
- [ ] Geolocation-based check-in
- [ ] Shift management
- [ ] Overtime calculation
- [ ] Holiday calendar
- [ ] Employee self-service portal
- [ ] HR chatbot
- [ ] Advanced analytics with AI insights

---

## 📄 License

This project is proprietary and confidential.

---

## 👨‍💻 Development Team

**Project:** Dayflow HRMS  
**Status:** In Development  
**Start Date:** August 2026

---

## 📞 Support

For questions or issues, please contact the development team.

---

**Built with ❤️ using React, FastAPI, and MongoDB**
