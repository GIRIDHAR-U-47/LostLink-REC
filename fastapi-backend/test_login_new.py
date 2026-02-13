import requests
import json

BASE_URL = "http://10.234.72.182:8080/api"

def test_login():
    email = "newuser@example.com"
    password = "SecurePassword123!"
    
    print(f"Logging in user: {email}")
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    
    if login_response.status_code == 200:
        data = login_response.json()
        print("Login successful!")
        print(f"Token: {data['token'][:50]}...")
        print(f"User: {data['name']} ({data['email']})")
        print(f"Role: {data['roles']}")
    else:
        print(f"Login failed: {login_response.status_code}")
        print("Response:", login_response.text)

if __name__ == "__main__":
    test_login()
