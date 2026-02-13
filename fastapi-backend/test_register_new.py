import requests
import json

BASE_URL = "http://10.234.72.182:8080/api"

def test_register():
    email = f"newuser@example.com"
    password = "SecurePassword123!"
    
    print(f"Registering new user: {email}")
    reg_response = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "name": "New User",
        "registerNumber": "211001002",
        "role": "USER"
    })
    
    if reg_response.status_code == 200:
        print("Registration successful!")
        print("Response:", json.dumps(reg_response.json(), indent=2))
    else:
        print(f"Registration failed: {reg_response.status_code}")
        print("Response:", reg_response.text)

if __name__ == "__main__":
    test_register()
