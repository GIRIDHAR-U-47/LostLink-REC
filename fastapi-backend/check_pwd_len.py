import motor.motor_asyncio
import asyncio

async def check():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['lostlink_db_review']
    user = await db['users'].find_one({'email': 'admin@rec.edu.in'})
    if user:
        pwd = user.get('password')
        print(f"Password Length: {len(pwd)}")
        print(f"Password starts with: {pwd[:10]}")
    else:
        print("User not found")

if __name__ == "__main__":
    asyncio.run(check())
