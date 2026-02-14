from enum import Enum

class Role(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class ItemType(str, Enum):
    LOST = "LOST"
    FOUND = "FOUND"

class ItemStatus(str, Enum):
    OPEN = "OPEN"
    PENDING = "PENDING"
    AVAILABLE = "AVAILABLE"
    CLAIMED = "CLAIMED"
    RESOLVED = "RESOLVED"
    RETURNED = "RETURNED"
    LOST = "LOST"

class ClaimStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
