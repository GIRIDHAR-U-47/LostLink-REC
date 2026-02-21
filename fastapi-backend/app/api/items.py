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
    from app.core.utils import generate_custom_id
    
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

    # Generate custom ID based on type
    lost_id = None
    found_id = None
    if type == "LOST":
        lost_id = generate_custom_id("LOST")
    else:
        found_id = generate_custom_id("FND")

    # Construct item dict manually since we are using Form data
    item_dict = {
        "type": type,
        "category": category,
        "description": description,
        "location": location,
        "status": status, # PENDING/OPEN
        "user_id": str(current_user.id),
        "imageUrl": image_url,
        "dateTime": datetime.utcnow(),
        "Lost_ID": lost_id,
        "Found_ID": found_id
    }

    # Insert into DB
    result = await db["items"].insert_one(item_dict)
    created_item = await db["items"].find_one({"_id": result.inserted_id})
    
    # Populate user
    created_item["user"] = current_user.model_dump(by_alias=True)
    return created_item

@router.get("/feed", response_model=List[ItemResponse])
async def get_item_feed(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    # Get all active items (LOST and FOUND)
    # Filter: Not reported by the current user (so they see other's reports)
    # Unless it's an admin viewing the feed
    query = {
        "status": {"$in": ["PENDING", "OPEN", "AVAILABLE"]}
    }
    
    if current_user.role != Role.ADMIN:
        query["user_id"] = {"$ne": str(current_user.id)}

    cursor = db["items"].find(query).sort("dateTime", -1)
    items = await cursor.to_list(length=100)
    
    results = []
    for item in items:
        if "user_id" in item:
            user = await db["users"].find_one({"_id": ObjectId(item["user_id"])})
            if user:
                item["user"] = user
        results.append(item)
    return results

@router.get("/found", response_model=List[ItemResponse])
async def get_found_items(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    # Get all FOUND items with PENDING or AVAILABLE status (not yet claimed)
    # Filter: Not reported by the current user
    query = {
        "type": "FOUND", 
        "status": {"$in": ["PENDING", "AVAILABLE"]}
    }
    
    if current_user.role != Role.ADMIN:
        query["user_id"] = {"$ne": str(current_user.id)}

    cursor = db["items"].find(query).sort("dateTime", -1)
    items = await cursor.to_list(length=100)
    
    results = []
    for item in items:
        if "user_id" in item:
            user = await db["users"].find_one({"_id": ObjectId(item["user_id"])})
            if user:
                item["user"] = user
        results.append(item)
    return results

@router.get("/my-requests", response_model=List[ItemResponse])
async def get_my_requests(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    # 1. Items reported by the user
    items_cursor = db["items"].find({"user_id": str(current_user.id)}).sort("dateTime", -1)
    items = await items_cursor.to_list(length=100)
    
    # 2. Items claimed by the user (but not reported by them)
    # We find claims from this user and fetch the corresponding items
    claims_cursor = db["claims"].find({"claimant_id": str(current_user.id)})
    claims = await claims_cursor.to_list(length=100)
    
    claimed_item_ids = [ObjectId(c["item_id"]) for c in claims if "item_id" in c]
    
    # Filter out items already in the list (reported by user)
    reported_item_ids = [ObjectId(str(i["_id"])) for i in items]
    new_item_ids = [id for id in claimed_item_ids if id not in reported_item_ids]
    
    if new_item_ids:
        claimed_items_cursor = db["items"].find({"_id": {"$in": new_item_ids}})
        claimed_items = await claimed_items_cursor.to_list(length=100)
        items.extend(claimed_items)
        
    # Final sort
    items.sort(key=lambda x: x["dateTime"], reverse=True)
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
