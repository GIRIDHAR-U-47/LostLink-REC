import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()
#just to check db is properly working or not.
async def check_users():
    mongo_url = os.getenv("MONGODB_URL")
    db_name = os.getenv("DATABASE_NAME")
    
    print(f"Connecting to {mongo_url}...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    users = await db["users"].find().to_list(10)
    print(f"Found {len(users)} users in the database:")
    for user in users:
        print(f"- {user.get('email')} (Role: {user.get('role')})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())
