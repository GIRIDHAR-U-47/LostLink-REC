import random
import string
from datetime import datetime

def generate_custom_id(prefix: str) -> str:
    """
    Generates a readable custom ID.
    Format: PREFIX-YYYYMMDD-XXXX
    Example: LOST-20240221-A7B2
    """
    date_str = datetime.now().strftime("%Y%m%d")
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}-{date_str}-{random_str}"
