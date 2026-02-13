import requests
import json

BASE_URL = "http://localhost:8080/api"

# Login as admin
print("Testing Admin Login...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@rajalakshmi.edu.in",
    "password": "admin123"
})

if login_response.status_code == 200:
    data = login_response.json()
    print("✓ Admin Login Successful!\n")
    print(f"Name: {data['name']}")
    print(f"Email: {data['email']}")
    print(f"Role: {data['roles']}")
    print(f"Register Number: {data['registerNumber']}")
    print(f"\nToken (first 50 chars): {data['token'][:50]}...")
else:
    print(f"✗ Login failed: {login_response.status_code}")
    print(f"Response: {login_response.text}")
