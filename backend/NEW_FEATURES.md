# Updated Authentication Features

## 🎯 New Features Implemented

Based on your design requirements, the following features have been added to the authentication system:

### ✅ Sign Up Page Features

1. **Company Name Field**
   - Required field
   - Min 2 characters, Max 100 characters
   - Used to generate Login ID prefix

2. **Company Logo Upload**
   - Upload endpoint: `POST /api/auth/upload-logo`
   - Supported formats: JPEG, PNG, WEBP
   - Stored in `/uploads/company_logos/`
   - Returns URL to use in registration

3. **Full Name Field**
   - Replaces "first_name"
   - Complete user name (not just first name)

4. **Phone Number Field**
   - Required for registration
   - Validates format (10-15 digits)
   - Accepts international format (+1234567890)

5. **Password Confirmation**
   - Must match primary password
   - Validated on backend

6. **Auto-Generated Login ID**
   - Format: `CIYYYYQQQSSSSS`
   - Example: `TE20240020001`
   - Returned in registration response
   - User should save this for login

### ✅ Sign In Page Features

1. **Flexible Login ID Field**
   - Accepts either Login ID OR Email
   - Single input field for both

2. **Password Field**
   - Standard password input

3. **First Login Detection**
   - `is_first_login` flag in user model
   - Message prompts password change

### ✅ Login ID Auto-Generation

**Format Breakdown:**
```
CI YYYY QQQ SSSSS
││ ││││ │││ │││││
││ ││││ │││ └───── Serial Number (00001-99999)
││ ││││ └──────── Quarter (001-004)
││ └───────────── Year (2024)
└──────────────── Company Initial (First 2 letters)
```

**Example Generation:**
- Company: "Tech Solutions"
- Date: June 2024 (Q2)
- First employee of year
- **Result:** `TE20240020001`

**Advantages:**
- ✅ Human-readable
- ✅ Unique per registration
- ✅ Chronologically sortable
- ✅ Professional format
- ✅ Company identification

### ✅ Password Management

1. **First-Time Password**
   - User sets password on registration
   - Can be changed after first login
   - `is_first_login` flag tracks this

2. **Change Password Feature**
   - Endpoint: `POST /api/auth/change-password`
   - Requires old password verification
   - Sets `is_first_login = false`

## 📊 Updated Database Schema

### Users Collection

```json
{
  "_id": "ObjectId",
  "login_id": "TE20240020001",          // NEW: Auto-generated
  "company_name": "Tech Solutions",      // NEW: Company name
  "company_logo_url": "/uploads/...",    // NEW: Company logo
  "name": "John Doe",                    // UPDATED: Full name
  "email_id": "john@techsolutions.com",
  "phone": "+1234567890",                // NEW: Phone number
  "password": "hashed_password",
  "is_first_login": true,                // NEW: First login flag
  "role": "employee",
  "is_verified": false,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Removed Fields

- ❌ `employee_id` (replaced by auto-generated `login_id`)
- ❌ `first_name` (replaced by `name`)

### Added Fields

- ✅ `login_id` - Auto-generated unique identifier
- ✅ `company_name` - Company information
- ✅ `company_logo_url` - Path to uploaded logo
- ✅ `name` - Full name instead of first name
- ✅ `phone` - Contact number
- ✅ `is_first_login` - Tracks password change status

## 🔄 Updated API Endpoints

### 1. Upload Company Logo

```http
POST /api/auth/upload-logo
Content-Type: multipart/form-data

file: [image file]
```

**Response:**
```json
{
  "logo_url": "/uploads/company_logos/abc-123.png",
  "message": "Logo uploaded successfully"
}
```

**Validation:**
- Accepts: JPEG, PNG, WEBP
- Max size: (default unlimited, can be configured)
- Generates unique filename (UUID)

### 2. Register (Updated)

```http
POST /api/auth/register
Content-Type: application/json

{
  "company_name": "Tech Solutions",
  "name": "John Doe",
  "email_id": "john@techsolutions.com",
  "phone": "+1234567890",
  "password": "SecurePass123",
  "confirm_password": "SecurePass123",
  "company_logo_url": "/uploads/company_logos/abc-123.png"
}
```

**Response:**
```json
{
  "user": {
    "_id": "66c8d2e4a3f4b1c2d3e4f5a6",
    "login_id": "TE20240020001",
    "company_name": "Tech Solutions",
    "company_logo_url": "/uploads/company_logos/abc-123.png",
    "name": "John Doe",
    "email_id": "john@techsolutions.com",
    "phone": "+1234567890",
    "role": "employee",
    "is_first_login": true,
    "is_verified": false
  },
  "message": "User Registered Successfully. Your Login ID is: TE20240020001"
}
```

**Important:** The Login ID is returned in the message. Frontend should display this prominently!

### 3. Login (Updated)

```http
POST /api/auth/login
Content-Type: application/json

{
  "login_id": "TE20240020001",
  "password": "SecurePass123"
}
```

**OR with email:**
```http
{
  "login_id": "john@techsolutions.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "user": {
    "_id": "66c8d2e4a3f4b1c2d3e4f5a6",
    "login_id": "TE20240020001",
    "company_name": "Tech Solutions",
    "company_logo_url": "/uploads/company_logos/abc-123.png",
    "name": "John Doe",
    "email_id": "john@techsolutions.com",
    "phone": "+1234567890",
    "role": "employee",
    "is_first_login": true,
    "is_verified": false
  },
  "message": "Logged In Successfully. Please change your password after first login."
}
```

**Note:** If `is_first_login` is `true`, the message suggests changing password.

### 4. Change Password (New)

```http
POST /api/auth/change-password
Content-Type: application/json
Cookie: token=<jwt_token>

