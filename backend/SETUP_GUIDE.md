# Complete Setup Guide - Dayflow HRMS Backend

## ✅ Redis Configuration - Already Done!

Your Redis Cloud credentials are already configured in `.env`:

```env
REDIS_HOST=redis-14350.crce217.ap-south-1-1.ec2.cloud.redislabs.com
REDIS_PORT=14350
REDIS_USERNAME=default
REDIS_PASSWORD=vkf5yHSMDj5PEyoMCC1vvEPCplUCkkGd
```

**No need to install Redis locally!** ✅

---

## ⚠️ Cloudinary Setup - Action Required

You need to get your **API Secret** from Cloudinary Dashboard.

### Step 1: Go to Cloudinary Dashboard

https://cloudinary.com/console

### Step 2: Copy API Secret

You'll see:

```
Cloud name: dwofzqy7n  ✅ (Already in .env)
API Key: 554385981887147  ✅ (Already in .env)
API Secret: ****************  ❌ (Need to add)
```

Click **"Reveal"** next to API Secret and copy it.

### Step 3: Update `.env` file

Open `backend\.env` and replace:

```env
CLOUDINARY_API_SECRET=your_api_secret
```

With your actual secret (something like):

```env
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz123456
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```powershell
cd d:\h1_odooXnmit\backend

# Create virtual environment
python -m venv venv

# Activate
.\venv\Scripts\Activate.ps1

# Install
pip install -r requirements.txt
```

### Step 2: Add Cloudinary API Secret

Update `.env` file with your Cloudinary API Secret (see above).

### Step 3: Test Connections

```powershell
python test_connections.py
```

**Expected Output:**
```
🚀 Dayflow HRMS - Connection Test Suite
============================================================

🔍 Testing MongoDB Connection...
✅ MongoDB Connected!
   Database: dayflow_hrms
   Existing users: 0

🔍 Testing Redis Connection...
✅ Redis Connected!
   Host: redis-14350.crce217.ap-south-1-1.ec2.cloud.redislabs.com:14350
   Ping: True
   Test set/get: test_value

🔍 Testing Cloudinary Configuration...
✅ Cloudinary Configured!
   Cloud Name: dwofzqy7n
   API Key: 5543859818...

============================================================
📊 Test Results Summary
============================================================
✅ MongoDB: PASSED
✅ Redis: PASSED
✅ Cloudinary: PASSED
============================================================

🎉 All connections successful! You can start the server now.

💡 Run: python main.py
```

---

## 🎯 If All Tests Pass

Start the server:

```powershell
python main.py
```

**Expected Output:**
```
🚀 Starting Dayflow HRMS Backend...
✅ Connected to MongoDB
✅ Connected to Redis
✅ Redis ping successful
✅ Application started successfully
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

Then open: **http://localhost:8000/docs**

---

## 🐛 Troubleshooting

### Error: MongoDB Connection Failed

**Check:**
- Internet connection
- `MONGODB_URL` in `.env` is correct
- MongoDB Atlas IP whitelist allows your IP

### Error: Redis Connection Failed

**Check:**
- Internet connection
- All Redis credentials in `.env` are correct:
  - `REDIS_HOST`
  - `REDIS_PORT`
  - `REDIS_USERNAME`
  - `REDIS_PASSWORD`

**Test manually:**
```powershell
redis-cli -u redis://default:vkf5yHSMDj5PEyoMCC1vvEPCplUCkkGd@redis-14350.crce217.ap-south-1-1.ec2.cloud.redislabs.com:14350 ping
```

Expected: `PONG`

### Error: Cloudinary Configuration Failed

**Check:**
- `CLOUDINARY_CLOUD_NAME` is `dwofzqy7n`
- `CLOUDINARY_API_KEY` is `554385981887147`
- `CLOUDINARY_API_SECRET` is filled (not `your_api_secret`)

---

## 📝 Complete `.env` Template

```env
# MongoDB Configuration
MONGODB_URL=mongodb://1by23is006_db_user:Aaeeiioouu%405@ac-gj3p4yz-shard-00-00.wb9rck4.mongodb.net:27017,ac-gj3p4yz-shard-00-01.wb9rck4.mongodb.net:27017,ac-gj3p4yz-shard-00-02.wb9rck4.mongodb.net:27017/?ssl=true&replicaSet=atlas-9mh6ch-shard-0&authSource=admin&appName=Cluster0
DB_NAME=dayflow_hrms

# JWT Configuration
JWT_SECRET_KEY=dayflow-hrms-super-secret-key-2026-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=1

# Redis Configuration (Redis Cloud)
REDIS_HOST=redis-14350.crce217.ap-south-1-1.ec2.cloud.redislabs.com
REDIS_PORT=14350
REDIS_USERNAME=default
REDIS_PASSWORD=vkf5yHSMDj5PEyoMCC1vvEPCplUCkkGd
REDIS_DB=0

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dwofzqy7n
CLOUDINARY_API_KEY=554385981887147
CLOUDINARY_API_SECRET=GET_FROM_CLOUDINARY_DASHBOARD

# Application Configuration
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# First Admin Setup (Bootstrap)
FIRST_ADMIN_EMAIL=admin@dayflow.com
FIRST_ADMIN_PASSWORD=Admin@123456
FIRST_ADMIN_NAME=System Administrator
FIRST_ADMIN_COMPANY=Dayflow HRMS
```

---

## ✅ Checklist

Before starting the server:

- [ ] Virtual environment created and activated
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Cloudinary API Secret added to `.env`
- [ ] Connection test passed (`python test_connections.py`)
- [ ] Server started (`python main.py`)
- [ ] API docs accessible (http://localhost:8000/docs)

---

## 🎉 Next Steps

Once server is running:

1. **Bootstrap Admin:** `POST /api/auth/bootstrap-admin`
2. **Login as Admin:** `POST /api/auth/login`
3. **Create Employee:** `POST /api/auth/admin/create-employee`
4. **Test Login ID Format:** Check if format is `CINNNNYYYYSSSS`

Refer to the main testing guide for detailed steps!

---

**Everything is ready except Cloudinary API Secret! Add that and you're good to go! 🚀**
