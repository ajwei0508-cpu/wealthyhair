from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import numpy as np
import base64
import json
import traceback

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
        raise ValueError("Could not decode image")

    # 2. Convert to HSV for redness detection
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # 3. Simple thresholding to find hair (dark regions)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply CLAHE to improve contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    cl1 = clahe.apply(gray)
    
    # Adaptive thresholding
    thresh = cv2.adaptiveThreshold(cl1, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 5)
    
    # Calculate hair density (ratio of dark pixels)
    hair_pixels = cv2.countNonZero(thresh)
    total_pixels = img.shape[0] * img.shape[1]
    density_ratio = (hair_pixels / total_pixels) * 100
    
    # Normalize score (0-100)
    density_score = min(int(density_ratio * 2), 100)

    # Redness detection (inflammation)
    # Define range for red color in HSV
    lower_red1 = np.array([0, 50, 50])
    upper_red1 = np.array([10, 255, 255])
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    
    # Upper red
    lower_red2 = np.array([170, 50, 50])
    upper_red2 = np.array([180, 255, 255])
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    
    red_mask = mask1 + mask2
    red_pixels = cv2.countNonZero(red_mask)
    
    scalp_pixels = total_pixels - hair_pixels
    if scalp_pixels == 0:
        scalp_pixels = 1
        
    redness_ratio = (red_pixels / scalp_pixels) * 100
    
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
            "hair_pixel_ratio": round(float(density_ratio), 2),
            "red_pixel_ratio": round(float(redness_ratio), 2)
        }
    }

from cv_module import extract_features_from_image

@app.post("/api/analyze")
async def analyze_endpoint(image: str = Form(...)):
    try:
        # 가상 사진(url)인 경우 다운로드
        if image.startswith('http'):
            import urllib.request
            req = urllib.request.Request(image, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                image_bytes = response.read()
        else:
            # Base64 이미지
            encoded_data = image.split(',')[1] if ',' in image else image
            image_bytes = base64.b64decode(encoded_data)
        
        legacy_result = analyze_scalp_image(image_bytes)
        extracted_features = extract_features_from_image(image_bytes)
        
        return {
            "success": True,
            "data": {
                "legacy": legacy_result,
                "features": extracted_features
            }
        }

    except Exception as e:
        error_msg = str(e) + "\n" + traceback.format_exc()
        print("API Error:", error_msg)
        return {"success": False, "error": error_msg}

from cv_module import extract_features_multi

def _decode_base64_image(image_str):
    if image_str.startswith('http'):
        import urllib.request
        req = urllib.request.Request(image_str, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            return response.read()
    encoded_data = image_str.split(',')[1] if ',' in image_str else image_str
    return base64.b64decode(encoded_data)

@app.post("/api/analyze_multi")
async def analyze_multi_endpoint(
    image_front: str = Form(...),
    image_left: str = Form(...),
    image_right: str = Form(...),
    image_vertex: str = Form(...),
    points_front: str = Form("{}"),
    points_left: str = Form("{}"),
    points_right: str = Form("{}")
):
    try:
        import json
        front_bytes = _decode_base64_image(image_front)
        left_bytes = _decode_base64_image(image_left)
        right_bytes = _decode_base64_image(image_right)
        vertex_bytes = _decode_base64_image(image_vertex)
        
        pts_front = json.loads(points_front)
        pts_left = json.loads(points_left)
        pts_right = json.loads(points_right)
        
        points_data = {
            'front': pts_front,
            'left': pts_left,
            'right': pts_right
        }
        
        features, boxes, masks = extract_features_multi(front_bytes, left_bytes, right_bytes, vertex_bytes, points_data)
        
        return {
            "success": True,
            "data": {
                "features": features,
                "boxes": boxes,
                "masks": masks
            }
        }
    except Exception as e:
        error_msg = str(e) + "\n" + traceback.format_exc()
        print("API Error:", error_msg)
        return {"success": False, "error": error_msg}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
