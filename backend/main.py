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

        # --- 1. 탈모 경계선(Thinning Boundary) 탐지 및 마스크 생성 ---
        np_arr = np.frombuffer(image_bytes, np.uint8)
        cv_img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        h, w = cv_img.shape[:2]
        ratio = w / h
        aspect_ratio_str = "1:1"
        if ratio <= 0.6: aspect_ratio_str = "9:16"
        elif ratio <= 0.85: aspect_ratio_str = "3:4"
        elif ratio >= 1.6: aspect_ratio_str = "16:9"
        elif ratio >= 1.2: aspect_ratio_str = "4:3"

        # 이마/탈모 부위 추정 (HSV 피부색 대신 엣지 기반 텍스처 검출로 빛 반사(Glare) 무시)
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        
        # 1. 엣지 검출 (모발 텍스처 찾기)
        edges = cv2.Canny(gray, 30, 100)
        
        # 2. 엣지를 팽창시켜 하나의 큰 모발 영역 덩어리(Blob)로 만듦
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        hair_blob = cv2.dilate(edges, kernel, iterations=3)
        hair_blob = cv2.morphologyEx(hair_blob, cv2.MORPH_CLOSE, kernel)
        
        # 3. 상단 이마 및 머리 영역(0% ~ 60%)으로 제한
        roi_mask = np.zeros_like(hair_blob)
        roi_mask[0:int(h*0.60), :] = 255
        hair_blob = cv2.bitwise_and(hair_blob, roi_mask)
        
        # 4. 가장 큰 컨투어(주요 모발 영역)만 추출
        contours, _ = cv2.findContours(hair_blob, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        thinning_area = np.zeros_like(hair_blob)
        if len(contours) > 0:
            largest_contour = max(contours, key=cv2.contourArea)
            cv2.drawContours(thinning_area, [largest_contour], -1, 255, thickness=cv2.FILLED)
            
            # AI가 탈모 경계선 바깥(맨 이마 쪽)으로도 머리를 자연스럽게 심을 수 있도록 마스크를 넉넉하게 확장
            thinning_area = cv2.dilate(thinning_area, kernel, iterations=2)
        
        # 부드러운 블렌딩을 위해 가우시안 블러 적용
        thinning_mask_smooth = cv2.GaussianBlur(thinning_area, (51, 51), 0)
        
        # Gemini 2.5 Flash Image 에 전송할 흑백 마스크 (인코딩)
        _, mask_buf = cv2.imencode('.png', thinning_mask_smooth)
        mask_bytes = mask_buf.tobytes()

        # --- 2. 의학적 예상 회복 수치 계산 ---
        # 픽셀 수를 대략적인 면적(cm^2)으로 환산 (가정: 이미지 폭을 15cm로 산정)
        pixel_area = np.sum(thinning_area > 0)
        cm2_per_pixel = (15.0 / w) ** 2
        thinning_area_cm2 = pixel_area * cm2_per_pixel
        
        # 피나스테리드 기준: 평균 10~15 가닥 / cm^2 증가 (3개월 기준)
        # req.month 에 비례하여 계산
        base_increase_per_cm2 = 12.0 * (req.month / 3.0)
        estimated_hairs = int(thinning_area_cm2 * base_increase_per_cm2)
        if estimated_hairs < 0: estimated_hairs = 0

        # --- 3. 프롬프트 강화 (마스크 기반 강제 인페인팅) ---
        prompt = (
            f"You are a medical simulation AI. Your task is to edit the provided image to simulate {req.month} months of hair loss treatment. "
            f"CRITICAL INSTRUCTIONS: "
            f"1. A black and white mask is provided. YOU MUST ONLY MODIFY THE PIXELS WHERE THE MASK IS WHITE. "
            f"2. Fill the white mask areas with natural-looking hair that matches the patient's exact current hair color and texture. "
            f"3. Increase the hair density significantly to show 3 months of recovery. Do NOT create hair on the bare forehead. "
            f"4. The output must have the EXACT SAME scale, face, background, and zoom as the input."
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                types.Part.from_bytes(data=mask_bytes, mime_type="image/png"),
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

                    # Use the precise mask we sent to Gemini for blending!
                    blend_mask = (thinning_mask_smooth / 255.0).astype(np.float32)
                    blend_mask = np.expand_dims(blend_mask, axis=-1)

                    # Blend: AI generates new hair in the mask area, original remains elsewhere
                    orig_float = cv_img.astype(np.float32)
                    gen_float = aligned_gen.astype(np.float32)
                    blended = (gen_float * blend_mask + orig_float * (1.0 - blend_mask)).astype(np.uint8)

                    # --- 4. 시각적 가이드라인 및 데이터 오버레이 렌더링 ---
                    boundary_img = blended.copy()
                    # 탈모 경계선 컨투어 추출
                    contours, _ = cv2.findContours(thinning_area, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    
                    if len(contours) > 0:
                        # 가장 큰 영역의 경계선 그리기 (노란색 점선 효과)
                        largest_contour = max(contours, key=cv2.contourArea)
                        
                        # 점선 효과를 위해 폴리곤 근사화 후 선분으로 나누기
                        epsilon = 0.005 * cv2.arcLength(largest_contour, True)
                        approx = cv2.approxPolyDP(largest_contour, epsilon, True)
                        
                        for i in range(len(approx)):
                            pt1 = tuple(approx[i][0])
                            pt2 = tuple(approx[(i+1)%len(approx)][0])
                            # draw faint yellow line
                            cv2.line(boundary_img, pt1, pt2, (0, 215, 255), 2, cv2.LINE_AA)

                        # 오버레이 텍스트 위치 선정 (경계선의 가장 낮은 부분 근처)
                        bottom_point = tuple(largest_contour[largest_contour[:, :, 1].argmax()][0])
                        text_x = max(10, bottom_point[0] - 100)
                        text_y = min(h - 20, bottom_point[1] + 30)

                        # 텍스트 박스 그리기
                        overlay = boundary_img.copy()
                        text = f"+{estimated_hairs} Hairs Estimated"
                        font = cv2.FONT_HERSHEY_SIMPLEX
                        font_scale = 0.7
                        thickness = 2
                        (text_w, text_h), _ = cv2.getTextSize(text, font, font_scale, thickness)
                        
                        cv2.rectangle(overlay, (text_x - 5, text_y - text_h - 10), (text_x + text_w + 5, text_y + 10), (0, 0, 0), -1)
                        cv2.addWeighted(overlay, 0.6, boundary_img, 0.4, 0, boundary_img)
                        cv2.putText(boundary_img, text, (text_x, text_y), font, font_scale, (0, 215, 255), thickness, cv2.LINE_AA)

                    _, clean_buf = cv2.imencode('.png', blended)
                    clean_b64 = base64.b64encode(clean_buf.tobytes()).decode('utf-8')
                    
                    _, bound_buf = cv2.imencode('.png', boundary_img)
                    bound_b64 = base64.b64encode(bound_buf.tobytes()).decode('utf-8')
                    
                    return {
                        "success": True,
                        "data": {
                            "predicted_image": f"data:image/png;base64,{clean_b64}",
                            "boundary_image": f"data:image/png;base64,{bound_b64}"
                        }
                    }

        return {"success": False, "error": "AI가 이미지를 생성하지 못했습니다. 다시 시도해 주세요."}
            
    except Exception as e:
        error_msg = str(e) + "\n" + traceback.format_exc()
        print("API Error:", error_msg)
        return {"success": False, "error": error_msg}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
