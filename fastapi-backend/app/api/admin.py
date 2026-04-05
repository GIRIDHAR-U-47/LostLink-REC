from fastapi import APIRouter, Depends, HTTPException, Query, Body, Form, UploadFile, File
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from pydantic import BaseModel
import math
import os
import shutil
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
    status: Optional[str] = None

class HandoverRequest(BaseModel):
    student_id: str
    admin_name: str
    remarks: Optional[str] = None

class LinkItemRequest(BaseModel):
    linked_item_id: str

class BroadcastRequest(BaseModel):
    title: str
    message: str
    category: Optional[str] = "SYSTEM"

class ClaimMessageRequest(BaseModel):
    message: str
    require_response: Optional[bool] = False

class ClaimRejectRequest(BaseModel):
    reason: str
    remarks: Optional[str] = None


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
    
    from app.core.utils import generate_custom_id
    
    image_url = None
    if image:
        image_dir = os.path.join(os.getcwd(), "static", "images")
        os.makedirs(image_dir, exist_ok=True)
        file_location = os.path.join(image_dir, image.filename)
        with open(file_location, "wb+") as file_object:
             shutil.copyfileobj(image.file, file_object)
        image_url = f"static/images/{image.filename}"
    
    found_id = generate_custom_id("FND")

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
        "verified_at": datetime.utcnow(),
        "Found_ID": found_id
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
        "status": assignment.status if assignment.status else ItemStatus.AVAILABLE
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

