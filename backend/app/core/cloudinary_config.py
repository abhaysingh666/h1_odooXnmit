import cloudinary
import cloudinary.uploader
from .config import settings

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)


def upload_image_to_cloudinary(file_content: bytes, folder: str = "dayflow_hrms/company_logos") -> dict:
    """
    Upload image to Cloudinary and return the URL.
    
    Args:
        file_content: Binary content of the image file
        folder: Folder path in Cloudinary
    
    Returns:
        dict with 'url' and 'public_id'
    """
    try:
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type="image",
            transformation=[
                {"width": 500, "height": 500, "crop": "limit"},
                {"quality": "auto"},
                {"fetch_format": "auto"}
            ]
        )
        
        return {
            "url": result.get("secure_url"),
            "public_id": result.get("public_id")
        }
    except Exception as e:
        raise Exception(f"Failed to upload image to Cloudinary: {str(e)}")


def delete_image_from_cloudinary(public_id: str) -> bool:
    """
    Delete image from Cloudinary.
    
    Args:
        public_id: Public ID of the image in Cloudinary
    
    Returns:
        bool: True if deleted successfully
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        print(f"Failed to delete image: {str(e)}")
        return False
