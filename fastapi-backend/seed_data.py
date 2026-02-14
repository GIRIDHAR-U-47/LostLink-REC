
import logging
from datetime import datetime, timedelta
from pymongo import MongoClient
from passlib.context import CryptContext
import os

# Configuration
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "lostlink_db_review" 

# Setup Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def seed_data():
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print(f"Creating/Resetting Database: {DATABASE_NAME}...")
    
    # Clear existing collections
    db.users.drop()
    db.items.drop()
    db.claims.drop()
    
    print("Dropped existing collections.")

    # --- Users ---
    users = [
        {
            "name": "Admin User",
            "email": "admin@rec.edu.in",
            "password": get_password_hash("admin123"),
            # Correct field per app logical: singular role
            "role": "ADMIN", 
            "roles": ["ADMIN"], # Kept for backward compat if needed
            "registerNumber": "ADMIN001",
            "department": "Admin Dept",
            "phone": "9999999999",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "John Doe",
            "email": "john@rec.edu.in",
            "password": get_password_hash("student123"),
            "role": "USER",
            "roles": ["USER"],
            "registerNumber": "2101001",
            "department": "CSE",
            "phone": "9876543210",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Jane Smith",
            "email": "jane@rec.edu.in",
            "password": get_password_hash("student123"),
            "role": "USER",
            "roles": ["USER"],
            "registerNumber": "2101002",
            "department": "ECE",
            "phone": "8765432109",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    result_users = db.users.insert_many(users)
    user_ids = {u["email"]: u["_id"] for u in db.users.find()}
    print(f"Inserted {len(result_users.inserted_ids)} users.")

    # --- Items ---
    items = [
        # Found Items
        {
            "category": "Electronics",
            "description": "Black Dell Laptop Charger found in Library",
            "dateTime": datetime.utcnow() - timedelta(days=2),
            "location": "Library 2nd Floor",
            "status": "AVAILABLE",
            "type": "FOUND",
            "is_active": True,
            "user_id": str(user_ids["john@rec.edu.in"]),
            "image_url": "uploads/default_charger.jpg", 
            "storage_location": "Rack A1",
            "created_at": datetime.utcnow()
        },
        {
            "category": "Clothing",
            "description": "Blue Hoodie left in Canteen",
            "dateTime": datetime.utcnow() - timedelta(hours=5),
            "location": "Canteen Table 4",
            "status": "PENDING", 
            "type": "FOUND",
            "is_active": True,
            "user_id": str(user_ids["jane@rec.edu.in"]),
            "created_at": datetime.utcnow()
        },
        # Lost Items
        {
            "category": "Wallets",
            "description": "Brown leather wallet with ID card",
            "dateTime": datetime.utcnow() - timedelta(days=1),
            "location": "Main Block Corridor",
            "status": "LOST",
            "type": "LOST",
            "is_active": True,
            "user_id": str(user_ids["john@rec.edu.in"]),
            "contact_phone": "9876543210",
            "created_at": datetime.utcnow()
        }
    ]
    
    result_items = db.items.insert_many(items)
    item_list = list(db.items.find())
    print(f"Inserted {len(result_items.inserted_ids)} items.")

    # --- Claims ---
    # Jane claims the Charger found by John
    # find the item safely
    charger_item = next((i for i in item_list if "Charger" in i["description"]), None)
    
    if charger_item:
        claims = [
            {
                "item_id": charger_item["_id"],
                "claimant_id": str(user_ids["jane@rec.edu.in"]),
                "status": "PENDING",
                "proofOfOwnership": "Usage scratch marks on the adapter brick",
                "verificationDetails": "Usage scratch marks on the adapter brick", # Compatibility
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                # Flattened fields for UI compat if API returns raw docs
                "claimantName": "Jane Smith",
                "claimantEmail": "jane@rec.edu.in",
                "category": "Electronics",
                "description": "Black Dell Laptop Charger found in Library"
            }
        ]
        
        db.claims.insert_many(claims)
        print(f"Inserted {len(claims)} claims.")

    print("\n--- Seeding Complete ---")
    print(f"Database: {DATABASE_NAME}")
    print("Admin Email: admin@rec.edu.in")
    print("Password: admin123")
    print("------------------------")

    client.close()

if __name__ == "__main__":
    seed_data()
