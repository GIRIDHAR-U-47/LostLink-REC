from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.enums import ItemType, ItemStatus
from app.models.common import PyObjectId
from app.models.user_model import UserResponse

class ItemBase(BaseModel):
    type: ItemType
    category: str
    description: Optional[str] = None
    location: str
    date_time: datetime = Field(alias="dateTime", validation_alias="dateTime", serialization_alias="dateTime")
    image_url: Optional[str] = Field(None, alias="imageUrl", validation_alias="imageUrl", serialization_alias="imageUrl")
    status: ItemStatus = ItemStatus.OPEN
    # Admin fields
    storage_location: Optional[str] = None  # e.g., "Rack A, Shelf 3"
    admin_remarks: Optional[str] = None
    verified_by: Optional[str] = None  # Admin user ID who verified
    verified_by_name: Optional[str] = None # Admin Name who verified
    verified_at: Optional[datetime] = None
    # Handover fields
    handed_over_by: Optional[str] = None
    handed_over_by_name: Optional[str] = None
    handed_over_to_student_id: Optional[str] = None
    handed_over_at: Optional[datetime] = None

class ItemCreate(ItemBase):
    pass

class ItemInDB(ItemBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str # Reference to User ID

class ItemResponse(ItemBase):
    id: Optional[PyObjectId] = Field(validation_alias="_id", default=None)
    user: Optional[UserResponse] = None # Populated user details

    class Config:
        populate_by_name = True
