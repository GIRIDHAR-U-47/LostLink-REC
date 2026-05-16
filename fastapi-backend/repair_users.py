
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def fix_user_records():
    mongo_url = os.getenv("MONGODB_URL")
    db_name = os.getenv("DATABASE_NAME")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Fixing user records missing mandatory fields...")
    query = {"$or": [
        {"department": {"$exists": False}}, 
        {"phone": {"$exists": False}},
        {"role": {"$exists": False}}
    ]}
    
    result = await db["users"].update_many(
        query,
        {"$set": {
            "department": "N/A",
            "phone": "N/A",
            "role": "USER",
            "roles": ["USER"]
        }}
    )
    
    print(f"Modified {result.modified_count} users.")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_user_records())
