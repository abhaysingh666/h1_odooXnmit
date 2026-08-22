# Admin Management Guide

## 🎯 All Admin Scenarios Covered

This guide covers all possible scenarios for admin creation and management.

---

## Scenario 1: First Time Setup (No Users Exist)

### Problem
- System is fresh, no users exist
- Need to create first admin

### Solution
Use `/bootstrap-admin` endpoint.

```http
POST /api/auth/bootstrap-admin
```

**What happens:**
1. ✅ Checks if any admin exists → No admin exists
2. ✅ Creates admin from `.env` credentials
3. ✅ Auto-generates Login ID (e.g., `DA20240020001`)
4. ✅ Returns admin details + JWT token

**Success Response:**
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
  "message": "✅ First admin created successfully! Login ID: DA20240020001"
}
```

**Credentials:**
- Login ID: `DA20240020001`
- Email: `admin@dayflow.com` (from `.env`)
- Password: `Admin@123456` (from `.env`)

---

## Scenario 2: Admin Deleted, Need to Recreate (Employees Exist)

### Problem
- Admin was deleted from database
- Employees already exist (e.g., 10 employees created)
- Need to create new admin

### Solution
Same! Use `/bootstrap-admin` endpoint.

```http
POST /api/auth/bootstrap-admin
```

**What happens:**
1. ✅ Checks if any admin exists → No admin found
2. ✅ Checks existing users count for serial number
3. ✅ If 10 employees exist in 2024, next serial = 11
4. ✅ Creates admin with Login ID: `DA20240020011`
5. ✅ Serial number continues from employee count

**Success Response:**
```json
{
  "user": {
    "login_id": "DA20240020011",
    "role": "admin"
  },
  "message": "✅ First admin created successfully! Login ID: DA20240020011"
}
```

**Key Point:**
- ✅ Serial number **automatically adjusts** based on existing users
- ✅ No conflict with employee Login IDs
- ✅ Maintains chronological order

---

## Scenario 3: Admin Exists, Trying to Create Another via Bootstrap

### Problem
- Admin already exists
- Someone calls `/bootstrap-admin` again

### Solution
Endpoint returns error.

```http
POST /api/auth/bootstrap-admin
```

**Error Response:**
```json
{
  "detail": "Admin already exists (Login ID: DA20240020001). If you want to create another admin, please login and use admin panel."
}
```

**What to do:**
1. Login with existing admin
2. Create employee first
3. Use `/admin/promote-to-admin` to promote them

---

## Scenario 4: Creating Second Admin (While First Admin Exists)

### Problem
- First admin exists
- Need to create another admin (HR officer, etc.)

### Solution: 2-Step Process

**Step 1: Admin Creates Employee**

```http
POST /api/auth/admin/create-employee
Cookie: token=<admin_jwt_token>

{
  "company_name": "Dayflow HRMS",
  "name": "HR Manager",
  "email_id": "hr@dayflow.com",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "login_id": "DA20240020012",
  "temp_password": "Abc@123Xyz",
  "registration_link": "http://localhost:5173/complete-registration?token=xyz..."
}
```

**Step 2: Admin Promotes Employee to Admin**

```http
POST /api/auth/admin/promote-to-admin?employee_email=hr@dayflow.com
Cookie: token=<admin_jwt_token>
```

**Response:**
```json
{
  "message": "✅ Successfully promoted HR Manager (hr@dayflow.com) to admin",
  "login_id": "DA20240020012",
  "new_role": "admin"
}
```

**Result:**
- ✅ Now you have 2 admins
- ✅ Both can create employees
- ✅ Both can promote others to admin

---

## Scenario 5: Email Conflict (User with Same Email Exists)

### Problem
- `.env` has `FIRST_ADMIN_EMAIL=admin@dayflow.com`
- An employee with same email already exists

### Solution
Endpoint returns error.

```http
POST /api/auth/bootstrap-admin
```

**Error Response:**
```json
{
  "detail": "User with email admin@dayflow.com already exists as employee. Please use different email in .env"
}
```

**What to do:**

**Option 1: Change Admin Email in `.env`**
```env
FIRST_ADMIN_EMAIL=superadmin@dayflow.com
```
Then call `/bootstrap-admin` again.

**Option 2: Promote Existing User**
If the existing user should be admin:
```http
POST /api/auth/admin/promote-to-admin?employee_email=admin@dayflow.com
```
(But you need another admin to call this!)

**Option 3: Delete Existing User**
1. Delete user from MongoDB
2. Call `/bootstrap-admin`

---

## Scenario 6: Forgot Admin Password

### Problem
- Admin exists but forgot password
- Cannot login

### Solution: 2 Options

**Option A: Reset via MongoDB (Direct Database Access)**

```javascript
// In MongoDB Compass or shell
db.users.updateOne(
  { email_id: "admin@dayflow.com" },
  { 
    $set: { 
      password: "<new_bcrypt_hash>",
      is_first_login: true
    }
  }
)
```

Then login and change password.

**Option B: Delete and Recreate**

```javascript
// Delete admin
db.users.deleteOne({ email_id: "admin@dayflow.com" })

// Call bootstrap again
POST /api/auth/bootstrap-admin
```

---

## Scenario 7: Multiple Admins Needed (Department Heads)

### Problem
- Need 5 admins (CEO, HR Head, IT Head, Finance Head, Operations Head)

### Solution: Create → Promote Flow

```bash
# Step 1: First admin creates all as employees
POST /api/auth/admin/create-employee (HR Head)
POST /api/auth/admin/create-employee (IT Head)
POST /api/auth/admin/create-employee (Finance Head)
POST /api/auth/admin/create-employee (Operations Head)

