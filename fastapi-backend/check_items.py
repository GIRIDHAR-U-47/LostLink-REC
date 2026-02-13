from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=5000)
db = client['lostlink_db']
items = db['items']

print("Total items in database:", items.count_documents({}))
print("\nSample items:")
for item in items.find().limit(3):
    print(f"\nID: {item['_id']}")
    print(f"  Type: {item.get('type')}")
    print(f"  Category: {item.get('category')}")
    print(f"  ImageUrl: {item.get('imageUrl')}")
    print(f"  User ID: {item.get('user_id')}")
    print(f"  Status: {item.get('status')}")
