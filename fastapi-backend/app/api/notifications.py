from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from app.core.database import get_database
from app.models.user_model import UserResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/me")
async def get_my_notifications(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Retrieve all notifications for the current user including broadcasts"""
    # Find notifications explicitly for this user OR broadcasts (where user_id is the user's ID)
    # The current broadcast logic in admin.py inserts a separate notification for EACH user.
    # So we just filter by user_id.
    
    cursor = db["notifications"].find({"user_id": str(current_user.id)}).sort("created_at", -1)
    notifications = await cursor.to_list(length=50)
    
    # Format for response
    for n in notifications:
        n["_id"] = str(n["_id"])
        if "created_at" in n and isinstance(n["created_at"], datetime):
             n["created_at"] = n["created_at"].isoformat()
             
    return notifications

@router.put("/{notification_id}/read")
async def mark_user_notification_read(
    notification_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Mark a notification as read for the user"""
    from bson import ObjectId
    try:
        obj_id = ObjectId(notification_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    result = await db["notifications"].update_one(
        {"_id": obj_id, "user_id": str(current_user.id)},
        {"$set": {"read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return {"message": "Success"}
