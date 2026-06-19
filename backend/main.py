from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import numpy as np
import base64
import json

app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def analyze_scalp_image(image_bytes: bytes):
    """
    OpenCV based open-source diagnosis logic.
    """
    # 1. Convert bytes to OpenCV image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return {"error": "Invalid image"}
        
    # Resize for consistent processing
    img = cv2.resize(img, (800, 800))
    
    # 2. Density Estimation (Edge detection / Thresholding)
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    cl1 = clahe.apply(gray)
    
    # Adaptive Thresholding to find hair strands
    thresh = cv2.adaptiveThreshold(cl1, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 5)
    
    # Calculate hair pixel ratio
    hair_pixels = cv2.countNonZero(thresh)
    total_pixels = img.shape[0] * img.shape[1]
    density_ratio = (hair_pixels / total_pixels) * 100
    
    # Normalize density to a 0-100 score (heuristic)
    density_score = min(int(density_ratio * 4), 100) 
    
    # 3. Redness / Inflammation (Colorimetry)
    # Convert to HSV to isolate red hues
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Lower red
    lower_red1 = np.array([0, 50, 50])
    upper_red1 = np.array([10, 255, 255])
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    
    # Upper red
    lower_red2 = np.array([170, 50, 50])
    upper_red2 = np.array([180, 255, 255])
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    
    red_mask = mask1 + mask2
    red_pixels = cv2.countNonZero(red_mask)
    redness_ratio = (red_pixels / total_pixels) * 100
    
    # Normalize redness
    redness_score = min(int(redness_ratio * 5), 100)
    
    # 4. Generate diagnosis report based on metrics
    stage = "정상"
    if density_score < 40:
        stage = "노우드 3단계 이상 (중증)"
    elif density_score < 65:
        stage = "노우드 2단계 (초기-중기)"
    
    return {
        "density_score": density_score,
        "redness_score": redness_score,
        "stage": stage,
        "raw_metrics": {
            "hair_pixel_ratio": round(density_ratio, 2),
            "red_pixel_ratio": round(redness_ratio, 2)
        }
    }

@app.post("/api/analyze")
async def analyze_endpoint(image: str = Form(...)):
    try:
        # Assuming the image string is a base64 encoded data URI
        # Format: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        encoded_data = image.split(',')[1] if ',' in image else image
        image_bytes = base64.b64decode(encoded_data)
        
        result = analyze_scalp_image(image_bytes)
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
