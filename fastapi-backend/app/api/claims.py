from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.core.database import get_database
from app.models.claim_model import ClaimCreate, ClaimResponse
from app.models.enums import ClaimStatus, ItemStatus, Role
from app.models.user_model import UserResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/submit", response_model=ClaimResponse)
async def submit_claim(
    claim_in: ClaimCreate,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    # Verify item exists
    item = await db["items"].find_one({"_id": ObjectId(claim_in.item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    claim_dict = claim_in.model_dump(by_alias=True)
    claim_dict["claimant_id"] = str(current_user.id)
    claim_dict["submissionDate"] = datetime.utcnow()
    claim_dict["status"] = ClaimStatus.PENDING
    
    result = await db["claims"].insert_one(claim_dict)
    created_claim = await db["claims"].find_one({"_id": result.inserted_id})
    
    # Populate
    created_claim["item"] = item
    created_claim["claimant"] = current_user.model_dump(by_alias=True)
    
    return created_claim

@router.get("/item/{item_id}", response_model=List[ClaimResponse])
async def get_claims_for_item(
    item_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    cursor = db["claims"].find({"item_id": item_id})
    claims = await cursor.to_list(length=100)
    
    # Populate
    results = []
    for claim in claims:
        # Populate claimant
        user = await db["users"].find_one({"_id": ObjectId(claim["claimant_id"])})
        if user:
            claim["claimant"] = user
        results.append(claim)
    return results

@router.get("/my-claims", response_model=List[ClaimResponse])
async def get_my_claims(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    cursor = db["claims"].find({"claimant_id": str(current_user.id)})
    claims = await cursor.to_list(length=100)
    
    results = []
    for claim in claims:
        # Populate item
        item = await db["items"].find_one({"_id": ObjectId(claim["item_id"])})
        if item:
            claim["item"] = item
        results.append(claim)
    return results

@router.get("/status", response_model=List[ClaimResponse])
async def get_claims_by_status(
    status: Optional[ClaimStatus] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    filter_dict = {}
    if status:
        filter_dict["status"] = status
        
    cursor = db["claims"].find(filter_dict).sort("submissionDate", -1)
    claims = await cursor.to_list(length=100)
    
    # Populate
    results = []
    for claim in claims:
        item = await db["items"].find_one({"_id": ObjectId(claim["item_id"])})
        claim["item"] = item
        
        user = await db["users"].find_one({"_id": ObjectId(claim["claimant_id"])})
        claim["claimant"] = user
        
        results.append(claim)
    return results

@router.put("/{id}/verify")
async def verify_claim(
    id: str,
    status: ClaimStatus,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db["claims"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    # If approved, update item
    if status == ClaimStatus.APPROVED:
        claim = await db["claims"].find_one({"_id": ObjectId(id)})
        if claim:
            await db["items"].update_one(
                {"_id": ObjectId(claim["item_id"])},
                {"$set": {"status": ItemStatus.RESOLVED}} # Or RETURNED
            )
            
    updated_claim = await db["claims"].find_one({"_id": ObjectId(id)})
    return updated_claim
