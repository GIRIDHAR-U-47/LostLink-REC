from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.enums import ClaimStatus
from app.models.common import PyObjectId
from app.models.user_model import UserResponse
from app.models.item_model import ItemResponse

class ClaimBase(BaseModel):
    proof_image_url: Optional[str] = Field(None, alias="proofImageUrl", serialization_alias="proofImageUrl")
    verification_details: Optional[str] = Field(None, alias="verificationDetails", serialization_alias="verificationDetails")
    status: ClaimStatus = ClaimStatus.PENDING
    admin_remarks: Optional[str] = Field(None, alias="adminRemarks", serialization_alias="adminRemarks")
    claim_id: Optional[str] = Field(None, alias="Claim_ID", serialization_alias="Claim_ID")

class ClaimCreate(ClaimBase):
    item_id: str

class ClaimInDB(ClaimBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    item_id: str
    claimant_id: str
    submission_date: datetime = Field(default_factory=datetime.utcnow, alias="submissionDate", serialization_alias="submissionDate")

class ClaimResponse(ClaimBase):
    id: Optional[PyObjectId] = Field(validation_alias="_id", default=None)
    item: Optional[ItemResponse] = None
    claimant: Optional[UserResponse] = None
    submission_date: datetime = Field(alias="submissionDate", serialization_alias="submissionDate")

    class Config:
        populate_by_name = True
