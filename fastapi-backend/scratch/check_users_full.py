
import asyncio
import os
import json
from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)

async def check_users():
    mongo_url = os.getenv("MONGODB_URL")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv("DATABASE_NAME")]
    
    users = await db["users"].find().to_list(10)
    print(json.dumps(users, indent=2, cls=JSONEncoder))
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())
