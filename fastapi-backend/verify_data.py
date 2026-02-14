
import asyncio
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
import sys

# Config
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "lostlink_db_review"
API_URL = "http://localhost:8080/api"

async def check_db_and_api():
    # 1. Check Database Directly
    print("\n--- Checking Database Directly ---")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    items_col = db["items"]
    
    total_found = await items_col.count_documents({"type": "FOUND"})
    total_lost = await items_col.count_documents({"type": "LOST"})
    pending = await items_col.count_documents({"status": "PENDING"})
    available = await items_col.count_documents({"status": "AVAILABLE"})
    
    print(f"DB Total Found: {total_found} (Expected: 2)")
    print(f"DB Total Lost: {total_lost} (Expected: 1)")
    print(f"DB Pending: {pending} (Expected: 1)")
    print(f"DB Available: {available} (Expected: 1)")
    
    # 2. Check API Response
    print("\n--- Checking API Response ---")
    async with httpx.AsyncClient() as http_client:
        # Login to get token (Use JSON body as per auth.py)
        login_res = await http_client.post(f"{API_URL}/auth/login", json={
            "email": "admin@rec.edu.in", # Changed from username to email
            "password": "admin123"
        })
        
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.status_code} - {login_res.text}")
            return
            
        # Auth.py returns { "token": "...", ... } or { "access_token": "...", ... }?
        # Let's check the response structure from auth.py line 42:
        # "token": access_token, "accessToken": access_token
        token = login_res.json().get("token")
        
        # Get Stats
        stats_res = await http_client.get(f"{API_URL}/admin/stats/dashboard", headers={
            "Authorization": f"Bearer {token}"
        })
        
        if stats_res.status_code != 200:
            print(f"Stats failed: {stats_res.status_code} - {stats_res.text}")
            return
            
        data = stats_res.json()
        print("API Response Keys and Values:")
        for k, v in data.items():
            print(f"  {k}: {v}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(check_db_and_api())
