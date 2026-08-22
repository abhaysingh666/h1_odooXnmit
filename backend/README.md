# Dayflow HRMS - Backend

FastAPI backend for Dayflow Human Resource Management System.

## Setup Instructions

### 1. Create Virtual Environment

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
venv\Scripts\Activate.ps1
```

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update values:

```powershell
Copy-Item .env.example .env
```

**Important:** The `.env` file is already configured with your MongoDB Atlas connection string.

### 4. Install Redis (Required)

**Option 1: Using Chocolatey (Recommended for Windows)**
```powershell
choco install redis-64
redis-server
```

**Option 2: Using Docker**
```powershell
docker run -d -p 6379:6379 redis:latest
```

**Option 3: Redis Cloud (Free Tier)**
- Sign up at https://redis.com/try-free/
- Get connection details and update `.env`

### 5. Run the Server

```powershell
# Development mode (auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python main.py
```

### 6. Access API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

## Project Structure

```
backend/
├── app/
│   ├── core/               # Core functionality
│   │   ├── config.py       # Settings and configuration
│   │   ├── database.py     # MongoDB connection
│   │   ├── redis_client.py # Redis connection
│   │   └── security.py     # JWT and password hashing
│   ├── models/             # Database models
│   │   └── user.py
│   ├── schemas/            # Pydantic schemas
│   │   └── user.py
│   ├── routers/            # API endpoints
│   │   └── auth.py
│   └── utils/              # Utilities
│       └── dependencies.py # Auth middleware
├── main.py                 # Application entry point
├── requirements.txt
└── .env
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/upload-logo` | Upload company logo | No |
| POST | `/api/auth/register` | Register new user (auto-generates Login ID) | No |
| POST | `/api/auth/login` | Login with Login ID or Email | No |
| POST | `/api/auth/logout` | Logout user (invalidate token) | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |
| GET | `/api/auth/me` | Get current user info | Yes |
| DELETE | `/api/auth/delete-profile` | Delete user profile | Yes |

## Authentication Flow

### 1. Register (Always as Employee)
```json
POST /api/auth/register
{
  "company_name": "Tech Solutions",
  "name": "John Doe",
  "email_id": "john@techsolutions.com",
  "phone": "+1234567890",
  "password": "SecurePass123",
  "confirm_password": "SecurePass123",
  "company_logo_url": "/uploads/company_logos/abc123.png"
}
```

**Response:**
```json
{
  "user": {
    "_id": "66c8d2e4a3f4b1c2d3e4f5a6",
    "login_id": "TE20240020001",
    "company_name": "Tech Solutions",
    "company_logo_url": "/uploads/company_logos/abc123.png",
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

**Login ID Format:** `CIYYYYQQQSSSSS`
- CI = Company Initial (first 2 letters)
- YYYY = Year
- QQQ = Quarter (001-004)
- SSSSS = Serial number

**Note:** All users register as "employee" by default. To make someone an admin:
1. Open MongoDB Compass
2. Connect to your database
3. Find the user in the `users` collection
4. Change `role: "employee"` to `role: "admin"`

### 2. Login
```json
POST /api/auth/login
{
  "login_id": "TE20240020001",
  "password": "SecurePass123"
}
```

**Note:** You can also use email instead of login_id:
```json
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

### 3. Logout
```json
POST /api/auth/logout
```

**Response:**
```json
{
  "message": "Logged Out Successfully"
}
```

## Security Features

### JWT Token Management
- Tokens stored in **httpOnly cookies** (XSS protection)
- Expires in 1 hour
- SameSite cookie policy based on environment

### Redis Token Blocklist
- Logged out tokens stored in Redis
- Automatic expiration based on JWT expiry
- Prevents token reuse after logout

### Password Security
- Bcrypt hashing with salt
- Minimum 8 characters
- Must contain uppercase, lowercase, and digit

### Role-Based Access Control
- **Employee:** Limited access (own data only)
- **Admin:** Full access (all employee data)

## Middleware (Dependencies)

### `get_current_user`
- Validates JWT token from cookie
- Checks Redis blocklist
- Returns authenticated user

### `get_current_admin`
- Extends `get_current_user`
- Ensures user has admin role

### `get_current_employee`
- Extends `get_current_user`
- Ensures user has employee or admin role

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | Your Atlas URL |
| `DB_NAME` | Database name | dayflow_hrms |
| `JWT_SECRET_KEY` | Secret key for JWT | random-secret-key |
| `JWT_ALGORITHM` | JWT algorithm | HS256 |
| `JWT_EXPIRATION_HOURS` | Token expiration | 1 |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `ENVIRONMENT` | Environment | development |
| `CORS_ORIGINS` | Allowed CORS origins | http://localhost:5173 |

## Testing with cURL

### Register
```powershell
curl -X POST http://localhost:8000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"employee_id\":\"EMP001\",\"first_name\":\"John Doe\",\"email_id\":\"john@example.com\",\"password\":\"SecurePass123\"}'
```

### Login
```powershell
curl -X POST http://localhost:8000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email_id\":\"john@example.com\",\"password\":\"SecurePass123\"}' `
  -c cookies.txt
```

### Get Current User (with cookie)
```powershell
curl -X GET http://localhost:8000/api/auth/me `
  -b cookies.txt
```

### Logout
```powershell
curl -X POST http://localhost:8000/api/auth/logout `
  -b cookies.txt
```

## Next Steps

1. ✅ Authentication & Authorization (Completed)
2. ⏳ Employee Profile Management
3. ⏳ Attendance Module
4. ⏳ Leave Management
5. ⏳ Payroll Module
6. ⏳ Admin Dashboard

## Troubleshooting

### Redis Connection Error
- Make sure Redis is running: `redis-cli ping` (should return PONG)
- Check Redis host/port in `.env`

### MongoDB Connection Error
- Verify MongoDB connection string in `.env`
- Check IP whitelist in MongoDB Atlas
- Ensure network connectivity

### Import Errors
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt`

## Support

For issues or questions, check the main project README or API documentation at `/docs`.
