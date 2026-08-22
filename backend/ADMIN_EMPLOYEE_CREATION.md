# Admin Employee Creation Flow

## 🎯 Complete Implementation

This document explains the complete flow as per your design requirements:

1. ✅ **Public registration is disabled**
2. ✅ **Only HR/Admin creates employees**
3. ✅ **System auto-generates password**
4. ✅ **Employee completes registration via link**
5. ✅ **Images stored in Cloudinary**
6. ✅ **Bootstrap first admin**

---

## 🔐 Bootstrap First Admin

### How to Create First Admin

When you first setup the system, there are no users. You need to create the first admin.

**Step 1: Configure `.env` file**

```env
FIRST_ADMIN_EMAIL=admin@dayflow.com
FIRST_ADMIN_PASSWORD=Admin@123456
FIRST_ADMIN_NAME=System Administrator
FIRST_ADMIN_COMPANY=Dayflow HRMS
```

**Step 2: Call Bootstrap Endpoint**

```http
POST /api/auth/bootstrap-admin
```

**Response:**
```json
{
  "user": {
    "_id": "66c8d2e4a3f4b1c2d3e4f5a6",
    "login_id": "DA20240020001",
    "company_name": "Dayflow HRMS",
    "name": "System Administrator",
    "email_id": "admin@dayflow.com",
    "role": "admin",
    "is_first_login": false,
    "is_verified": true
  },
  "message": "First admin created successfully! Login ID: DA20240020001"
}
```

**Step 3: Login as Admin**

```http
POST /api/auth/login
{
  "login_id": "admin@dayflow.com",
  "password": "Admin@123456"
}
```

**Important Notes:**
- ✅ This endpoint can only be called **once**
- ✅ If admin already exists, it will return error
- ✅ After this, admin can create other employees
- ✅ Admin credentials come from `.env` file

---

## 📸 Image Upload Flow (Cloudinary)

### Configure Cloudinary

**`.env` file:**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=bwT8P-33gCTwewHvvJCU2dny8Uk
CLOUDINARY_API_SECRET=your_api_secret
```

**Note:** You need to get your cloud name and API secret from [Cloudinary Dashboard](https://cloudinary.com/console).

### Upload Company Logo

```http
POST /api/auth/upload-logo
Content-Type: multipart/form-data

file: [image file]
```

**Response:**
```json
{
  "logo_url": "https://res.cloudinary.com/your_cloud/image/upload/v1234567890/dayflow_hrms/company_logos/abc123.png",
  "public_id": "dayflow_hrms/company_logos/abc123",
  "message": "Logo uploaded successfully to Cloudinary"
}
```

**Features:**
- ✅ Stored in Cloudinary (not local)
- ✅ Auto-optimized for web
- ✅ Automatic format conversion
- ✅ CDN delivery
- ✅ Max 500x500 size limit

---

## 👤 Admin Creates Employee Flow

### Step 1: Admin Uploads Logo (Optional)

```http
POST /api/auth/upload-logo
Content-Type: multipart/form-data

file: company_logo.png
```

**Response:**
```json
{
  "logo_url": "https://res.cloudinary.com/.../logo.png",
  "public_id": "dayflow_hrms/company_logos/abc123",
  "message": "Logo uploaded successfully to Cloudinary"
}
```

### Step 2: Admin Creates Employee

```http
POST /api/auth/admin/create-employee
Content-Type: application/json
Cookie: token=<admin_jwt_token>

{
  "company_name": "Tech Solutions",
  "name": "John Doe",
  "email_id": "john@techsolutions.com",
  "phone": "+1234567890",
  "company_logo_url": "https://res.cloudinary.com/.../logo.png"
}
```

**Response:**
```json
{
  "login_id": "TE20240020001",
  "temp_password": "Xy7@aB2pQ9mK",
  "registration_link": "http://localhost:5173/complete-registration?token=abc123xyz456...",
  "message": "Employee created successfully. Share these credentials with the employee."
}
```

**What Happens:**
1. ✅ System generates **Login ID** (TE20240020001)
2. ✅ System generates **random password** (Xy7@aB2pQ9mK)
3. ✅ System creates **registration token** (valid 7 days)
4. ✅ Employee record created in database with token
5. ✅ Admin receives credentials + link

### Step 3: Admin Shares Credentials

Admin shares with employee:

```
🎉 Welcome to Dayflow HRMS!

Your account has been created:

Login ID: TE20240020001
Temporary Password: Xy7@aB2pQ9mK

