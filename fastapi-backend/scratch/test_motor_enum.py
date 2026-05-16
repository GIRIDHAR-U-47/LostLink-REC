
import asyncio
from enum import Enum
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

class TestEnum(str, Enum):
    VAL = "VAL"

async def test_enum():
    mongo_url = os.getenv("MONGODB_URL")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv("DATABASE_NAME")]
    
    try:
        print("Attempting to insert Enum...")
        await db["test_collection"].insert_one({"test": TestEnum.VAL})
        print("Success!")
    except Exception as e:
        print(f"Failed: {e}")
    finally:
        await db["test_collection"].delete_many({"test": TestEnum.VAL})
        client.close()

if __name__ == "__main__":
    asyncio.run(test_enum())
