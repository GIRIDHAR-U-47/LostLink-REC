from fastapi import APIRouter, Depends, HTTPException, Query, Body, Form, UploadFile, File
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from pydantic import BaseModel
from app.core.database import get_database
from app.models.enums import Role, ItemStatus, ItemType
from app.models.user_model import UserResponse
from app.models.item_model import ItemResponse
from app.models.audit_model import AuditLog
from app.models.notification_model import Notification
from app.api.deps import get_current_user

router = APIRouter()

class StorageAssignment(BaseModel):
    storage_location: str
    admin_remarks: Optional[str] = None

class HandoverRequest(BaseModel):
    student_id: str
    admin_name: str
    remarks: Optional[str] = None

class BroadcastRequest(BaseModel):
    title: str
    message: str
    category: Optional[str] = "SYSTEM"


# ============ DASHBOARD STATISTICS ============
@router.get("/stats/dashboard")
async def get_dashboard_stats(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get dashboard overview statistics"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    items_col = db["items"]
    claims_col = db["claims"]
    
    # Get stats
    total_lost = await items_col.count_documents({"type": "LOST"})
    total_found = await items_col.count_documents({"type": "FOUND"})
    pending_items = await items_col.count_documents({"status": "PENDING"})
    available_items = await items_col.count_documents({"status": "AVAILABLE"})
    
    # Correct total resolved count (Including legacy RESOLVED status)
    total_resolved = await items_col.count_documents({"status": {"$in": ["RETURNED", "RESOLVED"]}})
    
    # Items returned in the last 24 hours
    returned_today = await items_col.count_documents({
        "status": {"$in": ["RETURNED", "RESOLVED"]},
        "handed_over_at": {"$gte": datetime.utcnow() - timedelta(days=1)}
    })
    
    # High-risk items (phones, IDs, keys, devices, jewellery)
    high_risk_categories = ["DEVICES", "KEYS", "JEWELLERY"]
    high_risk = await items_col.count_documents({
        "category": {"$in": high_risk_categories},
        "status": {"$in": ["PENDING", "AVAILABLE"]}
    })
    
    # Pending claims
    pending_claims = await claims_col.count_documents({"status": "PENDING"})
    
    return {
        "total_lost": total_lost,
        "total_found": total_found,
        "pending_verification": pending_items,
        "available_items": available_items,
        "total_resolved": total_resolved,
        "returned_today": returned_today,
        "high_risk_items": high_risk,
        "pending_claims": pending_claims
    }

@router.get("/stats/category-breakdown")
async def get_category_stats(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get item count breakdown by category"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    items_col = db["items"]
    categories = ["DOCUMENTS", "DEVICES", "ACCESSORIES", "PERSONAL_ITEMS", "KEYS", "BOOKS", "JEWELLERY", "OTHERS"]
    
    breakdown = {}
    for cat in categories:
        count = await items_col.count_documents({"category": cat})
        breakdown[cat] = count
    
    return breakdown

@router.get("/stats/recovery-rate")
async def get_recovery_rate(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Calculate recovery rate: returned items / total found items"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    items_col = db["items"]
    
    total_found = await items_col.count_documents({"type": "FOUND"})
    # Count CLAIMED (Approved/Handover pending) and RETURNED/RESOLVED (Complete) as "Recovered"
    returned = await items_col.count_documents({"type": "FOUND", "status": {"$in": ["RETURNED", "RESOLVED"]}})
    claimed = await items_col.count_documents({"type": "FOUND", "status": "CLAIMED"})
    
    total_recovered = returned + claimed
    
    rate = (total_recovered / total_found * 100) if total_found > 0 else 0
    
    return {
        "total_found": total_found,
        "returned": total_recovered, # We'll call this "Recovered" in UI
        "verified_handover": returned,
        "pending_handover": claimed,
        "recovery_rate_percent": round(rate, 2)
    }

# ============ SEARCH & FILTERS ============

@router.get("/items/search", response_model=List[ItemResponse])
async def search_items(
    current_user: UserResponse = Depends(get_current_user),
    query: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    item_type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db = Depends(get_database)
):
    """Search and filter items with multiple criteria"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    filter_dict = {}
    
    # Text search
    if query:
        filter_dict["$or"] = [
            {"description": {"$regex": query, "$options": "i"}},
            {"category": {"$regex": query, "$options": "i"}},
            {"location": {"$regex": query, "$options": "i"}}
        ]
    
    # Category filter
    if category:
        filter_dict["category"] = category
    
    # Status filter
    if status:
        filter_dict["status"] = status
    
    # Type filter
    if item_type:
        filter_dict["type"] = item_type
    
    # Date range filter
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            date_filter["$lte"] = datetime.fromisoformat(date_to)
        filter_dict["dateTime"] = date_filter
    
    cursor = db["items"].find(filter_dict).sort("dateTime", -1)
    items = await cursor.to_list(length=200)
    
    # Populate user details
    results = []
    for item in items:
        if "user_id" in item:
            user = await db["users"].find_one({"_id": ObjectId(item["user_id"])})
            item["user"] = user
        results.append(item)
    
    return results

@router.post("/items/found", response_model=ItemResponse)
async def admin_add_found_item(
    category: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    storage_location: str = Form(...),
    admin_remarks: Optional[str] = Form(None),
    image: UploadFile = File(None),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Directly add a found item by admin with image upload"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    import shutil
    import os
    
    image_url = None
    if image:
        image_dir = os.path.join(os.getcwd(), "static", "images")
        os.makedirs(image_dir, exist_ok=True)
        file_location = os.path.join(image_dir, image.filename)
        with open(file_location, "wb+") as file_object:
             shutil.copyfileobj(image.file, file_object)
        image_url = f"static/images/{image.filename}"
    
    item_dict = {
        "type": ItemType.FOUND,
        "category": category,
        "description": description,
        "location": location,
        "storage_location": storage_location,
        "admin_remarks": admin_remarks,
        "imageUrl": image_url,
        "dateTime": datetime.utcnow(),
        "status": ItemStatus.AVAILABLE,
        "user_id": str(current_user.id),
        "verified_by": str(current_user.id),
        "verified_by_name": current_user.name,
        "verified_at": datetime.utcnow()
    }
    
    result = await db["items"].insert_one(item_dict)
    item_dict["_id"] = str(result.inserted_id)
    
    # Audit Log
    await db["audit_logs"].insert_one({
        "admin_id": str(current_user.id),
        "admin_name": current_user.name,
        "action": "ITEM_CREATED_BY_ADMIN",
        "target_type": "ITEM",
        "target_id": str(result.inserted_id),
        "details": {"category": category, "description": description},
        "timestamp": datetime.utcnow()
    })
    
    return item_dict

# ============ MATCHING SUPERVISION ============
@router.get("/items/matches")
async def get_potential_matches(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Find potential matches between LOST and FOUND items.
    """
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    found_cursor = db["items"].find({
        "type": "FOUND",
        "status": {"$in": ["PENDING", "AVAILABLE"]}
    })
    found_items = await found_cursor.to_list(length=100)
    
    lost_cursor = db["items"].find({
        "type": "LOST",
        "status": "OPEN"
    })
    lost_items = await lost_cursor.to_list(length=100)
    
    matches = []
    for f in found_items:
        for l in lost_items:
            if f["category"] == l["category"]:
                f_desc = (f.get("description") or "").lower()
                l_desc = (l.get("description") or "").lower()
                
                f_words = set(w for w in f_desc.split() if len(w) > 3)
                l_words = set(w for w in l_desc.split() if len(w) > 3)
                common = f_words.intersection(l_words)
                
                confidence = "LOW"
                if len(common) > 0:
                    confidence = "HIGH"
                
                matches.append({
                    "found_item": {**f, "_id": str(f["_id"])},
                    "lost_item": {**l, "_id": str(l["_id"])},
                    "confidence": confidence,
                    "shared_keywords": list(common)
                })
                
    return matches

# ============ AUDIT LOGS ============

@router.post("/audit-log")
async def log_action(
    action: str,
    target_type: str,
    target_id: str,
    details: Optional[dict] = None,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Log admin action for audit trail"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    log_entry = {
        "admin_id": str(current_user.id),
        "admin_name": current_user.name,
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "details": details,
        "timestamp": datetime.utcnow()
    }
    
    result = await db["audit_logs"].insert_one(log_entry)
    log_entry["_id"] = result.inserted_id
    
    return log_entry

@router.get("/audit-logs")
async def get_audit_logs(
    current_user: UserResponse = Depends(get_current_user),
    limit: int = Query(100),
    db = Depends(get_database)
):
    """Get recent audit logs"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cursor = db["audit_logs"].find().sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    # Convert ObjectId for serialization
    for log in logs:
        log["_id"] = str(log["_id"])
    
    return logs

# ============ NOTIFICATIONS ============

@router.get("/notifications")
async def get_notifications(
    current_user: UserResponse = Depends(get_current_user),
    unread_only: bool = Query(False),
    db = Depends(get_database)
):
    """Get admin notifications"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    filter_dict = {"admin_id": str(current_user.id)}
    if unread_only:
        filter_dict["read"] = False
    
    cursor = db["notifications"].find(filter_dict).sort("created_at", -1).limit(50)
    notifications = await cursor.to_list(length=50)
    
    return notifications

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Mark notification as read"""
    result = await db["notifications"].update_one(
        {"_id": ObjectId(notification_id), "admin_id": str(current_user.id)},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Marked as read"}

@router.post("/notification-trigger")
async def create_notification(
    admin_id: str,
    title: str,
    message: str,
    notification_type: str,
    related_id: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Manually trigger a notification (admin only)"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    notification = {
        "admin_id": admin_id,
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "related_id": related_id,
        "read": False,
        "created_at": datetime.utcnow()
    }
    
    result = await db["notifications"].insert_one(notification)
    notification["_id"] = result.inserted_id
    
    return notification

# ============ PHYSICAL HANDOVER & UNCLAIMED HANDLING ============

@router.post("/items/{item_id}/handover")
async def process_physical_handover(
    item_id: str,
    handover: HandoverRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Mark an item as physically returned and record student details"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        obj_id = ObjectId(item_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid item ID")
    
    update_data = {
        "status": ItemStatus.RETURNED,
        "handed_over_by": str(current_user.id),
        "handed_over_by_name": handover.admin_name,
        "handed_over_to_student_id": handover.student_id,
        "handed_over_at": datetime.utcnow()
    }
    
    if handover.remarks:
        update_data["admin_remarks"] = handover.remarks

    result = await db["items"].update_one(
        {"_id": obj_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Log the action
    await db["audit_logs"].insert_one({
        "admin_id": str(current_user.id),
        "admin_name": current_user.name,
        "action": "PHYSICAL_HANDOVER",
        "target_type": "ITEM",
        "target_id": item_id,
        "details": {
            "student_id": handover.student_id,
            "remarks": handover.remarks
        },
        "timestamp": datetime.utcnow()
    })
    
    return {"message": "Handover recorded successfully"}

@router.post("/items/{item_id}/archive")
async def archive_unclaimed_item(
    item_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Mark an item as archived"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        obj_id = ObjectId(item_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid item ID")
        
    result = await db["items"].update_one(
        {"_id": obj_id},
        {"$set": {"status": ItemStatus.ARCHIVED, "archived_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
        
    # Audit Log
    await db["audit_logs"].insert_one({
        "admin_id": str(current_user.id),
        "admin_name": current_user.name,
        "action": "ITEM_ARCHIVED",
        "target_type": "ITEM",
        "target_id": item_id,
        "details": {"status": "ARCHIVED"},
        "timestamp": datetime.utcnow()
    })
    
    return {"message": "Item archived"}

@router.post("/items/{item_id}/dispose")
async def dispose_unclaimed_item(
    item_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Mark an item as disposed"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        obj_id = ObjectId(item_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid item ID")
        
    result = await db["items"].update_one(
        {"_id": obj_id},
        {"$set": {"status": ItemStatus.DISPOSED, "disposed_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
        
    # Audit Log
    await db["audit_logs"].insert_one({
        "admin_id": str(current_user.id),
        "admin_name": current_user.name,
        "action": "ITEM_DISPOSED",
        "target_type": "ITEM",
        "target_id": item_id,
        "details": {"status": "DISPOSED"},
        "timestamp": datetime.utcnow()
    })
    
    return {"message": "Item marked as disposed"}

# ============ CAMPUS BROADCAST ============

@router.post("/broadcast")
async def send_campus_broadcast(
    broadcast: BroadcastRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Send a notification to all registered users"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all user IDs
    users_cursor = db["users"].find({}, {"_id": 1})
    users = await users_cursor.to_list(length=None)
    
    notifications = []
    now = datetime.utcnow()
    
    for user in users:
        notifications.append({
            "user_id": str(user["_id"]),
            "title": broadcast.title,
            "message": broadcast.message,
            "type": broadcast.category,
            "read": False,
            "created_at": now
        })
    
    if notifications:
        await db["notifications"].insert_many(notifications)
        
    # Log the action
    await db["audit_logs"].insert_one({
        "admin_id": str(current_user.id),
        "admin_name": current_user.name,
        "action": "CAMPUS_BROADCAST",
        "target_type": "SYSTEM",
        "target_id": "ALL_USERS",
        "details": {"title": broadcast.title},
        "timestamp": now
    })
    
    return {"message": f"Broadcast sent to {len(notifications)} users"}

# ============ STORAGE MANAGEMENT ============

@router.put("/items/{item_id}/assign-storage")
async def assign_storage_location(
    item_id: str,
    assignment: StorageAssignment,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Assign storage location to found item"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Validate ObjectId
    try:
        obj_id = ObjectId(item_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid item ID format: {str(e)}")
    
    update_data = {
        "storage_location": assignment.storage_location,
        "verified_by": str(current_user.id),
        "verified_by_name": current_user.name,
        "verified_at": datetime.utcnow(),
        "status": "AVAILABLE"  # Automatically verified
    }
    
    if assignment.admin_remarks:
        update_data["admin_remarks"] = assignment.admin_remarks

    
    try:
        result = await db["items"].update_one(
            {"_id": obj_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        
        updated_item = await db["items"].find_one({"_id": obj_id})
        
        # Convert ObjectId to string for JSON serialization
        if updated_item:
            updated_item["_id"] = str(updated_item["_id"])
            if "user_id" in updated_item:
                updated_item["user_id"] = str(updated_item["user_id"])
        
        # Log action
        await db["audit_logs"].insert_one({
            "admin_id": str(current_user.id),
            "admin_name": current_user.name,
            "action": "STORAGE_ASSIGNED",
            "target_type": "ITEM",
            "target_id": item_id,
            "details": {"storage_location": assignment.storage_location},
            "timestamp": datetime.utcnow()
        })
        
        return updated_item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign storage: {str(e)}")

# ============ ADMIN PROFILE & LOGIN HISTORY ============

@router.get("/profile")
async def get_admin_profile(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get current admin profile"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "registerNumber": current_user.register_number
    }

@router.get("/login-history")
async def get_login_history(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get admin login history (from audit logs)"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cursor = db["audit_logs"].find({
        "admin_id": str(current_user.id),
        "action": "LOGIN"
    }).sort("timestamp", -1).limit(20)
    
    history = await cursor.to_list(length=20)
    for entry in history:
        entry["_id"] = str(entry["_id"])
        
    return history