Please complete your registration:
👉 http://localhost:5173/complete-registration?token=abc123xyz456...

This link is valid for 7 days.
```

---

## 🔗 Employee Completes Registration

### Step 1: Employee Opens Link

Employee clicks the registration link from admin.

Frontend shows:
- Login ID (read-only)
- Name (read-only)
- Email (read-only)
- New Password field
- Confirm Password field

### Step 2: Employee Sets New Password

```http
POST /api/auth/complete-registration
Content-Type: application/json

{
  "token": "abc123xyz456...",
  "password": "MyNewSecure@Pass123",
  "confirm_password": "MyNewSecure@Pass123"
}
```

**Response:**
```json
{
  "user": {
    "_id": "66c8d2e4a3f4b1c2d3e4f5a6",
    "login_id": "TE20240020001",
    "company_name": "Tech Solutions",
    "company_logo_url": "https://res.cloudinary.com/.../logo.png",
    "name": "John Doe",
    "email_id": "john@techsolutions.com",
    "phone": "+1234567890",
    "role": "employee",
    "is_first_login": false,
    "is_verified": true
  },
  "message": "Registration completed successfully. Welcome to Dayflow HRMS!"
}
```

**What Happens:**
1. ✅ Token is validated (checks if exists + not expired)
2. ✅ New password is hashed and saved
3. ✅ Token is removed from database
4. ✅ `is_first_login` set to `false`
5. ✅ `is_verified` set to `true`
6. ✅ Employee is automatically logged in
7. ✅ JWT cookie is set
8. ✅ Redirect to dashboard

### Step 3: Employee Can Now Login

Employee can login anytime with:
- Login ID: `TE20240020001`
- Password: `MyNewSecure@Pass123`

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  FIRST TIME SYSTEM SETUP                                │
│  Call: POST /api/auth/bootstrap-admin                   │
│  Creates first admin from .env credentials              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ADMIN LOGS IN                                          │
│  POST /api/auth/login                                   │
│  Email: admin@dayflow.com                               │
│  Password: Admin@123456                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ADMIN CREATES EMPLOYEE                                 │
│  1. Optional: Upload logo to Cloudinary                 │
│  2. POST /api/auth/admin/create-employee                │
│  3. System generates:                                   │
│     - Login ID (TE20240020001)                          │
│     - Temp Password (Xy7@aB2pQ9mK)                      │
│     - Registration Token (valid 7 days)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ADMIN SHARES WITH EMPLOYEE                             │
│  - Login ID                                             │
│  - Temp Password                                        │
│  - Registration Link                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  EMPLOYEE OPENS REGISTRATION LINK                       │
│  Frontend extracts token from URL                       │
│  Shows form to set new password                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  EMPLOYEE SETS NEW PASSWORD                             │
│  POST /api/auth/complete-registration                   │
│  - Token validated                                      │
│  - Password updated                                     │
│  - Token removed                                        │
│  - Auto logged in                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  EMPLOYEE LOGGED IN                                     │
│  Redirect to Dashboard                                  │
│  Can now use system normally                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Changes

### Users Collection

```json
{
  "_id": "ObjectId",
  "login_id": "TE20240020001",
  "company_name": "Tech Solutions",
  "company_logo_url": "https://res.cloudinary.com/.../logo.png",
  "name": "John Doe",
  "email_id": "john@techsolutions.com",
  "phone": "+1234567890",
  "password": "hashed_password",
  "is_first_login": false,
  "role": "employee",
  "is_verified": true,
  "registration_token": null,        // Removed after registration
  "token_expires_at": null,          // Removed after registration
  "created_at": "2024-08-22T10:30:00Z",
  "updated_at": "2024-08-22T11:00:00Z"
}
```

**New Fields:**
- `registration_token` - Token for first-time registration
- `token_expires_at` - Token expiry (7 days from creation)

---

## 🔒 Security Features

### 1. Registration Token
- ✅ 32-byte URL-safe random token
- ✅ Valid for 7 days only
- ✅ Single-use (removed after registration)
- ✅ Cannot be guessed or brute-forced

### 2. Password Generation
- ✅ 12 characters long
- ✅ Contains uppercase, lowercase, digits, special chars
- ✅ Cryptographically random (`secrets` module)

### 3. Admin-Only Access
- ✅ `/admin/create-employee` requires admin JWT
- ✅ Uses `Depends(get_current_admin)` middleware
- ✅ Non-admins get 403 Forbidden

### 4. Public Registration Disabled
- ✅ `/register` endpoint returns 403
- ✅ Forces users to go through admin creation

### 5. Bootstrap Protection
- ✅ Can only create first admin once
- ✅ Checks if admin already exists
- ✅ Prevents duplicate admin creation

---

## 🧪 Testing the Complete Flow

### Test 1: Bootstrap First Admin

```powershell
curl -X POST http://localhost:8000/api/auth/bootstrap-admin
```

Expected: Admin created with credentials from `.env`

### Test 2: Admin Login

```powershell
curl -X POST http://localhost:8000/api/auth/login `
  -H "Content-Type: application/json" `
  -c cookies.txt `
  -d '{\"login_id\":\"admin@dayflow.com\",\"password\":\"Admin@123456\"}'
