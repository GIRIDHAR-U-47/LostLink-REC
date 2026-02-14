import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_items():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["lostlink_db_review"]
    items_col = db["items"]
    
    print("Items found today (2026-02-14) with ALL fields:")
    from datetime import datetime, time
    today_start = datetime.combine(datetime(2026, 2, 14), time.min)
    
    print("Admin Stats Simulation:")
    total_lost = await items_col.count_documents({"type": "LOST"})
    total_found = await items_col.count_documents({"type": "FOUND"})
    pending_items = await items_col.count_documents({"status": "PENDING"})
    
    print(f"Total Lost: {total_lost}")
    print(f"Total Found: {total_found}")
    print(f"Pending Items: {pending_items}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_items())
