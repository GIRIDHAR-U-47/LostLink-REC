import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from app.core.config import settings

# Initialize Cloudinary configuration
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )

def upload_image(file: UploadFile, folder: str = "lostlink") -> str:
    """
    Uploads an image to Cloudinary and returns the secure URL.
    Returns None if upload fails or if cloudinary is not configured.
    """
    if not settings.CLOUDINARY_CLOUD_NAME:
        print("Cloudinary is not configured. Cannot upload image.")
        return None

    try:
        result = cloudinary.uploader.upload(
            file.file,
            folder=folder,
            resource_type="image"
        )
        return result.get("secure_url")
    except Exception as e:
        print(f"Error uploading image to Cloudinary: {e}")
        return None
