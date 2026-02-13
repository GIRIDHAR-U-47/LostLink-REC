from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from app.core.database import get_database
from app.models.enums import Role, ItemStatus, ItemType
from app.models.user_model import UserResponse
from app.models.audit_model import AuditLog
from app.models.notification_model import Notification
from app.api.deps import get_current_user

router = APIRouter()

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
    returned_today = await items_col.count_documents({
        "status": "RETURNED",
        "verified_at": {"$gte": datetime.utcnow() - timedelta(days=1)}
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
    returned = await items_col.count_documents({"type": "FOUND", "status": "RETURNED"})
    
    rate = (returned / total_found * 100) if total_found > 0 else 0
    
    return {
        "total_found": total_found,
        "returned": returned,
        "recovery_rate_percent": round(rate, 2)
    }

# ============ SEARCH & FILTERS ============

@router.get("/items/search")
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

# ============ STORAGE MANAGEMENT ============

@router.put("/items/{item_id}/assign-storage")
async def assign_storage_location(
    item_id: str,
    storage_location: str,
    admin_remarks: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    """Assign storage location to found item"""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {
        "storage_location": storage_location,
        "verified_by": str(current_user.id),
        "verified_at": datetime.utcnow()
    }
    
    if admin_remarks:
        update_data["admin_remarks"] = admin_remarks
    
    result = await db["items"].update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated_item = await db["items"].find_one({"_id": ObjectId(item_id)})
    
    # Log action
    await db["audit_logs"].insert_one({
        "admin_id": str(current_user.id),
        "admin_name": current_user.name,
        "action": "STORAGE_ASSIGNED",
        "target_type": "ITEM",
        "target_id": item_id,
        "details": {"storage_location": storage_location},
        "timestamp": datetime.utcnow()
    })
    
    return updated_item

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
    return history