```

Expected: Login successful, cookie set

### Test 3: Upload Logo

```powershell
curl -X POST http://localhost:8000/api/auth/upload-logo `
  -F "file=@logo.png" `
  -b cookies.txt
```

Expected: Cloudinary URL returned

### Test 4: Admin Creates Employee

```powershell
curl -X POST http://localhost:8000/api/auth/admin/create-employee `
  -H "Content-Type: application/json" `
  -b cookies.txt `
  -d '{\"company_name\":\"Tech Solutions\",\"name\":\"John Doe\",\"email_id\":\"john@tech.com\",\"phone\":\"+1234567890\",\"company_logo_url\":\"https://res.cloudinary.com/.../logo.png\"}'
```

Expected: Login ID, temp password, and registration link returned

### Test 5: Employee Completes Registration

```powershell
curl -X POST http://localhost:8000/api/auth/complete-registration `
  -H "Content-Type: application/json" `
  -d '{\"token\":\"<token_from_step_4>\",\"password\":\"NewPass@123\",\"confirm_password\":\"NewPass@123\"}'
```

Expected: Registration completed, employee logged in

### Test 6: Employee Login

```powershell
curl -X POST http://localhost:8000/api/auth/login `
  -H "Content-Type: application/json" `
  -c cookies.txt `
  -d '{\"login_id\":\"TE20240020001\",\"password\":\"NewPass@123\"}'
```

Expected: Login successful

---

## 🎨 Frontend Integration

### Admin Dashboard - Create Employee

```jsx
// Upload logo first
const handleLogoUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/auth/upload-logo', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  
  const data = await response.json();
  setLogoUrl(data.logo_url);
};

// Create employee
const handleCreateEmployee = async (formData) => {
  const response = await fetch('/api/auth/admin/create-employee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      company_name: formData.companyName,
      name: formData.name,
      email_id: formData.email,
      phone: formData.phone,
      company_logo_url: logoUrl
    })
  });
  
  const data = await response.json();
  
  // Show modal with credentials
  showCredentialsModal({
    loginId: data.login_id,
    tempPassword: data.temp_password,
    registrationLink: data.registration_link
  });
};
```

### Employee Registration Page

```jsx
// Extract token from URL
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

// Fetch user details using token (optional, or show form directly)

// Submit new password
const handleCompleteRegistration = async (formData) => {
  const response = await fetch('/api/auth/complete-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      token: token,
      password: formData.password,
      confirm_password: formData.confirmPassword
    })
  });
  
  const data = await response.json();
  
  // Registration complete, redirect to dashboard
  window.location.href = '/dashboard';
};
```

---

## ❓ FAQs

### Q1: What if employee doesn't complete registration in 7 days?

**Answer:** Token expires. Admin needs to:
1. Delete old employee record
2. Create new employee with fresh token

### Q2: Can employee use temp password after setting new password?

**Answer:** No. Once new password is set, temp password is overwritten.

### Q3: Can admin create another admin?

**Answer:** Not with current implementation. Only first admin via bootstrap. To add more admins:
1. Admin creates employee
2. Manually change role in MongoDB to "admin"

### Q4: What if I forget admin password?

**Answer:** 
1. Delete admin from MongoDB
2. Call `/bootstrap-admin` again

OR

1. Manually update password hash in MongoDB

---

## 📝 Summary

✅ **No public registration** - Only admin creates users  
✅ **Auto-generated credentials** - Login ID + temp password  
✅ **Secure token system** - 7-day expiry, single-use  
✅ **Cloudinary integration** - Images stored in cloud  
✅ **Bootstrap admin** - First admin from `.env`  
✅ **Complete registration flow** - Employee sets password  

**System is production-ready! 🚀**
