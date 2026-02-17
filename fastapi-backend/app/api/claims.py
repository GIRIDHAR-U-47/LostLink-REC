from fastapi import APIRouter, Depends, HTTPException, Query, Body, Form, UploadFile, File
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.core.database import get_database
from app.models.claim_model import ClaimCreate, ClaimResponse
from app.models.enums import ClaimStatus, ItemStatus, Role
from app.models.user_model import UserResponse
from app.api.deps import get_current_user
from fastapi.encoders import jsonable_encoder

router = APIRouter()

@router.post("/submit", response_model=ClaimResponse)
async def submit_claim(
    item_id: str = Form(...),
    verification_details: str = Form(None),
    proof_image: UploadFile = File(None),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    import shutil
    import os
    
    # Verify item exists
    item = await db["items"].find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    image_url = None
    if proof_image:
        # Create static directory if it doesn't exist
        image_dir = os.path.join(os.getcwd(), "static", "images", "claims")
        os.makedirs(image_dir, exist_ok=True)
        
        file_location = os.path.join(image_dir, proof_image.filename)
        with open(file_location, "wb+") as file_object:
             shutil.copyfileobj(proof_image.file, file_object)
        
        # Store relative path for database
        image_url = f"static/images/claims/{proof_image.filename}"

    claim_dict = {
        "item_id": item_id,
        "verificationDetails": verification_details,
        "proofImageUrl": image_url,
        "claimant_id": str(current_user.id),
        "status": "PENDING",
        "submissionDate": datetime.utcnow()
    }
    
    result = await db["claims"].insert_one(claim_dict)
    created_claim = await db["claims"].find_one({"_id": result.inserted_id})
    
    # Populate for response
    created_claim["item"] = item
    created_claim["claimant"] = current_user.model_dump(by_alias=True)
    
    return created_claim

def convert_object_ids(obj):
    if isinstance(obj, list):
        return [convert_object_ids(item) for item in obj]
    if isinstance(obj, dict):
        return {k: (str(v) if isinstance(v, ObjectId) else convert_object_ids(v)) for k, v in obj.items()}
    return obj

@router.get("/status")
async def get_claims_by_status(
    status: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_database)
):
    try:
        print(f"DEBUG: Processing claims request for status={status}")
        
        # Admin check
        if str(current_user.role) != "ADMIN" and current_user.role != Role.ADMIN:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        filter_dict = {}
        if status:
            filter_dict["status"] = status
            
        cursor = db["claims"].find(filter_dict).sort("submissionDate", -1)
        claims_list = await cursor.to_list(length=100)
        
        results = []
        for c in claims_list:
            # Basic formatting
            c["id"] = str(c["_id"])
            
            # Safe population of item
            if c.get("item_id"):
                try:
                    item = await db["items"].find_one({"_id": ObjectId(str(c["item_id"]))})
                    if item:
                        c["item"] = item
                except: pass
                
            # Safe population of claimant
            if c.get("claimant_id"):
                try:
                    user = await db["users"].find_one({"_id": ObjectId(str(c["claimant_id"]))})
                    if user:
                        c["claimant"] = user
                except: pass
                
            results.append(c)
            
        # RECUSIVELY convert all ObjectIds before encoding
        safe_results = convert_object_ids(results)
        return jsonable_encoder(safe_results)
    except Exception as e:
        print(f"CRITICAL API ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@router.get("/raw-debug")
async def get_raw_claims(db = Depends(get_database)):
    cursor = db["claims"].find()
    claims = await cursor.to_list(length=100)
    # Convert ObjectIds to strings for JSON serialization
    for c in claims:
        c["_id"] = str(c["_id"])
    return jsonable_encoder(claims)

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
    
    # Convert ObjectId to string for JSON serialization
    if updated_claim:
        updated_claim = convert_object_ids(updated_claim)
    
    return updated_claim
