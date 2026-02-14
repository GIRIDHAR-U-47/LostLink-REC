from passlib.context import CryptContext
import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash = "$2b$12$oXvF7vXhU6E1p7r6v8u6uO1v6vXhU6E1p7r6v8u6uO1v6vXhU6E1" # Example hash
password = "admin123"

try:
    print(f"Testing verify with '{password}'")
    result = pwd_context.verify(password, hash)
    print(f"Result: {result}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
