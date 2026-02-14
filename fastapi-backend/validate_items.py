import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import ValidationError
from app.models.item_model import ItemResponse
from bson import ObjectId

async def validate_items():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["lostlink_db_review"]
    items_col = db["items"]
    
    print("Validating items against ItemResponse model...")
    cursor = items_col.find()
    async for item in cursor:
        # Convert _id to string for pydantic
        item["id"] = str(item["_id"])
        
        # Mock user population if user_id exists
        if "user_id" in item:
            item["user"] = {
                "id": item["user_id"],
                "name": "Mock User",
                "email": "mock@example.com",
                "role": "USER",
                "registerNumber": "123"
            }
            
        try:
            ItemResponse.model_validate(item)
            # print(f"Item {item['_id']} is VALID")
        except ValidationError as e:
            print(f"Item {item['_id']} is INVALID:")
            print(e)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(validate_items())
