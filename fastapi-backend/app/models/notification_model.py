from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.common import PyObjectId

class Notification(BaseModel):
    """System notifications for admins"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    admin_id: str  # User ID of admin
    title: str
    message: str
    notification_type: str  # 'HIGH_VALUE_ITEM', 'PENDING_CLAIM', 'NEW_FOUND_ITEM', etc.
    related_id: Optional[str] = None  # Item ID or Claim ID
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "title": "New High-Value Item",
                "message": "A phone has been found",
                "notification_type": "HIGH_VALUE_ITEM",
                "related_id": "item_123",
                "read": False
            }
        }
