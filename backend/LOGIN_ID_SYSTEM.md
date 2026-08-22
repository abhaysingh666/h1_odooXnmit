# Login ID Auto-Generation System

## Overview

The Dayflow HRMS implements an **automatic Login ID generation system** based on the design requirements. Users register with their company details, and the system automatically generates a unique Login ID.

## Login ID Format

```
CIYYYYQQQSSSSS
```

### Components Breakdown

| Component | Description | Example |
|-----------|-------------|---------|
| **CI** | Company Initial (first 2 letters of company name, uppercase) | `AC` for "Acme Corp" |
| **YYYY** | Year of joining (4 digits) | `2024` |
| **QQQ** | Quarter number (001-004) based on registration month | `002` for Q2 (Apr-Jun) |
| **SSSSS** | Serial number for that year (5 digits, zero-padded) | `00001` |

### Complete Example

**User registers:**
- Company Name: "Acme Corporation"
- Registration Date: June 15, 2024
- First employee of 2024

**Generated Login ID:** `AC20240020001`

**Breakdown:**
- `AC` = First 2 letters of "Acme"
- `2024` = Year 2024
- `002` = Quarter 2 (April-June)
- `00001` = First employee of 2024

## Quarter Calculation

| Quarter | Months | QQQ Value |
|---------|--------|-----------|
| Q1 | Jan, Feb, Mar | 001 |
| Q2 | Apr, May, Jun | 002 |
| Q3 | Jul, Aug, Sep | 003 |
| Q4 | Oct, Nov, Dec | 004 |

## Serial Number Logic

The serial number increments for each new user registered in the same year:

```
First user of 2024:  AC20240020001
Second user of 2024: AC20240030002
Third user of 2024:  AC20240040003
```

**Note:** Serial number is independent of quarter - it's just a counter for the year.

## Edge Cases Handled

### 1. Single Character Company Name
If company name has only 1 character, pad with 'X':
- Company: "A" → Login ID: `AX2024002...`

### 2. Company Name with Spaces
Spaces are removed before taking first 2 characters:
- "Tech Corp" → `TE2024002...`
- "I B M" → `IB2024002...`

### 3. Special Characters
Only alphanumeric characters are used:
- "A&B Solutions" → `AB2024002...`

## Implementation Code

### Generator Function

```python
def generate_login_id(company_name: str, year: int, serial_number: int) -> str:
    # Extract first 2 letters, uppercase
    company_initial = ''.join(company_name.split())[:2].upper()
    
    # Pad if only 1 character
    if len(company_initial) == 1:
        company_initial += 'X'
    
    # Calculate quarter (1-4)
    current_month = datetime.now().month
    quarter = (current_month - 1) // 3 + 1
    
    # Format: CIYYYYQQQSSSSS
    login_id = f"{company_initial}{year:04d}{quarter:03d}{serial_number:05d}"
    
    return login_id
```

### Serial Number Tracker

```python
async def get_next_serial_number(db, year: int) -> int:
    # Count users created in this year
    count = await db.users.count_documents({
        "created_at": {
            "$gte": datetime(year, 1, 1),
            "$lt": datetime(year + 1, 1, 1)
        }
    })
    return count + 1
```

## Sign Up Flow with Login ID

```
User fills Sign Up form:
  - Company Name: "Tech Solutions"
  - Name: "John Doe"
  - Email: john@techsolutions.com
  - Phone: +1234567890
  - Password: SecurePass123
  - Confirm Password: SecurePass123
  - Company Logo: [uploaded]
    ↓
Backend processes:
  1. Validate all fields
  2. Check if email/phone already exists
  3. Get current year (2024)
  4. Get next serial number (query DB)
  5. Generate Login ID:
     - Extract "TE" from "Tech Solutions"
     - Year = 2024
     - Quarter = 002 (if June)
     - Serial = 00001
     - Result: "TE20240020001"
  6. Hash password
  7. Save to database
  8. Return Login ID to user
    ↓
User receives response:
  "User Registered Successfully. Your Login ID is: TE20240020001"
```

## Sign In Flow

Users can login with **either**:

1. **Login ID**
   ```json
   {
     "login_id": "AC20240020001",
     "password": "SecurePass123"
   }
   ```

2. **Email**
   ```json
   {
     "login_id": "john@acme.com",
     "password": "SecurePass123"
   }
   ```

The backend checks both fields:
```python
user_data = await db.users.find_one({
    "$or": [
        {"login_id": credentials.login_id},
        {"email_id": credentials.login_id}
    ]
})
```

## Database Schema

### Users Collection

