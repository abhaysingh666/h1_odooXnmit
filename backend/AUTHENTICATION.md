# Authentication & Authorization Documentation

## Overview

This authentication system implements JWT-based authentication with Redis token blocklist, similar to the Node.js implementation you provided.

## Key Features

✅ **JWT Token in HTTP-Only Cookies** - Protection against XSS attacks  
✅ **Redis Token Blocklist** - Secure logout mechanism  
✅ **Bcrypt Password Hashing** - Secure password storage  
✅ **Role-Based Access Control** - Employee and Admin roles  
✅ **Default Employee Registration** - All users start as employees  

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Register/Login (credentials)
       ▼
┌─────────────────────────────────┐
│   FastAPI Auth Router           │
│   (/api/auth/register|login)    │
└──────┬──────────────────────────┘
       │ 2. Validate & Hash Password
       ▼
┌─────────────────┐
│    MongoDB      │  ◄── Store user with role="employee"
└─────────────────┘
       │
       │ 3. Create JWT Token
       ▼
┌─────────────────────────────────┐
│   Set HTTP-Only Cookie          │
└──────┬──────────────────────────┘
       │ 4. Return user info + token in cookie
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

## Authentication Flow

### 1. Registration Flow

```
User Registration Request
    ↓
Validate Input (Pydantic)
    ↓
Check if user exists (email/employee_id)
    ↓
Hash password (bcrypt)
    ↓
Create user document with role="employee"
    ↓
Insert into MongoDB
    ↓
Generate JWT token
    ↓
Set HTTP-Only cookie
    ↓
Return user info (without password)
```

**Code:** `app/routers/auth.py` → `register()`

### 2. Login Flow

```
User Login Request
    ↓
Validate email & password
    ↓
Find user in MongoDB
    ↓
Verify password (bcrypt.verify)
    ↓
Generate JWT token with user data
    ↓
Set HTTP-Only cookie
    ↓
Return user info
```

**Code:** `app/routers/auth.py` → `login()`

### 3. Logout Flow (with Redis Blocklist)

```
User Logout Request (with cookie)
    ↓
Extract token from cookie
    ↓
Decode JWT to get expiration time
    ↓
Add token to Redis blocklist:
  Key: "token:{jwt_token}"
  Value: "Blocked"
  Expiry: JWT expiration timestamp
    ↓
Clear cookie
    ↓
Return success message
```

**Code:** `app/routers/auth.py` → `logout()`

### 4. Protected Route Access

```
Request to protected endpoint
    ↓
Extract token from cookie
    ↓
Check if token exists
    ↓
Decode & validate JWT
    ↓
Check Redis blocklist
  (if token exists → reject)
    ↓
Fetch user from MongoDB
    ↓
Attach user to request
    ↓
Continue to endpoint
```

**Code:** `app/utils/dependencies.py` → `get_current_user()`

## Middleware (Dependencies)

### 1. `get_current_user`

**Purpose:** Validates JWT token and returns authenticated user  
**Similar to:** Node.js `userMiddleware`

```python
async def get_current_user(token: Optional[str] = Cookie(None)) -> UserInDB:
    # 1. Check if token exists
    # 2. Decode JWT
    # 3. Check Redis blocklist
    # 4. Fetch user from database
    # 5. Return user
```

**Usage:**
```python
@router.get("/profile")
async def get_profile(current_user: UserInDB = Depends(get_current_user)):
    return current_user
```

### 2. `get_current_admin`

**Purpose:** Ensures user has admin role  
**Similar to:** Node.js `adminMiddleware`

```python
async def get_current_admin(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    if current_user.role != "admin":
        raise HTTPException(403, "Access denied")
    return current_user
```

**Usage:**
```python
@router.get("/admin/users")
async def list_all_users(admin: UserInDB = Depends(get_current_admin)):
    # Only admins can access this
```

### 3. `get_current_employee`

**Purpose:** Ensures user is employee or admin  

```python
async def get_current_employee(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    if current_user.role not in ["employee", "admin"]:
        raise HTTPException(403, "Access denied")
    return current_user
```

## Role Management

### Default Registration (Employee)

```python
# In register endpoint
user_doc = {
    "role": "employee",  # Always employee by default
    # ... other fields
}
```

### Promoting to Admin (Manual in MongoDB)

**Steps:**
1. Open MongoDB Compass
2. Connect to database: `dayflow_hrms`
3. Navigate to `users` collection
4. Find the user document
5. Edit: Change `"role": "employee"` to `"role": "admin"`
6. Save

