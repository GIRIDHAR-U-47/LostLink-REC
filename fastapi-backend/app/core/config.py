import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "REC LostLink"
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "lostlink_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "9a4f2c8d3b7a1e6f4g5h8i0j2k4l6m8n0p2q4r6s8t0u2v4w6x8y0z")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 1 day

settings = Settings()
