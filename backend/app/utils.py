import jwt
import os
from app.database import cache
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Get user info from the JWT token, also invalidate the token if the user is banned in the Valkey cache.

    token: The JWT token provided by the client in the Authorization header.

    returns: A dictionary containing user_id, role and token if the token is valid and the user is not banned, otherwise raises an HTTPException.
    """
    try:
        payload = jwt.decode(
            token, 
            os.getenv("JWT_SECRET", "very_secret_key_that_has_no_flaws"), 
            algorithms=["HS256"]
        )
        
        user_id = payload.get("user_id")
        role = payload.get("role")

        if user_id is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            is_banned = cache.sismember("banned_users", str(user_id))
        except Exception:
            is_banned = False

        if is_banned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been suspended"
            )

        return {
            "user_id": user_id,
            "role": role,
            "token": token
        }
        
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