**Or using MongoDB shell:**
```javascript
db.users.updateOne(
  { email_id: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Redis Token Blocklist

### Why Redis?

- **Fast lookups** - O(1) time complexity
- **Automatic expiration** - Tokens auto-removed when JWT expires
- **Distributed** - Works across multiple server instances

### Token Blocklist Structure

```
Key: "token:{jwt_token_string}"
Value: "Blocked"
Expiry: JWT expiration timestamp
```

### Example

```python
# On logout
await redis.set("token:eyJhbGc...", "Blocked")
await redis.expireat("token:eyJhbGc...", 1724332800)  # Unix timestamp
```

### Checking Blocklist

```python
# On protected route access
is_blocked = await redis.exists(f"token:{token}")
if is_blocked:
    raise HTTPException(401, "Token invalidated")
```

## Security Measures

### 1. Password Hashing
- **Algorithm:** Bcrypt with automatic salt
- **Rounds:** 12 (default)
- **Why Bcrypt:** Slow by design, resistant to brute-force

```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"])

hashed = pwd_context.hash("password123")  # Hash
is_valid = pwd_context.verify("password123", hashed)  # Verify
```

### 2. JWT Token Security
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Expiration:** 1 hour
- **Payload:**
  ```json
  {
    "_id": "user_id",
    "role": "employee",
    "email_id": "user@example.com",
    "exp": 1724332800
  }
  ```

### 3. HTTP-Only Cookies
- **httpOnly:** `true` - Prevents JavaScript access (XSS protection)
- **secure:** `true` in production - HTTPS only
- **sameSite:** `none` (prod) / `lax` (dev) - CSRF protection

### 4. Password Validation

```python
@field_validator("password")
def validate_password(cls, v: str) -> str:
    # Minimum 8 characters
    # At least 1 uppercase letter
    # At least 1 lowercase letter
    # At least 1 digit
```

## API Response Examples

### Successful Registration

```json
{
  "user": {
    "_id": "66c8d2e4a3f4b1c2d3e4f5a6",
    "employee_id": "EMP001",
    "first_name": "John Doe",
    "email_id": "john@example.com",
    "role": "employee",
    "is_verified": false
  },
  "message": "User Registered Successfully"
}
```

**Cookie Set:**
```
Set-Cookie: token=eyJhbGciOiJIUzI1NiIs...; HttpOnly; SameSite=Lax; Max-Age=3600
```

### Error Responses

#### Invalid Credentials
```json
{
  "detail": "Invalid credentials"
}
```
**Status:** 401 Unauthorized

#### User Already Exists
```json
{
  "detail": "User with this email or employee ID already exists"
}
```
**Status:** 400 Bad Request

#### Token Invalidated
```json
{
  "detail": "Token has been invalidated"
}
```
**Status:** 401 Unauthorized

#### Not Admin
```json
{
  "detail": "User is not admin. Access denied."
}
```
**Status:** 403 Forbidden

## Comparison: Node.js vs Python

| Feature | Node.js (Your Code) | Python (FastAPI) |
|---------|---------------------|------------------|
| Password Hashing | `bcrypt` | `passlib[bcrypt]` |
| JWT | `jsonwebtoken` | `python-jose` |
| Redis Client | `redis` | `redis.asyncio` |
| Validation | Custom validator | Pydantic validators |
| Middleware | Express middleware | FastAPI dependencies |
| Cookies | `res.cookie()` | `response.set_cookie()` |
| Async/Await | ✅ | ✅ |

## Testing Authentication

### Using Swagger UI

1. Open http://localhost:8000/docs
2. Try the `/api/auth/register` endpoint
3. Try the `/api/auth/login` endpoint
4. Click "Authorize" and the cookie will be set automatically
5. Try protected endpoints like `/api/auth/me`

### Using cURL (PowerShell)

```powershell
# Register
curl -X POST http://localhost:8000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"employee_id\":\"EMP001\",\"first_name\":\"John\",\"email_id\":\"john@example.com\",\"password\":\"SecurePass123\"}' `
  -c cookies.txt

# Login
curl -X POST http://localhost:8000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email_id\":\"john@example.com\",\"password\":\"SecurePass123\"}' `
  -c cookies.txt

# Get current user (protected)
curl -X GET http://localhost:8000/api/auth/me -b cookies.txt

# Logout
curl -X POST http://localhost:8000/api/auth/logout -b cookies.txt
```

## Troubleshooting

### Issue: "Token is not present"
**Solution:** Make sure cookie is being sent with requests

### Issue: "User is blocked"
**Solution:** Token was logged out. Login again.

### Issue: Redis connection error
**Solution:** Make sure Redis is running (`redis-cli ping`)

### Issue: "Invalid credentials"
**Solution:** Check email and password are correct

## Next Steps

After authentication is complete, the next modules will be:
1. **Employee Profile Management** (view/edit)
2. **Attendance Module** (check-in/out)
3. **Leave Management** (apply/approve)
4. **Payroll Module** (view salary)

Each module will use the same authentication dependencies:
- `get_current_user` - For all authenticated routes
- `get_current_admin` - For admin-only routes
- `get_current_employee` - For employee routes
