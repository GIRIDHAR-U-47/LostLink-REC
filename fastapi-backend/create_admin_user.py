from pymongo import MongoClient
from passlib.context import CryptContext

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=5000)
db = client['lostlink_db']
users = db['users']

# Hash password with bcrypt
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
hashed_password = pwd_context.hash('admin123')

# Create admin user
admin_user = {
    'email': 'admin@rajalakshmi.edu.in',
    'password': hashed_password,
    'name': 'Student Care Admin',
    'registerNumber': 'ADMIN001',
    'role': 'ADMIN'
}

# Check if admin already exists
existing = users.find_one({'email': admin_user['email']})
if existing:
    print(f"Admin user already exists with ID: {existing['_id']}")
    print(f"Role: {existing['role']}")
else:
    result = users.insert_one(admin_user)
    print(f"✓ Admin user created with ID: {result.inserted_id}")
    print(f"\nLogin Credentials:")
    print(f"  Email: {admin_user['email']}")
    print(f"  Password: admin123")
    print(f"  Role: {admin_user['role']}")
