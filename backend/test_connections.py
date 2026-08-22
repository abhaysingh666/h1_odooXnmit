"""Test MongoDB and Redis connections"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis
from dotenv import load_dotenv
import os

load_dotenv()

async def test_connections():
    print("🔍 Testing connections...\n")
    
    # Test MongoDB
    try:
        mongo_client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
        await mongo_client.admin.command('ping')
        print("✅ MongoDB Connected!")
    except Exception as e:
        print(f"❌ MongoDB Failed: {e}")
    
    # Test Redis
    try:
        redis_client = redis.from_url(
            f"redis://{os.getenv('REDIS_USERNAME')}:{os.getenv('REDIS_PASSWORD')}@{os.getenv('REDIS_HOST')}:{os.getenv('REDIS_PORT')}"
        )
        await redis_client.ping()
        print("✅ Redis Connected!")
        await redis_client.close()
    except Exception as e:
        print(f"❌ Redis Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connections())
