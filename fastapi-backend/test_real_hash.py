from passlib.context import CryptContext
import motor.motor_asyncio
import asyncio

async def test():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['lostlink_db_review']
    user = await db['users'].find_one({'email': 'admin@rec.edu.in'})
    
    if not user:
        print("User not found")
        return

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hash = user['password']
    password = "admin123"

    print(f"Testing verify with hash: {hash}")
    try:
        result = pwd_context.verify(password, hash)
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test())
