
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def fix_database():
    mongo_url = os.getenv("MONGODB_URL")
    db_name = os.getenv("DATABASE_NAME")
    
    print(f"Connecting to {mongo_url}...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Finding users with missing roles...")
    # Find users missing 'role' or having null 'role'
    query = {"$or": [{"role": {"$exists": False}}, {"role": None}]}
    users_to_fix = await db["users"].find(query).to_list(100)
    
    print(f"Found {len(users_to_fix)} users to fix.")
    
    for user in users_to_fix:
        email = user.get("email", "Unknown")
        print(f"Fixing user: {email}")
        await db["users"].update_one(
            {"_id": user["_id"]},
            {"$set": {"role": "USER", "roles": ["USER"]}}
        )
    
    print("Fix complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_database())
