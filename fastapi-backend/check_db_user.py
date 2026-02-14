import motor.motor_asyncio
import asyncio
import os

async def check():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['lostlink_db_review']
    user = await db['users'].find_one({'email': 'admin@rec.edu.in'})
    print(f'User found: {user is not None}')
    if user:
        print(f"Role: {user.get('role')}")
        print(f"Name: {user.get('name')}")
        # print(f"Password Hash: {user.get('password')}")

if __name__ == "__main__":
    asyncio.run(check())
