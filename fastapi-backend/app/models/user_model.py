from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from app.models.enums import Role
from app.models.common import PyObjectId

class UserBase(BaseModel):
    email: EmailStr
    name: str
    register_number: Optional[str] = Field(None, alias="registerNumber")
    role: Role = Role.USER

    class Config:
        populate_by_name = True

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    hashed_password: str

class UserResponse(UserBase):
    id: Optional[PyObjectId] = Field(validation_alias="_id", default=None)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "email": "student@rajalakshmi.edu.in",
                "name": "Student Name",
                "registerNumber": "211001001",
                "role": "USER"
            }
        }