{
  "old_password": "SecurePass123",
  "new_password": "NewSecurePass456",
  "confirm_new_password": "NewSecurePass456"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

**Side Effects:**
- Sets `is_first_login = false`
- Updates `updated_at` timestamp

## 🎨 Frontend Integration Guide

### Sign Up Page Flow

```jsx
// Step 1: Upload logo (optional)
const handleLogoUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/auth/upload-logo', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  setLogoUrl(data.logo_url);
};

// Step 2: Register with all details
const handleRegister = async (formData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_name: formData.companyName,
      name: formData.name,
      email_id: formData.email,
      phone: formData.phone,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      company_logo_url: logoUrl
    })
  });
  
  const data = await response.json();
  
  // IMPORTANT: Show this to user!
  alert(`Registration successful! Your Login ID is: ${data.user.login_id}`);
  alert('Please save this Login ID for future logins.');
};
```

### Sign In Page Flow

```jsx
const handleLogin = async (formData) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({
      login_id: formData.loginId, // Can be login_id OR email
      password: formData.password
    })
  });
  
  const data = await response.json();
  
  // Check if first login
  if (data.user.is_first_login) {
    // Show modal or redirect to change password
    showChangePasswordModal();
  } else {
    // Redirect to dashboard
    redirectToDashboard();
  }
};
```

### Change Password Flow

```jsx
const handleChangePassword = async (formData) => {
  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      old_password: formData.oldPassword,
      new_password: formData.newPassword,
      confirm_new_password: formData.confirmNewPassword
    })
  });
  
  const data = await response.json();
  alert(data.message);
};
```

## 📝 User Experience Flow

### Complete Registration Flow

```
1. User opens Sign Up page
   ↓
2. Fills in:
   - Company Name ✓
   - Uploads Company Logo (optional) ✓
   - Full Name ✓
   - Email ✓
   - Phone ✓
   - Password ✓
   - Confirm Password ✓
   ↓
3. Clicks "Sign Up"
   ↓
4. Backend:
   - Validates all fields
   - Checks email/phone uniqueness
   - Generates Login ID (TE20240020001)
   - Hashes password
   - Saves to database
   ↓
5. Response shows:
   "Registration Successful!"
   "Your Login ID is: TE20240020001"
   "Please save this for future logins"
   ↓
6. User is redirected to Sign In page
```

### Complete Login Flow

```
1. User opens Sign In page
   ↓
2. Enters:
   - Login ID or Email
   - Password
   ↓
3. Clicks "Sign In"
   ↓
4. Backend validates and returns user
   ↓
5. If is_first_login = true:
   - Show "Change Password" modal
   - User must change password
   ↓
6. If is_first_login = false:
   - Redirect to dashboard
```

## 🔒 Security Enhancements

### Password Validation Rules

```python
@field_validator("password")
def validate_password(cls, v: str) -> str:
    if len(v) < 8:
        raise ValueError("Minimum 8 characters")
    if not re.search(r"[A-Z]", v):
        raise ValueError("At least 1 uppercase letter")
    if not re.search(r"[a-z]", v):
        raise ValueError("At least 1 lowercase letter")
    if not re.search(r"\d", v):
        raise ValueError("At least 1 digit")
    return v
```

### Phone Validation

```python
@field_validator("phone")
def validate_phone(cls, v: str) -> str:
    clean_phone = re.sub(r'[\s\-\(\)]', '', v)
    if not re.match(r'^\+?[0-9]{10,15}$', clean_phone):
        raise ValueError("Invalid phone format")
    return clean_phone
```

### Logo Upload Security

- File type validation (JPEG, PNG, WEBP only)
- Unique filename generation (UUID)
- Separate storage directory
- Can add file size limits
- Can add image dimension checks

## 📈 Testing the New Features

### Test Case 1: Complete Registration

```bash
# Upload logo
curl -X POST http://localhost:8000/api/auth/upload-logo \
  -F "file=@logo.png"

# Register user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Tech Solutions",
    "name": "John Doe",
    "email_id": "john@techsolutions.com",
    "phone": "+1234567890",
    "password": "SecurePass123",
    "confirm_password": "SecurePass123",
    "company_logo_url": "/uploads/company_logos/abc-123.png"
  }'
```

### Test Case 2: Login with Login ID

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "login_id": "TE20240020001",
    "password": "SecurePass123"
  }'
```

### Test Case 3: Login with Email

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "login_id": "john@techsolutions.com",
    "password": "SecurePass123"
  }'
```

### Test Case 4: Change Password

```bash
curl -X POST http://localhost:8000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "old_password": "SecurePass123",
    "new_password": "NewSecurePass456",
    "confirm_new_password": "NewSecurePass456"
  }'
```

## 🎯 Summary of Changes

| Feature | Before | After |
|---------|--------|-------|
| **User Identifier** | `employee_id` (manual) | `login_id` (auto-generated) |
| **Name Field** | `first_name` | `name` (full name) |
| **Company Info** | ❌ None | ✅ `company_name` + `company_logo_url` |
| **Phone** | ❌ None | ✅ Required field |
| **Password Confirm** | ❌ None | ✅ Validated on backend |
| **Login Method** | Email only | Login ID or Email |
| **First Login** | ❌ Not tracked | ✅ `is_first_login` flag |
| **Change Password** | ❌ None | ✅ Dedicated endpoint |
| **Logo Upload** | ❌ None | ✅ Upload endpoint |

---

**All features from your design mockup have been successfully implemented! 🎉**
