from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import numpy as np
import base64
import json
import traceback
import os
from dotenv import load_dotenv

# Load env variables from project root
load_dotenv(dotenv_path="../.env")

# Initialize Gemini image model via google-genai SDK
try:
    from google import genai
    from google.genai import types as genai_types

    project_id = os.getenv("GCP_PROJECT_ID")
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

    if project_id and creds_path and os.path.exists(creds_path):
        genai_client = genai.Client(
            vertexai=True,
            project=project_id,
            location="us-central1"
        )
        print("Gemini image client initialized successfully (project:", project_id, ")")
    else:
        genai_client = None
        print("GCP credentials not found — genai_client not initialized")
except ImportError:
    print("google-genai not installed.")
    genai_client = None
except Exception as e:
    print("Failed to init genai client:", e)
    genai_client = None

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

from pydantic import BaseModel

class SimulateRequest(BaseModel):
    image: str
    drug_name: str
    dose: str = ""
    month: int = 1
    clinical_detail: str = ""

@app.post("/api/simulate_hair")
async def simulate_hair_endpoint(req: SimulateRequest):
    if not genai_client:
        return {"success": False, "error": "AI 서비스가 설정되지 않았습니다. GCP_PROJECT_ID와 GOOGLE_APPLICATION_CREDENTIALS를 확인하세요."}
    
    try:
        from google import genai
        from google.genai import types
        
        project_id = os.environ.get("GCP_PROJECT_ID")
        if not project_id:
            return {"success": False, "error": "GCP_PROJECT_ID가 설정되지 않았습니다."}
            
        # Use Vertex AI mode in GenAI SDK
        client = genai.Client(vertexai=True, project=project_id, location="us-central1")

        encoded_data = req.image.split(',')[1] if ',' in req.image else req.image
        image_bytes = base64.b64decode(encoded_data)

        # OpenCV를 사용하여 상단 70% 영역을 마스크로 자동 생성 (모발 영역)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        cv_img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        h, w = cv_img.shape[:2]
        ratio = w / h
        aspect_ratio_str = "1:1"
        if ratio <= 0.6:
            aspect_ratio_str = "9:16"
        elif ratio <= 0.85:
            aspect_ratio_str = "3:4"
        elif ratio >= 1.6:
            aspect_ratio_str = "16:9"
        elif ratio >= 1.2:
            aspect_ratio_str = "4:3"

        prompt = (
            f"You are a medical simulation AI. Your task is to edit the provided image to simulate {req.month} months of hair loss treatment. "
            f"CRITICAL INSTRUCTIONS: "
            f"1. Increase the hair density and thickness ONLY on the top of the head and hairline. "
            f"2. DO NOT change the zoom, crop, or framing of the image. The output must have the EXACT SAME scale and composition as the input. "
            f"3. DO NOT hallucinate or complete the rest of the face or body. Keep the face, glasses, and background perfectly identical to the input. "
            f"4. The image must perfectly align with the original input when overlaid."
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio=aspect_ratio_str)
            )
        )

        if response.candidates and len(response.candidates) > 0 and response.candidates[0].content.parts:
            # Find the image part
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    edited_image_bytes = part.inline_data.data
                    
                    # Post-processing: Soft Alpha Blending to guarantee pixel-perfect face alignment
                    gen_arr = np.frombuffer(edited_image_bytes, np.uint8)
                    gen_img = cv2.imdecode(gen_arr, cv2.IMREAD_COLOR)

                    # --- ORB Alignment (Align AI face to Original face) ---
                    # Convert both to grayscale
                    orig_gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
                    gen_gray = cv2.cvtColor(gen_img, cv2.COLOR_BGR2GRAY)
                    
                    gh, gw = gen_img.shape[:2]
                    
                    # Create masks to only extract features from the bottom 60% (face area, ignoring hair)
                    orig_mask = np.zeros_like(orig_gray)
                    orig_mask[int(h*0.4):, :] = 255
                    gen_mask = np.zeros_like(gen_gray)
                    gen_mask[int(gh*0.4):, :] = 255

                    detector = cv2.ORB_create(5000)
                    kp1, des1 = detector.detectAndCompute(gen_gray, gen_mask)
                    kp2, des2 = detector.detectAndCompute(orig_gray, orig_mask)

                    aligned_gen = cv2.resize(gen_img, (w, h)) # Fallback
                    
                    if des1 is not None and des2 is not None and len(kp1) >= 4 and len(kp2) >= 4:
                        matcher = cv2.DescriptorMatcher_create(cv2.DESCRIPTOR_MATCHER_BRUTEFORCE_HAMMING)
                        matches = matcher.match(des1, des2)
                        matches = sorted(matches, key=lambda x: x.distance)
                        numGoodMatches = int(len(matches) * 0.15)
                        
                        if numGoodMatches >= 4:
                            matches = matches[:numGoodMatches]
                            pts1 = np.float32([kp1[m.queryIdx].pt for m in matches])
                            pts2 = np.float32([kp2[m.trainIdx].pt for m in matches])
                            
                            # Estimate affine transform (scale, rotation, translation) from Gen to Orig
                            M, inliers = cv2.estimateAffinePartial2D(pts1, pts2, method=cv2.RANSAC)
                            if M is not None:
                                aligned_gen = cv2.warpAffine(gen_img, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
                    # --------------------------------------------------------

                    # Create a gradient mask: 1.0 at the top (hair), 0.0 at the bottom (face)
                    mask = np.zeros((h, w, 1), dtype=np.float32)
                    blend_start = int(h * 0.35)
                    blend_end = int(h * 0.55)
                    mask[0:blend_start, :] = 1.0
                    for y in range(blend_start, blend_end):
                        alpha = 1.0 - ((y - blend_start) / (blend_end - blend_start))
                        mask[y, :] = alpha
                    mask[blend_end:, :] = 0.0

                    # Blend: AI generates top (hair), original provides bottom (face)
                    orig_float = cv_img.astype(np.float32)
                    gen_float = aligned_gen.astype(np.float32)
                    blended = (gen_float * mask + orig_float * (1.0 - mask)).astype(np.uint8)

                    _, blended_buf = cv2.imencode('.png', blended)
                    b64_output = base64.b64encode(blended_buf.tobytes()).decode('utf-8')
                    
                    return {
                        "success": True,
                        "data": {
                            "predicted_image": f"data:image/png;base64,{b64_output}"
                        }
                    }

        return {"success": False, "error": "AI가 이미지를 생성하지 못했습니다. 다시 시도해 주세요."}
            
    except Exception as e:
        error_msg = str(e) + "\n" + traceback.format_exc()
        print("API Error:", error_msg)
        return {"success": False, "error": error_msg}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
