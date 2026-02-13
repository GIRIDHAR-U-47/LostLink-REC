import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8080/api"

def test_report_item():
    # 1. Login to get token
    email = "test@example.com"
    password = "password123"
    
    auth_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    
    if auth_response.status_code != 200:
        print(f"Login failed: {auth_response.text}")
        return

    token = auth_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Report Item
    payload = {
        "type": "LOST",
        "category": "Test Category",
        "description": "Test Description",
        "location": "Test Location",
        "dateTime": datetime.utcnow().isoformat(),
        "status": "PENDING"
    }
    
    print(f"Reporting item with payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(f"{BASE_URL}/items/report", json=payload, headers=headers)
    
    if response.status_code == 200:
        print("SUCCESS: Item reported successfully.")
        print("Response:", json.dumps(response.json(), indent=2))
    else:
        print(f"FAILURE: Report item failed: {response.status_code}")
        print("Response:", response.text)

if __name__ == "__main__":
    test_report_item()
