import requests
import json

BASE_URL = "http://localhost:8080/api"

# Get found items (public endpoint)
found_response = requests.get(f"{BASE_URL}/items/found")
print("Found Items Response Status:", found_response.status_code)
print("Found Items:", json.dumps(found_response.json(), indent=2, default=str)[:500])

# Check what the status values are
from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017')
db = client['lostlink_db']
items = db['items']

print("\n\nAll item statuses in DB:")
for item in items.find():
    print(f"  Type: {item.get('type')}, Status: {item.get('status')}")