# Step 2: Promote each to admin
POST /api/auth/admin/promote-to-admin?employee_email=hr@dayflow.com
POST /api/auth/admin/promote-to-admin?employee_email=it@dayflow.com
POST /api/auth/admin/promote-to-admin?employee_email=finance@dayflow.com
POST /api/auth/admin/promote-to-admin?employee_email=ops@dayflow.com
```

**Result:**
- ✅ 5 admins (including first admin)
- ✅ All have full access
- ✅ All can create/manage employees

---

## Scenario 8: Demote Admin to Employee

### Problem
- User is admin but should be employee now

### Solution: Add Demotion Endpoint (Let me add this)

---

## 📊 Decision Flow Chart

```
Need Admin?
    │
    ├─ Is this first time setup?
    │   YES → Call /bootstrap-admin
    │   
    └─ NO → Admin already exists?
        │
        ├─ Admin deleted/missing?
        │   YES → Call /bootstrap-admin (auto-adjusts serial)
        │   
        └─ Admin exists, need another?
            YES → Create employee → Promote to admin
```

---

## 🔧 API Endpoints Summary

| Endpoint | Purpose | Who Can Call |
|----------|---------|--------------|
| `POST /api/auth/bootstrap-admin` | Create first admin | Anyone (no auth) |
| `POST /api/auth/admin/create-employee` | Create employee | Admin only |
| `POST /api/auth/admin/promote-to-admin` | Promote employee to admin | Admin only |
| `POST /api/auth/complete-registration` | Employee sets password | Anyone with token |
| `POST /api/auth/login` | Login | Anyone |

---

## 🧪 Testing All Scenarios

### Test 1: Fresh System

```powershell
# Should succeed
curl -X POST http://localhost:8000/api/auth/bootstrap-admin
```

### Test 2: Try Bootstrap Again

```powershell
# Should fail with "Admin already exists"
curl -X POST http://localhost:8000/api/auth/bootstrap-admin
```

### Test 3: Create & Promote Second Admin

```powershell
# Login as admin first
curl -X POST http://localhost:8000/api/auth/login -c cookies.txt -d '...'

# Create employee
curl -X POST http://localhost:8000/api/auth/admin/create-employee -b cookies.txt -d '...'

# Promote to admin
curl -X POST "http://localhost:8000/api/auth/admin/promote-to-admin?employee_email=hr@dayflow.com" -b cookies.txt
```

### Test 4: Delete Admin & Recreate with Employees

```javascript
// In MongoDB, delete admin
db.users.deleteOne({ role: "admin" })

// Should succeed and use next serial number
POST /api/auth/bootstrap-admin
```

---

## ⚠️ Important Notes

### 1. Serial Number Logic

The system automatically calculates the next serial number:

```python
async def get_next_serial_number(db, year: int) -> int:
    # Counts ALL users created in this year (admin + employees)
    count = await db.users.count_documents({
        "created_at": {
            "$gte": datetime(year, 1, 1),
            "$lt": datetime(year + 1, 1, 1)
        }
    })
    return count + 1
```

**Example:**
- 2024: 10 employees exist
- Admin deleted
- Bootstrap called
- New admin gets serial 11: `DA20240020011`

### 2. Email Uniqueness

- ✅ Each email must be unique in database
- ✅ Bootstrap checks email before creating
- ✅ Change `.env` if email conflict

### 3. Multiple Admins

- ✅ Unlimited admins allowed
- ✅ All admins have equal privileges
- ✅ Any admin can promote others

### 4. Role Changes

- ✅ Employee → Admin: Use `/admin/promote-to-admin`
- ❌ Admin → Employee: Need to add demotion endpoint
- ⚠️ Manually in MongoDB: Change `role` field

---

## 🔒 Security Considerations

### Bootstrap Endpoint Security

**Current:** No authentication required (anyone can call if no admin exists)

**Risks:**
- ❌ In production, malicious user could call if admin deleted
- ❌ Race condition if multiple calls simultaneously

**Recommendations:**

1. **Add Secret Key Check:**
```python
@router.post("/bootstrap-admin")
async def bootstrap_first_admin(
    secret_key: str,  # Add this parameter
    response: Response
):
    if secret_key != settings.BOOTSTRAP_SECRET_KEY:
        raise HTTPException(403, "Invalid secret key")
    # ... rest of code
```

2. **IP Whitelist:**
Only allow from localhost or specific IPs.

3. **One-Time Token:**
Generate token on system startup, must provide to bootstrap.

---

## 📝 Recommended Workflow

### For Production Deployment

1. **Deploy Backend**
2. **Immediately Call Bootstrap**
   ```bash
   curl -X POST https://api.dayflow.com/api/auth/bootstrap-admin
   ```
3. **Login as Admin**
4. **Create First Employee (Future Admin)**
5. **Promote to Admin**
6. **Optional: Delete Bootstrap Admin** (if you want clean start)

### For Development

1. **First Time:**
   ```bash
   POST /bootstrap-admin
   ```

2. **If Messed Up:**
   ```javascript
   // MongoDB
   db.users.deleteMany({})  // Delete all users
   
   // API
   POST /bootstrap-admin  // Start fresh
   ```

---

## ✅ Summary

| Scenario | Solution | Endpoint |
|----------|----------|----------|
| First time setup | Bootstrap admin | `/bootstrap-admin` |
| Admin deleted, employees exist | Bootstrap admin | `/bootstrap-admin` |
| Need 2nd admin | Create → Promote | `/admin/promote-to-admin` |
| Admin exists, try bootstrap | Error (expected) | `/bootstrap-admin` |
| Forgot admin password | MongoDB reset or delete+bootstrap | Manual/API |
| Email conflict | Change `.env` or delete user | Manual |

**System is flexible and handles all scenarios! 🎉**
