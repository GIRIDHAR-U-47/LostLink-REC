from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.common import PyObjectId

class AuditLog(BaseModel):
    """Track admin actions for accountability"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    admin_id: str  # User ID of admin
    admin_name: str
    action: str  # 'APPROVED', 'REJECTED', 'STORAGE_ASSIGNED', etc.
    target_type: str  # 'ITEM', 'CLAIM', etc.
    target_id: str  # ID of the item/claim
    details: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "admin_name": "Student Care Admin",
                "action": "APPROVED",
                "target_type": "CLAIM",
                "target_id": "123456",
                "details": {"reason": "Identity verified"},
                "timestamp": "2026-02-13T10:30:00"
            }
        }
