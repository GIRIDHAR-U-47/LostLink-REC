from fastapi import APIRouter, Depends, HTTPException, Query, Body, Form, UploadFile, File
from typing import List
from datetime import datetime
from bson import ObjectId
from app.core.database import get_database
from app.models.item_model import ItemCreate, ItemResponse, ItemInDB
from app.models.enums import ItemType, ItemStatus, Role
from app.models.user_model import UserResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/report", response_model=ItemResponse)
async def report_item(
    type: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    status: str = Form(...),
    dateTime: str = Form(None), # Frontend sends ISO string
    image: UploadFile = File(None),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    import shutil
    import os
    from app.core.config import settings
    
    image_url = None
    if image:
        # Create static directory if it doesn't exist (safety check)
        image_dir = os.path.join(os.getcwd(), "static", "images")
        os.makedirs(image_dir, exist_ok=True)
        
        file_location = os.path.join(image_dir, image.filename)
        with open(file_location, "wb+") as file_object:
             shutil.copyfileobj(image.file, file_object)
        
        # Store relative path for database
        image_url = f"static/images/{image.filename}"
        print(f"Image saved to: {file_location}, URL: {image_url}")

    # Construct item dict manually since we are using Form data
    item_dict = {
        "type": type,
        "category": category,
        "description": description,
        "location": location,
        "status": status, # PENDING/OPEN
        "user_id": str(current_user.id),
        "imageUrl": image_url,
        "dateTime": datetime.utcnow()
    }

    # Insert into DB
    result = await db["items"].insert_one(item_dict)
    created_item = await db["items"].find_one({"_id": result.inserted_id})
    
    # Populate user
    created_item["user"] = current_user.model_dump(by_alias=True)
    return created_item

@router.get("/found", response_model=List[ItemResponse])
async def get_found_items(db = Depends(get_database)):
    # Get all FOUND items with PENDING status (not yet claimed)
    cursor = db["items"].find({"type": "FOUND", "status": "PENDING"})
    items = await cursor.to_list(length=100)
    return items

@router.get("/my-requests", response_model=List[ItemResponse])
async def get_my_requests(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    cursor = db["items"].find({"user_id": str(current_user.id)})
    items = await cursor.to_list(length=100)
    return items

@router.get("/lost", response_model=List[ItemResponse])
async def get_lost_items(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cursor = db["items"].find({"type": ItemType.LOST})
    items = await cursor.to_list(length=100)
    
    # Needs user population?
    results = []
    for item in items:
        user = await db["users"].find_one({"_id": ObjectId(item["user_id"])})
        if user:
            item["user"] = user
        results.append(item)
    return results

@router.put("/{id}/status")
async def update_item_status(
    id: str,
    status: ItemStatus,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db["items"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
         raise HTTPException(status_code=404, detail="Item not found")
         
    updated_item = await db["items"].find_one({"_id": ObjectId(id)})
    return updated_item
