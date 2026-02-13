import requests
import json

BASE_URL = "http://localhost:8080/api"

def test_get_items():
    # 1. Login
    email = "test@example.com"
    password = "password123"
    auth_response = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    token = auth_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get My Requests
    print("Fetching My Requests...")
    response = requests.get(f"{BASE_URL}/items/my-requests", headers=headers)
    if response.status_code == 200:
        items = response.json()
        print(f"Got {len(items)} items.")
        if len(items) > 0:
            print("First item keys:", list(items[0].keys()))
            print("First item:", json.dumps(items[0], indent=2))
            
            if "id" in items[0]:
                print("SUCCESS: 'id' field found.")
            else:
                print("FAILURE: 'id' field NOT found.")
    else:
        print(f"Failed to get items: {response.text}")

if __name__ == "__main__":
    test_get_items()
