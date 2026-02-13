from pymongo import MongoClient
from passlib.context import CryptContext

client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=5000)
db = client['lostlink_db']
users = db['users']

# Hash a test password
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
hashed = pwd_context.hash('password123')

# Insert a test user
user = {
    'email': 'test@example.com',
    'password': hashed,
    'name': 'Test User',
    'registerNumber': '211001001',
    'role': 'USER'
}

# Check if user exists
existing = users.find_one({'email': 'test@example.com'})
if existing:
    print('Test user already exists')
else:
    result = users.insert_one(user)
    print(f'Test user inserted with ID: {result.inserted_id}')

# Verify
test_user = users.find_one({'email': 'test@example.com'})
print(f'Verified user: {test_user["email"]}, name: {test_user["name"]}')