@router.put("/items/{item_id}/link")
async def link_items(
    item_id: str,
    link: LinkItemRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Link a LOST item with a FOUND item (mirror update)"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        id1 = ObjectId(item_id)
        id2 = ObjectId(link.linked_item_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid item ID")

    # Verify items exist
    item1 = await db["items"].find_one({"_id": id1})
    item2 = await db["items"].find_one({"_id": id2})
    
    if not item1 or not item2:
        raise HTTPException(status_code=404, detail="One or both items not found")

    # Update both items to link them
    await db["items"].update_one({"_id": id1}, {"$set": {"linked_item_id": link.linked_item_id}})
    await db["items"].update_one({"_id": id2}, {"$set": {"linked_item_id": item_id}})

    # Log action
    await db["audit_logs"].insert_one({
        "admin_id": str(current_user.id),
        "admin_name": current_user.name,
        "action": "ITEMS_LINKED",
        "target_type": "ITEM",
        "target_id": item_id,
        "details": {"linked_with": link.linked_item_id, "item1_type": item1['type'], "item2_type": item2['type']},
        "timestamp": datetime.utcnow()
    })
    
    return {"message": "Items linked successfully"}

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

@router.get("/items/{item_id}/context")
async def get_item_context(
    item_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get full context for an item: itself, its link, and its claims"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        obj_id = ObjectId(item_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid item ID")
        
    item = await db["items"].find_one({"_id": obj_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Convert item _id
    item["_id"] = str(item["_id"])
    
    # Populate item reporter/owner
    if "user_id" in item:
        user = await db["users"].find_one({"_id": ObjectId(item["user_id"])})
        if user:
            user["_id"] = str(user["_id"])
            item["user"] = user
            
    # Get Linked Item
    linked_item = None
    if item.get("linked_item_id"):
        try:
            linked_item = await db["items"].find_one({"_id": ObjectId(item["linked_item_id"])})
            if linked_item:
                linked_item["_id"] = str(linked_item["_id"])
                # Populate linked item user
                if "user_id" in linked_item:
                    l_user = await db["users"].find_one({"_id": ObjectId(linked_item["user_id"])})
                    if l_user:
                        l_user["_id"] = str(l_user["_id"])
                        linked_item["user"] = l_user
        except:
            pass
            
    # Get Claims
    claims_cursor = db["claims"].find({"item_id": item_id})
    claims = await claims_cursor.to_list(length=50)
    
    for c in claims:
        c["_id"] = str(c["_id"])
        # Populate claimant
        if c.get("claimant_id"):
            c_user = await db["users"].find_one({"_id": ObjectId(c["claimant_id"])})
            if c_user:
                c_user["_id"] = str(c_user["_id"])
                c["claimant"] = c_user
                
    return {
        "item": item,
        "linked_item": linked_item,
        "claims": claims
    }
@router.post("/items/{item_id}/notify-owner")
async def notify_lost_item_owner(
    item_id: str,
    payload: dict = Body(None),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Notify the owner of a LOST item that a match has been found.
    Updates status to AVAILABLE and sends a notification with optional remarks.
    """
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        obj_id = ObjectId(item_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid item ID")
        
    item = await db["items"].find_one({"_id": obj_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    if item["type"] != ItemType.LOST:
        raise HTTPException(status_code=400, detail="Only LOST items can be notified to owners")

    remarks = payload.get("remarks") if payload else None
    
    update_dict = {
        "status": ItemStatus.AVAILABLE,
        "verified_at": datetime.utcnow(),
        "verified_by": str(current_user.id),
        "verified_by_name": current_user.name
    }
    
    if remarks:
        update_dict["admin_remarks"] = remarks
    elif not item.get("admin_remarks"):
        update_dict["admin_remarks"] = "Match found! Please visit Lost & Found office for collection."

    # Update status
    await db["items"].update_one(
        {"_id": obj_id},
        {"$set": update_dict}
    )
    
    # Send notification to the user who reported the lost item
    if item.get("user_id"):
        msg = f"A matching item for your lost {item.get('category', 'item')} has been found."
        if remarks:
             msg += f" Note: {remarks}"
        else:
             msg += " Please visit the L&F office for collection."

        notification = {
            "user_id": str(item["user_id"]),
            "title": "Great News! Item Found 🎁",
            "message": msg,
            "type": "MATCH_FOUND",
            "related_id": item_id,
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db["notifications"].insert_one(notification)

    # Audit Log
    await db["audit_logs"].insert_one({
        "admin_id": str(current_user.id),
        "admin_name": current_user.name,
        "action": "OWNER_NOTIFIED",
        "target_type": "ITEM",
        "target_id": item_id,
        "details": {"status_to": "AVAILABLE", "remarks_included": bool(remarks)},
        "timestamp": datetime.utcnow()
    })
    
    return {"message": "Owner notified successfully"}


# ============ ISSUE 1: CLAIM FULL CONTEXT WITH SIDE-BY-SIDE COMPARISON ============

@router.get("/claims/{claim_id}/full-context")
async def get_claim_full_context(
    claim_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get complete context for a claim: found item, matching lost reports, claimant info, and claim proof - all in one view"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        obj_id = ObjectId(claim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid claim ID")
    
    # Get the claim
    claim = await db["claims"].find_one({"_id": obj_id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    claim["_id"] = str(claim["_id"])
    
    # Get the found item being claimed
    found_item = None
    if claim.get("item_id"):
        try:
            found_item = await db["items"].find_one({"_id": ObjectId(claim["item_id"])})
            if found_item:
                found_item["_id"] = str(found_item["_id"])
                # Get the reporter of the found item
                if found_item.get("user_id"):
                    reporter = await db["users"].find_one({"_id": ObjectId(found_item["user_id"])})
                    if reporter:
                        reporter["_id"] = str(reporter["_id"])
                        found_item["reporter"] = reporter
        except:
            pass
    
    # Get linked lost item (if any)
    linked_lost_item = None
    if found_item and found_item.get("linked_item_id"):
        try:
            linked_lost_item = await db["items"].find_one({"_id": ObjectId(found_item["linked_item_id"])})
            if linked_lost_item:
                linked_lost_item["_id"] = str(linked_lost_item["_id"])
                if linked_lost_item.get("user_id"):
                    lost_reporter = await db["users"].find_one({"_id": ObjectId(linked_lost_item["user_id"])})
                    if lost_reporter:
                        lost_reporter["_id"] = str(lost_reporter["_id"])
                        linked_lost_item["reporter"] = lost_reporter
        except:
            pass
    
    # Find matching lost reports (same category, open status)
    matching_lost_reports = []
    if found_item:
        lost_cursor = db["items"].find({
            "type": "LOST",
            "category": found_item.get("category"),
            "status": {"$in": ["OPEN", "AVAILABLE"]}
        }).limit(5)
        lost_items = await lost_cursor.to_list(length=5)
        for li in lost_items:
            li["_id"] = str(li["_id"])
            # Calculate similarity score
            f_desc = (found_item.get("description") or "").lower()
            l_desc = (li.get("description") or "").lower()
            f_words = set(w for w in f_desc.split() if len(w) > 3)
            l_words = set(w for w in l_desc.split() if len(w) > 3)
            common = f_words.intersection(l_words)
            similarity = len(common) / max(len(f_words | l_words), 1) * 100
            li["similarity_score"] = round(similarity, 1)
            li["shared_keywords"] = list(common)
            # Populate user
            if li.get("user_id"):
                try:
                    u = await db["users"].find_one({"_id": ObjectId(li["user_id"])})
                    if u:
                        u["_id"] = str(u["_id"])
                        li["reporter"] = u
                except:
                    pass
            matching_lost_reports.append(li)
        matching_lost_reports.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    # Get claimant details
    claimant = None
    if claim.get("claimant_id"):
        try:
            claimant = await db["users"].find_one({"_id": ObjectId(claim["claimant_id"])})
            if claimant:
                claimant["_id"] = str(claimant["_id"])
                # Get claimant's other claims
                other_claims_cursor = db["claims"].find({"claimant_id": str(claim["claimant_id"])})
                other_claims = await other_claims_cursor.to_list(length=20)
                claimant["total_claims"] = len(other_claims)
                claimant["approved_claims"] = len([c for c in other_claims if c.get("status") == "APPROVED"])
                claimant["rejected_claims"] = len([c for c in other_claims if c.get("status") == "REJECTED"])
        except:
            pass
    
    # Get other claims on the same item
    other_claims = []
    if claim.get("item_id"):
        claims_cursor = db["claims"].find({
            "item_id": claim["item_id"],
            "_id": {"$ne": obj_id}
        })
        other_claims_list = await claims_cursor.to_list(length=10)
        for oc in other_claims_list:
            oc["_id"] = str(oc["_id"])
            if oc.get("claimant_id"):
                try:
                    oc_user = await db["users"].find_one({"_id": ObjectId(oc["claimant_id"])})
                    if oc_user:
                        oc_user["_id"] = str(oc_user["_id"])
                        oc["claimant"] = oc_user
                except:
                    pass
            other_claims.append(oc)
    
    # Get message history for this claim
    messages_cursor = db["claim_messages"].find({"claim_id": claim_id}).sort("sent_at", 1)
    messages = await messages_cursor.to_list(length=50)
    for m in messages:
        m["_id"] = str(m["_id"])
    
    return {
        "claim": claim,
        "found_item": found_item,
        "linked_lost_item": linked_lost_item,
        "matching_lost_reports": matching_lost_reports,
        "claimant": claimant,
        "other_claims_on_item": other_claims,
        "messages": messages
    }


# ============ ISSUE 2: CLAIM PRIORITIZATION ============

@router.get("/claims/prioritized")
async def get_prioritized_claims(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all pending claims with priority scoring"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cursor = db["claims"].find({"status": "PENDING"}).sort("submissionDate", 1)
    claims_list = await cursor.to_list(length=200)
    
    high_value_categories = ["DEVICES", "KEYS", "JEWELLERY", "DOCUMENTS"]
    now = datetime.utcnow()
    
    scored_claims = []
    for c in claims_list:
        c["_id"] = str(c["_id"])
        c["id"] = c["_id"]
        
        # Calculate priority score (0-100)
        score = 0
        reasons = []
        
        # Factor 1: Age of claim (older = higher priority)
        submission_date = c.get("submissionDate")
        if submission_date:
            if isinstance(submission_date, str):
                submission_date = datetime.fromisoformat(submission_date)
            days_pending = (now - submission_date).days
            hours_pending = (now - submission_date).total_seconds() / 3600
            c["hours_pending"] = round(hours_pending, 1)
            c["days_pending"] = days_pending
            if days_pending >= 3:
                score += 40
                reasons.append(f"Pending {days_pending} days")
            elif days_pending >= 1:
                score += 25
                reasons.append(f"Pending {days_pending} day(s)")
            elif hours_pending >= 6:
                score += 15
                reasons.append(f"Pending {round(hours_pending)}h")
        
        # Factor 2: Item category value
        item = None
        if c.get("item_id"):
            try:
                item = await db["items"].find_one({"_id": ObjectId(c["item_id"])})
                if item:
                    item["_id"] = str(item["_id"])
                    c["item"] = item
                    if item.get("category") in high_value_categories:
                        score += 20
                        reasons.append(f"High-value: {item['category']}")
            except:
                pass
        
        # Factor 3: Multiple claims on same item (contention)
        if c.get("item_id"):
            claim_count = await db["claims"].count_documents({"item_id": c["item_id"], "status": "PENDING"})
            if claim_count > 1:
                score += 15
                reasons.append(f"{claim_count} competing claims")
            c["competing_claims"] = claim_count
        
        # Factor 4: Has proof image (faster to verify)
        if c.get("proofImageUrl"):
            score += 5
            reasons.append("Has proof image")
        
        # Factor 5: Claimant history (trusted vs new)
        if c.get("claimant_id"):
            try:
                user = await db["users"].find_one({"_id": ObjectId(c["claimant_id"])})
                if user:
                    user["_id"] = str(user["_id"])
                    c["claimant"] = user
                prev_approved = await db["claims"].count_documents({"claimant_id": c["claimant_id"], "status": "APPROVED"})
                prev_rejected = await db["claims"].count_documents({"claimant_id": c["claimant_id"], "status": "REJECTED"})
                if prev_rejected > prev_approved and prev_rejected > 0:
                    score += 10
                    reasons.append("History: more rejections")
                c["claimant_history"] = {"approved": prev_approved, "rejected": prev_rejected}
            except:
                pass
        
        # Determine priority level
        if score >= 50:
            priority = "URGENT"
        elif score >= 30:
            priority = "HIGH"
        elif score >= 15:
            priority = "MEDIUM"
        else:
            priority = "NORMAL"
        
        c["priority_score"] = min(score, 100)
        c["priority_level"] = priority
        c["priority_reasons"] = reasons
        
        scored_claims.append(c)
    
    # Sort by priority score descending
    scored_claims.sort(key=lambda x: x["priority_score"], reverse=True)
    
    return scored_claims


# ============ ISSUE 3: ADMIN-CLAIMANT COMMUNICATION ============

@router.post("/claims/{claim_id}/message")
async def send_claim_message(
    claim_id: str,
    msg: ClaimMessageRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Send a message to a claimant about their claim"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        obj_id = ObjectId(claim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid claim ID")
    
    claim = await db["claims"].find_one({"_id": obj_id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Store message
    message_doc = {
        "claim_id": claim_id,
        "sender_id": str(current_user.id),
        "sender_name": current_user.name,
        "sender_role": "ADMIN",
        "message": msg.message,
        "require_response": msg.require_response,
        "sent_at": datetime.utcnow(),
        "read": False
    }
    
    result = await db["claim_messages"].insert_one(message_doc)
    message_doc["_id"] = str(result.inserted_id)
    
    # Send notification to claimant
    if claim.get("claimant_id"):
        action_text = " Please respond with additional information." if msg.require_response else ""
        notification = {
            "user_id": str(claim["claimant_id"]),
            "title": "Message from Admin regarding your claim",
            "message": f"{msg.message}{action_text}",
            "type": "CLAIM_MESSAGE",
            "related_id": claim_id,
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db["notifications"].insert_one(notification)
    
    # Audit
    await db["audit_logs"].insert_one({
        "admin_id": str(current_user.id),
        "admin_name": current_user.name,
        "action": "CLAIM_MESSAGE_SENT",
        "target_type": "CLAIM",
        "target_id": claim_id,
        "details": {"message_preview": msg.message[:100], "require_response": msg.require_response},
        "timestamp": datetime.utcnow()
    })
    
    return message_doc


@router.get("/claims/{claim_id}/messages")
async def get_claim_messages(
    claim_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all messages for a claim"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cursor = db["claim_messages"].find({"claim_id": claim_id}).sort("sent_at", 1)
    messages = await cursor.to_list(length=100)
    for m in messages:
        m["_id"] = str(m["_id"])
    return messages


@router.put("/claims/{claim_id}/reject-with-reason")
async def reject_claim_with_reason(
    claim_id: str,
    rejection: ClaimRejectRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Reject a claim with a mandatory reason that gets sent to the claimant"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        obj_id = ObjectId(claim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid claim ID")
    
    claim = await db["claims"].find_one({"_id": obj_id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Update claim
    update_data = {
        "status": "REJECTED",
        "rejection_reason": rejection.reason,
        "admin_remarks": rejection.remarks or rejection.reason,
        "rejected_at": datetime.utcnow(),
        "rejected_by": str(current_user.id),
        "rejected_by_name": current_user.name
    }
    
    await db["claims"].update_one({"_id": obj_id}, {"$set": update_data})
    
    # Send rich notification to claimant with reason
    if claim.get("claimant_id"):
        item = None
        if claim.get("item_id"):
            try:
                item = await db["items"].find_one({"_id": ObjectId(claim["item_id"])})
            except:
                pass
        
        notification = {
            "user_id": str(claim["claimant_id"]),
            "title": "Claim Update: Not Approved",
            "message": f"Your claim for {item.get('category', 'an item') if item else 'an item'} was not approved. Reason: {rejection.reason}",
            "type": "CLAIM_REJECTED",
            "related_id": claim_id,
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db["notifications"].insert_one(notification)
    
    # Audit log
    await db["audit_logs"].insert_one({
        "admin_id": str(current_user.id),
        "admin_name": current_user.name,
        "action": "CLAIM_REJECTED_WITH_REASON",
        "target_type": "CLAIM",
        "target_id": claim_id,
        "details": {"reason": rejection.reason, "remarks": rejection.remarks},
        "timestamp": datetime.utcnow()
    })
    
    updated = await db["claims"].find_one({"_id": obj_id})
    if updated:
        updated["_id"] = str(updated["_id"])
    return updated


# ============ ISSUE 4: STORAGE MANAGEMENT ============

@router.get("/storage/inventory")
async def get_storage_inventory(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get complete storage inventory - what's in each storage location"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Find all items that have storage locations
    cursor = db["items"].find({
        "storage_location": {"$exists": True, "$ne": None, "$ne": ""},
        "status": {"$in": ["AVAILABLE", "PENDING", "CLAIMED"]}
    }).sort("storage_location", 1)
    
    items = await cursor.to_list(length=500)
    
    # Group by storage location
    locations = {}
    for item in items:
        item["_id"] = str(item["_id"])
        loc = item.get("storage_location", "Unassigned")
        if loc not in locations:
            locations[loc] = {
                "location": loc,
                "items": [],
                "total_items": 0,
                "categories": {},
                "oldest_item_date": None,
                "newest_item_date": None
            }
        locations[loc]["items"].append(item)
        locations[loc]["total_items"] += 1
        cat = item.get("category", "OTHER")
        locations[loc]["categories"][cat] = locations[loc]["categories"].get(cat, 0) + 1
        
        item_date = item.get("dateTime") or item.get("verified_at")
        if item_date:
            if locations[loc]["oldest_item_date"] is None or item_date < locations[loc]["oldest_item_date"]:
                locations[loc]["oldest_item_date"] = item_date
            if locations[loc]["newest_item_date"] is None or item_date > locations[loc]["newest_item_date"]:
                locations[loc]["newest_item_date"] = item_date
    
    # Build summary
    total_stored = sum(loc["total_items"] for loc in locations.values())
    unassigned = await db["items"].count_documents({
        "type": "FOUND",
        "status": {"$in": ["AVAILABLE", "PENDING"]},
        "$or": [
            {"storage_location": {"$exists": False}},
            {"storage_location": None},
            {"storage_location": ""}
        ]
    })
    
    return {
        "summary": {
            "total_locations": len(locations),
            "total_stored_items": total_stored,
            "unassigned_items": unassigned
        },
        "locations": list(locations.values())
    }


@router.get("/storage/locations")
async def get_storage_locations_list(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get list of all unique storage locations with item counts"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    pipeline = [
        {"$match": {
            "storage_location": {"$exists": True, "$ne": None, "$ne": ""},
            "status": {"$in": ["AVAILABLE", "PENDING", "CLAIMED"]}
        }},
        {"$group": {
            "_id": "$storage_location",
            "count": {"$sum": 1},
            "categories": {"$addToSet": "$category"}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    results = []
    async for doc in db["items"].aggregate(pipeline):
        results.append({
            "location": doc["_id"],
            "item_count": doc["count"],
            "categories": doc["categories"]
        })
    
    return results


@router.get("/storage/report")
async def get_storage_report(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Generate a comprehensive storage report"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    now = datetime.utcnow()
    
    # Items stored more than 30 days
    old_items_cursor = db["items"].find({
        "storage_location": {"$exists": True, "$ne": None, "$ne": ""},
        "status": {"$in": ["AVAILABLE", "PENDING"]},
        "dateTime": {"$lte": now - timedelta(days=30)}
    })
    old_items = await old_items_cursor.to_list(length=100)
    for item in old_items:
        item["_id"] = str(item["_id"])
        item_date = item.get("dateTime")
        if item_date:
            item["days_stored"] = (now - item_date).days
    
    # Items stored more than 7 days but less than 30
    medium_items = await db["items"].count_documents({
        "storage_location": {"$exists": True, "$ne": None, "$ne": ""},
        "status": {"$in": ["AVAILABLE", "PENDING"]},
        "dateTime": {
            "$gte": now - timedelta(days=30),
            "$lte": now - timedelta(days=7)
        }
    })
    
    # Recently stored (last 7 days)
    recent_items = await db["items"].count_documents({
        "storage_location": {"$exists": True, "$ne": None, "$ne": ""},
        "status": {"$in": ["AVAILABLE", "PENDING"]},
        "dateTime": {"$gte": now - timedelta(days=7)}
    })
    
    # High-value items in storage
    high_value = await db["items"].count_documents({
        "storage_location": {"$exists": True, "$ne": None, "$ne": ""},
        "status": {"$in": ["AVAILABLE", "PENDING"]},
        "category": {"$in": ["DEVICES", "KEYS", "JEWELLERY"]}
    })
    
    return {
        "aging_report": {
            "over_30_days": len(old_items),
            "7_to_30_days": medium_items,
            "under_7_days": recent_items,
            "old_items_detail": old_items
        },
        "high_value_in_storage": high_value,
        "generated_at": now.isoformat()
    }


# ============ ISSUE 5: ADVANCED ANALYTICS ============

@router.get("/analytics/trends")
async def get_analytics_trends(
    days: int = Query(30, description="Number of days to analyze"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get trend data for items and claims over time"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)
    
    # Daily lost/found item trends
    daily_trends = []
    for i in range(days):
        day_start = (start_date + timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        lost_count = await db["items"].count_documents({
            "type": "LOST",
            "dateTime": {"$gte": day_start, "$lt": day_end}
        })
        found_count = await db["items"].count_documents({
            "type": "FOUND",
            "dateTime": {"$gte": day_start, "$lt": day_end}
        })
        resolved_count = await db["items"].count_documents({
            "status": {"$in": ["RETURNED", "RESOLVED"]},
            "handed_over_at": {"$gte": day_start, "$lt": day_end}
        })
        claims_count = await db["claims"].count_documents({
            "submissionDate": {"$gte": day_start, "$lt": day_end}
        })
        
        daily_trends.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "lost": lost_count,
            "found": found_count,
            "resolved": resolved_count,
            "claims": claims_count
        })
    
    return daily_trends


@router.get("/analytics/bottlenecks")
async def get_bottleneck_analysis(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Identify bottlenecks in the system"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    now = datetime.utcnow()
    
    # 1. Average time from found to returned (resolution time)
    returned_items_cursor = db["items"].find({
        "type": "FOUND",
        "status": {"$in": ["RETURNED", "RESOLVED"]},
        "dateTime": {"$exists": True},
        "handed_over_at": {"$exists": True}
    })
    returned_items = await returned_items_cursor.to_list(length=200)
    
    resolution_times = []
    for item in returned_items:
        if item.get("dateTime") and item.get("handed_over_at"):
            delta = (item["handed_over_at"] - item["dateTime"]).total_seconds() / 3600
            resolution_times.append(delta)
    
    avg_resolution_hours = round(sum(resolution_times) / len(resolution_times), 1) if resolution_times else 0
    
    # 2. Average claim processing time
    processed_claims_cursor = db["claims"].find({
        "status": {"$in": ["APPROVED", "REJECTED"]},
        "submissionDate": {"$exists": True}
    })
    processed_claims = await processed_claims_cursor.to_list(length=200)
    
    claim_processing_times = []
    for claim in processed_claims:
        submit_date = claim.get("submissionDate")
        # Use rejected_at or a heuristic
        end_date = claim.get("rejected_at") or claim.get("verified_at")
        if not end_date:
            # Estimate from audit logs
            audit = await db["audit_logs"].find_one({
                "target_id": str(claim["_id"]),
                "action": {"$regex": "CLAIM_"}
            }, sort=[("timestamp", -1)])
            if audit:
                end_date = audit.get("timestamp")
        if submit_date and end_date:
            delta = (end_date - submit_date).total_seconds() / 3600
            claim_processing_times.append(delta)
    
    avg_claim_hours = round(sum(claim_processing_times) / len(claim_processing_times), 1) if claim_processing_times else 0
    
    # 3. Slowest categories (most items still pending)
    categories = ["DOCUMENTS", "DEVICES", "ACCESSORIES", "PERSONAL_ITEMS", "KEYS", "BOOKS", "JEWELLERY", "OTHERS"]
    category_bottlenecks = []
    for cat in categories:
        pending = await db["items"].count_documents({"category": cat, "status": {"$in": ["PENDING", "AVAILABLE"]}})
        total = await db["items"].count_documents({"category": cat})
        resolved = await db["items"].count_documents({"category": cat, "status": {"$in": ["RETURNED", "RESOLVED"]}})
        rate = round((resolved / total * 100), 1) if total > 0 else 0
        category_bottlenecks.append({
            "category": cat,
            "pending_items": pending,
            "total_items": total,
            "resolved_items": resolved,
            "resolution_rate": rate
        })
    
    category_bottlenecks.sort(key=lambda x: x["resolution_rate"])
    
    # 4. Stale items (available but no claims for >7 days)
    stale_items_count = await db["items"].count_documents({
        "status": "AVAILABLE",
        "dateTime": {"$lte": now - timedelta(days=7)}
    })
    
    # 5. Pending claims older than 24 hours
    old_pending_claims = await db["claims"].count_documents({
        "status": "PENDING",
        "submissionDate": {"$lte": now - timedelta(hours=24)}
    })
    
    # 6. Unverified items
    unverified_items = await db["items"].count_documents({
        "status": "PENDING"
    })
    
    return {
        "resolution_time": {
            "avg_hours": avg_resolution_hours,
            "sample_size": len(resolution_times)
        },
        "claim_processing_time": {
            "avg_hours": avg_claim_hours,
            "sample_size": len(claim_processing_times)
        },
        "category_performance": category_bottlenecks,
        "stale_available_items": stale_items_count,
        "overdue_pending_claims": old_pending_claims,
        "unverified_items": unverified_items,
        "bottleneck_alerts": [
            alert for alert in [
                {"type": "OVERDUE_CLAIMS", "message": f"{old_pending_claims} claims pending > 24h", "severity": "HIGH"} if old_pending_claims > 0 else None,
                {"type": "STALE_ITEMS", "message": f"{stale_items_count} items available > 7 days with no claims", "severity": "MEDIUM"} if stale_items_count > 0 else None,
                {"type": "UNVERIFIED", "message": f"{unverified_items} items awaiting verification", "severity": "LOW"} if unverified_items > 0 else None,
                {"type": "SLOW_RESOLUTION", "message": f"Avg resolution: {avg_resolution_hours}h", "severity": "HIGH"} if avg_resolution_hours > 72 else None,
            ] if alert is not None
        ]
    }


@router.get("/analytics/category-performance")
async def get_category_performance(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Detailed performance per category"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    categories = ["DOCUMENTS", "DEVICES", "ACCESSORIES", "PERSONAL_ITEMS", "KEYS", "BOOKS", "JEWELLERY", "OTHERS"]
    now = datetime.utcnow()
    
    results = []
    for cat in categories:
        total_lost = await db["items"].count_documents({"type": "LOST", "category": cat})
        total_found = await db["items"].count_documents({"type": "FOUND", "category": cat})
        returned = await db["items"].count_documents({"category": cat, "status": {"$in": ["RETURNED", "RESOLVED"]}})
        pending = await db["items"].count_documents({"category": cat, "status": {"$in": ["PENDING", "AVAILABLE"]}})
        
        # Claims stats for this category
        items_in_cat_cursor = db["items"].find({"category": cat}, {"_id": 1})
        items_in_cat = await items_in_cat_cursor.to_list(length=500)
        item_ids = [str(item["_id"]) for item in items_in_cat]
        
        total_claims = await db["claims"].count_documents({"item_id": {"$in": item_ids}}) if item_ids else 0
        approved_claims = await db["claims"].count_documents({"item_id": {"$in": item_ids}, "status": "APPROVED"}) if item_ids else 0
        
        # Last 7 days activity
        recent_lost = await db["items"].count_documents({
            "type": "LOST", "category": cat,
            "dateTime": {"$gte": now - timedelta(days=7)}
        })
        recent_found = await db["items"].count_documents({
            "type": "FOUND", "category": cat,
            "dateTime": {"$gte": now - timedelta(days=7)}
        })
        
        results.append({
            "category": cat,
            "total_lost": total_lost,
            "total_found": total_found,
            "returned": returned,
            "pending": pending,
            "recovery_rate": round((returned / max(total_found, 1)) * 100, 1),
            "total_claims": total_claims,
            "approval_rate": round((approved_claims / max(total_claims, 1)) * 100, 1),
            "recent_7d": {"lost": recent_lost, "found": recent_found}
        })
    
    results.sort(key=lambda x: x["total_lost"] + x["total_found"], reverse=True)
    return results
