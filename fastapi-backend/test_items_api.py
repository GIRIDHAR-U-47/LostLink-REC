import requests
import json

BASE_URL = "http://localhost:8080/api"

# Login first
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "test@example.com",
    "password": "password123"
})

token = login_response.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Get my requests
response = requests.get(f"{BASE_URL}/items/my-requests", headers=headers)
print("Status:", response.status_code)
print("\nMy Requests:")
items = response.json()
if items:
    for item in items[:2]:  # Show first 2 items
        print(f"\nItem: {item.get('category')}")
        print(f"  imageUrl: {item.get('imageUrl')}")
        print(f"  type: {item.get('type')}")
        print(f"  status: {item.get('status')}")
else:
    print("No items found")

# Get found items
found_response = requests.get(f"{BASE_URL}/items/found")
print("\n\nFound Items:")
found_items = found_response.json()
if found_items:
    for item in found_items[:2]:
        print(f"\nItem: {item.get('category')}")
        print(f"  imageUrl: {item.get('imageUrl')}")
else:
    print("No found items")
