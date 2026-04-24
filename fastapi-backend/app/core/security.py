from datetime import datetime, timedelta
from typing import Optional, Union
from jose import jwt
import bcrypt
from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash."""
    pw_bytes = plain_password.encode("utf-8")[:72]  # bcrypt 72-byte limit
    hash_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(pw_bytes, hash_bytes)

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    pw_bytes = password.encode("utf-8")[:72]  # bcrypt 72-byte limit
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
