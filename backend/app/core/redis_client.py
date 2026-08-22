import redis.asyncio as aioredis
from .config import settings

# Redis client
redis_client: aioredis.Redis = None


async def connect_to_redis():
    """Create Redis connection"""
    global redis_client
    
    # Build Redis URL with username and password
    if settings.REDIS_PASSWORD:
        redis_url = f"redis://{settings.REDIS_USERNAME}:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
    else:
        redis_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
    
    redis_client = await aioredis.from_url(
        redis_url,
        encoding="utf-8",
        decode_responses=True
    )
    print("✅ Connected to Redis")
    
    # Test connection
    try:
        await redis_client.ping()
        print("✅ Redis ping successful")
    except Exception as e:
        print(f"⚠️  Redis connection warning: {e}")


async def close_redis_connection():
    """Close Redis connection"""
    global redis_client
    if redis_client:
        await redis_client.close()
        print("❌ Closed Redis connection")


def get_redis():
    """Get Redis instance"""
    return redis_client
