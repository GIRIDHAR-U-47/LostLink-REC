import requests
import json

BASE_URL = "http://localhost:8080/api/auth"

def test_login():
    # Attempt to login with a test user - if it fails (400), we know the endpoint is reachable
    # if it succeeds, we check the response keys
    
    # 1. Register first to ensure user exists
    email = "test@example.com"
    password = "password123"
    
    print(f"Registering user: {email}")
    reg_response = requests.post(f"{BASE_URL}/register", json={
        "email": email,
        "password": password,
        "name": "Test User",
        "role": "USER"
    })
    
    if reg_response.status_code == 200:
        print("Registration successful")
    else:
        print(f"Registration failed (might already exist): {reg_response.text}")
        
    # 2. Login
    print(f"Logging in user: {email}")
    login_response = requests.post(f"{BASE_URL}/login", json={
        "email": email,
        "password": password
    })
    
    if login_response.status_code == 200:
        data = login_response.json()
        print("Login successful.")
        print("Response keys:", list(data.keys()))
        print("Full response:", json.dumps(data, indent=2))
        
        if "token" in data:
            print("SUCCESS: 'token' field found in response.")
        else:
            print("FAILURE: 'token' field NOT found in response.")
    else:
        print(f"Login failed: {login_response.status_code} - {login_response.text}")

if __name__ == "__main__":
    test_login()
