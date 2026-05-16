
import asyncio
import os
from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def check_users():
    mongo_url = os.getenv("MONGODB_URL")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv("DATABASE_NAME")]
    
    users = await db["users"].find().to_list(10)
    for user in users:
        print(f"User: {user}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())
