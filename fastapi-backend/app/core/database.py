from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            self.db = self.client[settings.DATABASE_NAME]
            logger.info(f"Connected to MongoDB at {settings.MONGODB_URL}")
            print(f"Connected to MongoDB at {settings.MONGODB_URL}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            print(f"ERROR: Failed to connect to MongoDB: {e}")
            raise

    def close(self):
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
            print("Disconnected from MongoDB")

db = Database()

async def get_database():
    if db.db is None:
        raise RuntimeError("Database connection not initialized")
    return db.db
