"""
Script to find admin Login ID from database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

async def find_admin():
    # Connect to MongoDB
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("DB_NAME")]
    
    # Find admin user
    admin = await db.users.find_one({"email_id": "anandyadav@gmail.com"})
    
    if admin:
        print("=" * 60)
        print("ADMIN ACCOUNT FOUND")
        print("=" * 60)
        print(f"Login ID: {admin.get('login_id')}")
        print(f"Email: {admin.get('email_id')}")
        print(f"Name: {admin.get('name')}")
        print(f"Company: {admin.get('company_name')}")
        print(f"Role: {admin.get('role')}")
        print(f"Is Admin: {admin.get('is_admin')}")
        print("=" * 60)
        print("\nUSE THESE CREDENTIALS TO LOGIN:")
        print(f"Login ID: {admin.get('login_id')}")
        print(f"Password: Admin@123456")
        print("=" * 60)
    else:
        print("Admin account not found!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(find_admin())
