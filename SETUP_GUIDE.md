# 🚀 Dayflow HRMS - Complete Setup Guide

## 📁 Project Structure

```
h1_odooXnmit/
├── backend/           # FastAPI + MongoDB + Redis
│   ├── app/
│   ├── .env
│   └── main.py
└── frontend/          # React + Vite + Tailwind
    ├── src/
    ├── package.json
    └── index.html
```

---

## 🎯 Step 1: Start Backend

```powershell
# Terminal 1 - Backend
cd d:\h1_odooXnmit\backend
.\venv\Scripts\Activate.ps1
python main.py
```

**Backend running at:** `http://localhost:8000`

---

## 🎨 Step 2: Start Frontend

```powershell
# Terminal 2 - Frontend
cd d:\h1_odooXnmit\frontend
npm run dev
```

**Frontend running at:** `http://localhost:5173`

---

## 🔐 Step 3: Bootstrap First Admin

**Option 1: API Call**
```powershell
curl http://localhost:8000/api/auth/bootstrap-admin
```

**Option 2: Swagger UI**
- Open: `http://localhost:8000/docs`
- POST `/api/auth/bootstrap-admin`
- Execute

**Response:**
```json
{
  "login_id": "DASYAD20260001",
  "message": "Admin created successfully"
}
```

**Admin Credentials:**
- Login ID: `DASYAD20260001`
- Password: `Admin@123456` (from .env)

---

## 🎯 Step 4: Login as Admin

1. Open: `http://localhost:5173/login`
2. Enter:
   - Login ID: `DASYAD20260001`
   - Password: `Admin@123456`
3. Click **Login**
4. Redirects to: `/admin/dashboard`

---

## 👥 Step 5: Create Employee

1. Click **"Create Employee"** card
2. Fill form:
   ```
   Full Name: John Doe
   Email: john.doe@techcorp.com
   Company: Tech Corp
   Department: Engineering
   Designation: Software Engineer
   Logo: [Upload image]
   ```
3. Click **"Create Employee"**

**Response:**
```
✅ Employee Created Successfully!

Login ID: TCJODO20260002
Registration Link: http://localhost:5173/register?token=eyJhbGc...
Valid for: 7 days
```

4. **Copy Registration Link** and send to employee

---

## 📝 Step 6: Employee Registration

**Employee opens registration link:**

1. URL: `http://localhost:5173/register?token=eyJhbGc...`
2. Fill form:
   ```
   Password: JohnDoe@123
   Confirm Password: JohnDoe@123
   Phone: +919876543210
   Date of Birth: 1995-05-15
   Address: 123 Main St, Mumbai
   ```
3. Click **"Complete Registration"**
4. Success → Redirects to login

---

## 🔑 Step 7: Employee Login

1. Open: `http://localhost:5173/login`
2. Enter:
   - Login ID: `TCJODO20260002`
   - Password: `JohnDoe@123`
3. Click **Login**
4. Redirects to: `/employee/dashboard`

---

## 🎨 Theme: Amethyst Haze

✅ Purple primary colors  
✅ Soft pink accents  
✅ Beautiful shadows  
✅ Dark mode support  
✅ Responsive design  

---

## 📊 Features Implemented

### Backend
- ✅ FastAPI REST API
- ✅ MongoDB Atlas integration
- ✅ Redis Cloud token blocklist
- ✅ JWT Authentication
- ✅ Auto Login ID generation (CINNNNYYYYSSSS)
- ✅ Registration token system (7 days)
- ✅ Cloudinary logo upload
- ✅ Role-based access control
- ✅ Password hashing (bcrypt)
- ✅ Bootstrap admin endpoint

### Frontend
- ✅ React 18 + Vite
- ✅ Tailwind CSS + Amethyst Haze theme
- ✅ Login page
- ✅ Admin dashboard
- ✅ Create employee form
- ✅ Employee registration
- ✅ Employee dashboard
- ✅ Protected routes
- ✅ Token management
- ✅ Responsive UI

---

## 🔐 Login ID Format

**Pattern:** `CINNNNYYYYSSSS` (14 characters)

**Examples:**
- Admin: `DASYAD20260001`
  - `DA` = Dayflow
  - `SYAD` = System + Administrator
  - `2026` = Year
  - `0001` = Serial

- Employee: `TCJODO20260002`
  - `TC` = Tech Corp
  - `JODO` = John + Doe
  - `2026` = Year
  - `0002` = Serial

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Frontend | http://localhost:5173 |
| Login | http://localhost:5173/login |
| Admin Dashboard | http://localhost:5173/admin/dashboard |
| Employee Dashboard | http://localhost:5173/employee/dashboard |

---

## ✅ Testing Checklist

- [ ] Backend server running
- [ ] Frontend dev server running
- [ ] Bootstrap admin successful
- [ ] Admin login working
- [ ] Create employee working
- [ ] Logo upload working
- [ ] Registration link generated
- [ ] Employee registration successful
- [ ] Employee login working
- [ ] Logout working
- [ ] Token blocklist working

---

## 🎯 Next Steps (Future Features)

1. **Employee Management**
   - View all employees
   - Edit employee details
   - Deactivate employee
   - Promote to admin

2. **Attendance Module**
   - Mark attendance
   - View attendance history
   - Monthly reports

3. **Leave Management**
   - Apply for leave
   - Leave approval workflow
   - Leave balance tracking

4. **Payroll Module**
   - Salary management
   - Payslip generation
   - Tax calculations

5. **Notifications**
   - Email notifications
   - In-app notifications
   - WhatsApp integration

---

## 🐛 Troubleshooting

### Backend Issues

**Issue:** `ModuleNotFoundError`
```powershell
pip install -r requirements.txt
```

**Issue:** MongoDB connection failed
- Check `.env` MongoDB URL
- Verify MongoDB Atlas whitelist

**Issue:** Redis connection failed
- Check `.env` Redis credentials
- Verify Redis Cloud instance

### Frontend Issues

**Issue:** `npm install` fails
```powershell
rm -rf node_modules
rm package-lock.json
npm install
```

**Issue:** API calls fail
- Check backend is running on port 8000
- Check CORS settings

---

## 🎉 Success!

**Your Dayflow HRMS is now running!**

Frontend: http://localhost:5173  
Backend: http://localhost:8000

**Admin Login:** `DASYAD20260001` / `Admin@123456`

🚀 Happy coding!
