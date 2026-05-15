import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "test_db")

def test_mongodb_connection():
    print("--- MongoDB Atlas Connection Test ---")
    
    if not MONGODB_URL:
        print("ERROR: MONGODB_URL not found in .env file.")
        return

    try:
        # 1. Initialize Client
        print(f"Connecting to: {MONGODB_URL.split('@')[1] if '@' in MONGODB_URL else 'Hidden URL'}")
        client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        
        # 2. Ping the Server
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas!")

        # 3. Access Database
        db = client[DATABASE_NAME]
        test_collection = db["connection_test"]

        # 4. Mock Data Operation
        mock_data = {
            "test_field": "Connection Successful",
            "timestamp": "2026-05-15T16:47:31",
            "type": "mock_data"
        }

        print(f"Inserting mock data into '{DATABASE_NAME}.connection_test'...")
        insert_result = test_collection.insert_one(mock_data)
        doc_id = insert_result.inserted_id
        print(f"✅ Mock data inserted with ID: {doc_id}")

        # 5. Retrieve Data
        retrieved_doc = test_collection.find_one({"_id": doc_id})
        if retrieved_doc:
            print(f"✅ Mock data retrieved successfully: {retrieved_doc['test_field']}")
        else:
            print("❌ Failed to retrieve mock data.")

        # 6. Clean up
        print("Cleaning up test data...")
        test_collection.delete_one({"_id": doc_id})
        print("✅ Test data deleted.")

        client.close()
        print("--- Test Completed Successfully ---")

    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    test_mongodb_connection()
