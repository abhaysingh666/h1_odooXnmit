from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

# MongoDB client
client: AsyncIOMotorClient = None


def get_database():
    """Get database instance"""
    return client[settings.DB_NAME]


async def connect_to_mongo():
    """Create database connection"""
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    print("✅ Connected to MongoDB")


async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
        print("❌ Closed MongoDB connection")
