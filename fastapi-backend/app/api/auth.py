from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any
from app.core.database import get_database
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user_model import UserCreate, UserResponse, UserInDB
from app.models.enums import Role
from datetime import datetime, timedelta

router = APIRouter()

@router.post("/login/user")
async def login_user(
    login_request: dict = Body(...),
    db = Depends(get_database)
) -> Any:
    """
    User login endpoint. Only allows users with 'USER' role.
    Rejects admin accounts with HTTP 403.
    """
    email = login_request.get("email")
    password = login_request.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    try:
        # Step 1: Authenticate user
        user = await db["users"].find_one({"email": email})
        if not user:
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        if not verify_password(password, user["password"]):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        # Step 2: Role-based validation - reject admin users
        user_role = user.get("role", "USER")
        if user_role == "ADMIN":
            raise HTTPException(
                status_code=403,
                detail="This account belongs to an admin. Please use the admin login page."
            )
        
        # Step 3: Generate JWT and return response
        roles = [user_role]
        access_token = create_access_token(
            data={"sub": user["email"], "roles": roles}
        )

        print(f"User login successful for: {email}")
        
        response_data = {
            "token": access_token,
            "accessToken": access_token,
            "type": "Bearer",
            "id": str(user["_id"]),
            "email": user["email"],
            "roles": roles,
            "name": user.get("name"),
            "registerNumber": user.get("registerNumber") or user.get("register_number")
        }
        print("Returning user response:", response_data)
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR during user login: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")


@router.post("/login/admin")
async def login_admin(
    login_request: dict = Body(...),
    db = Depends(get_database)
) -> Any:
    """
    Admin login endpoint. Only allows users with 'ADMIN' role.
    Rejects regular user accounts with HTTP 403.
    """
    email = login_request.get("email")
    password = login_request.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    try:
        # Step 1: Authenticate user
        user = await db["users"].find_one({"email": email})
        if not user:
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        if not verify_password(password, user["password"]):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        # Step 2: Role-based validation - reject non-admin users
        user_role = user.get("role", "USER")
        if user_role != "ADMIN":
            raise HTTPException(
                status_code=403,
                detail="Unauthorized admin access"
            )
        
        # Step 3: Generate JWT and log admin access
        roles = [user_role]
        access_token = create_access_token(
            data={"sub": user["email"], "roles": roles}
        )

        print(f"Admin login successful for: {email}")
        
        # Log admin login
        await db["audit_logs"].insert_one({
            "admin_id": str(user["_id"]),
            "admin_name": user.get("name", "Unknown"),
            "action": "LOGIN",
            "target_type": "ADMIN",
            "target_id": str(user["_id"]),
            "details": {"email": email, "ip": "N/A"},
            "timestamp": datetime.utcnow()
        })
        
        response_data = {
            "token": access_token,
            "accessToken": access_token,
            "type": "Bearer",
            "id": str(user["_id"]),
            "email": user["email"],
            "roles": roles,
            "name": user.get("name"),
            "registerNumber": user.get("registerNumber") or user.get("register_number")
        }
        print("Returning admin response:", response_data)
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR during admin login: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@router.post("/register")
async def register(
    user_in: UserCreate,
    db = Depends(get_database)
) -> Any:
    try:
        # Check if user exists
        existing_user = await db["users"].find_one({"email": user_in.email})
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Error: Email is already in use!"
            )
        
        hashed_password = get_password_hash(user_in.password)
        
        user_dict = user_in.model_dump(by_alias=True, exclude_unset=True)
        user_dict["password"] = hashed_password
        
        # Insert
        result = await db["users"].insert_one(user_dict)
        
        return {"message": "User registered successfully!"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error during register: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")
