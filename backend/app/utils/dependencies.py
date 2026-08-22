from fastapi import Cookie, HTTPException, status, Depends
from typing import Optional
from ..core import decode_access_token, get_redis, get_database
from ..models import UserInDB
from bson import ObjectId


async def get_current_user(token: Optional[str] = Cookie(None)) -> UserInDB:
    """
    Dependency to get current authenticated user from JWT token cookie.
    Similar to Node.js userMiddleware.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not present"
        )
    
    # Decode JWT token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Check if token is in Redis blocklist
    redis = get_redis()
    is_blocked = await redis.exists(f"token:{token}")
    if is_blocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been invalidated"
        )
    
    # Get user from database
    db = get_database()
    user_data = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return UserInDB(**user_data)


async def get_current_admin(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    """
    Dependency to ensure current user is an admin.
    Similar to Node.js adminMiddleware.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not admin. Access denied."
        )
    
    return current_user


async def get_current_employee(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    """
    Dependency to ensure current user is an employee (or admin).
    """
    if current_user.role not in ["employee", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return current_user