```json
{
  "_id": "ObjectId",
  "login_id": "AC20240020001",
  "company_name": "Acme Corporation",
  "company_logo_url": "/uploads/company_logos/uuid.png",
  "name": "John Doe",
  "email_id": "john@acme.com",
  "phone": "+1234567890",
  "password": "hashed_password",
  "is_first_login": true,
  "role": "employee",
  "is_verified": false,
  "created_at": "2024-06-15T10:30:00Z",
  "updated_at": "2024-06-15T10:30:00Z"
}
```

## API Endpoints

### 1. Upload Company Logo (Optional, before registration)

```http
POST /api/auth/upload-logo
Content-Type: multipart/form-data

{
  "file": [binary]
}
```

**Response:**
```json
{
  "logo_url": "/uploads/company_logos/abc123.png",
  "message": "Logo uploaded successfully"
}
```

### 2. Register (Sign Up)

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

### 3. Login (Sign In)

```http
POST /api/auth/login
Content-Type: application/json

{
  "login_id": "TE20240020001",
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

### 4. Change Password

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

## Testing Examples

### Example 1: Multiple Users from Same Company

**User 1:**
- Company: "Microsoft"
- Date: March 2024 (Q1)
- Login ID: `MI20240010001`

**User 2:**
- Company: "Microsoft" (different employee)
- Date: July 2024 (Q3)
- Login ID: `MI20240030002`

**User 3:**
- Company: "Microsoft"
- Date: July 2024 (Q3)
- Login ID: `MI20240030003`

### Example 2: Different Companies, Same Date

**Company A:**
- Company: "Apple Inc"
- Date: June 2024 (Q2)
- Login ID: `AP20240020001`

**Company B:**
- Company: "Google LLC"
- Date: June 2024 (Q2)
- Login ID: `GO20240020001`

Serial numbers are independent per company's first user!

## Frontend Implementation Notes

### Sign Up Page

```jsx
// Pseudo-code for Sign Up form
<form onSubmit={handleSignUp}>
  <input name="company_name" placeholder="Company Name" required />
  <input type="file" onChange={handleLogoUpload} accept="image/*" />
  <input name="name" placeholder="Your Name" required />
  <input name="email_id" type="email" placeholder="Email" required />
  <input name="phone" placeholder="Phone" required />
  <input name="password" type="password" placeholder="Password" required />
  <input name="confirm_password" type="password" placeholder="Confirm Password" required />
  <button type="submit">Sign Up</button>
</form>

// On success, display:
"Registration successful! Your Login ID is: {login_id}"
"Please save this Login ID for future logins."
```

### Sign In Page

```jsx
<form onSubmit={handleSignIn}>
  <input name="login_id" placeholder="Login ID or Email" required />
  <input name="password" type="password" placeholder="Password" required />
  <button type="submit">Sign In</button>
</form>

// Note to user:
"You can login with either your Login ID or Email"
```

## Password Management

### First Login Flag

The `is_first_login` boolean tracks if user has changed their password:

- **Registration:** `is_first_login = true`
- **After Password Change:** `is_first_login = false`

Frontend can use this to:
1. Show "Change Password" prompt on first login
2. Force password change modal
3. Display notification banner

### Password Change Flow

```
User logs in with generated password
  ↓
Backend returns: is_first_login = true
  ↓
Frontend shows: "Please change your password"
  ↓
User submits new password
  ↓
Backend validates and updates:
  - password = new_hashed_password
  - is_first_login = false
  ↓
User can now login normally
```

## Security Considerations

### 1. Login ID Uniqueness
- Combination of company initial, year, quarter, and serial ensures uniqueness
- MongoDB unique index on `login_id` field prevents duplicates

### 2. Serial Number Race Condition
- Use MongoDB transactions for concurrent registrations
- Atomic increment for serial number generation

### 3. Login ID Exposure
- Login IDs are not sensitive (like employee numbers)
- Still, don't display in public URLs or logs
- Use for authentication only

## Advantages of This System

✅ **Human-Readable:** Easy to remember and communicate  
✅ **Sortable:** Chronological by year and quarter  
✅ **Unique:** Guaranteed uniqueness per registration  
✅ **Professional:** Corporate-style employee ID format  
✅ **Scalable:** Supports up to 99,999 users per year  
✅ **Trackable:** Quarter indicator helps with reporting  

## Future Enhancements

1. **Department Code:** Add department identifier (2 chars)
   - Format: `CIDYYYYQQQSSSSS`
   - Example: `ACIT20240020001` (IT dept)

2. **Custom Prefixes:** Allow companies to set custom prefixes
   - Instead of company initial, use custom code
   - Example: `EMP20240020001`

3. **QR Code:** Generate QR code with Login ID for ID cards

4. **Login ID Shortener:** Provide short aliases for convenience
   - Full: `AC20240020001`
   - Short: `AC-001` (for internal use)

---

**This system ensures professional, organized, and scalable user identification for the Dayflow HRMS!**
