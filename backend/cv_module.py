import cv2
import numpy as np
import os

def extract_features_from_image(image_bytes: bytes):
    """
    OpenCV를 활용하여 이미지에서 얼굴을 검출하고 이마 윤곽과 탈모 수치를 추출합니다.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("이미지를 불러올 수 없습니다.")

    # 기본 수치 초기화
    temple_recession_cm = 0.0
    frontal_recession_cm = 0.0
    vertex_thinning_percent = 0.0
    
    # 1. 화면 가이드라인(눈썹 60%, 모발 30%)에 맞춰 촬영되었다고 가정하고 분석
    # 이미지 높이(h), 너비(w)
    h, w = img.shape[:2]
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 이마 영역 추정: 눈썹(60%)부터 머리 꼭대기(0%) 까지
    # 실제로 모발이 있어야 할 구역은 0% ~ 30% 부분입니다.
    hair_roi = gray[0:int(h * 0.3), 0:w]
    
    # 엣지 검출 및 Otsu 이진화를 결합하여 더 정교한 모발/피부 분리
    # Otsu's thresholding
    _, thresh_hair = cv2.threshold(hair_roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # 엣지와 이진화 마스크를 결합 (더욱 선명한 모발 텍스처 추출)
    edges = cv2.Canny(hair_roi, 50, 150)
    combined_mask = cv2.bitwise_or(edges, thresh_hair)
    
    # 양쪽 측두부(M자 파임 구역) 엣지 밀도 (가로 기준 0~30%, 70~100%)
    left_temple_edges = np.sum(combined_mask[:, 0:int(w*0.3)]) / 255.0
    right_temple_edges = np.sum(combined_mask[:, int(w*0.7):w]) / 255.0
    
    # 전두부(앞머리 중앙 구역) 엣지 밀도 (가로 기준 30%~70%)
    center_edges = np.sum(combined_mask[:, int(w*0.3):int(w*0.7)]) / 255.0
    
    area_temple = int(h * 0.3) * int(w * 0.3)
    area_center = int(h * 0.3) * int(w * 0.4)
    
    if area_temple > 0 and area_center > 0:
        left_density = left_temple_edges / area_temple
        right_density = right_temple_edges / area_temple
        center_density = center_edges / area_center
        
        # M자 비대칭 파임 분석
        # 중앙 대비 좌/우측의 밀도 차이를 cm로 환산
        left_recession_cm = max(0.0, (center_density - left_density) * 50)
        right_recession_cm = max(0.0, (center_density - right_density) * 50)
        
        # 가장 깊게 파인 곳을 대표값으로 사용하되, 비대칭 정보도 저장
        temple_recession_cm = max(left_recession_cm, right_recession_cm)
        
        # 앞머리 중앙부 숱이 적다면 전체 전두부 후퇴
        frontal_recession_cm = max(0.0, (0.15 - center_density) * 30)
    else:
        temple_recession_cm = 0.0
        frontal_recession_cm = 0.0

    # 2. 기존 로직 (생략 안함)
    vertex_roi = gray[int(h * 0.1):int(h * 0.4), int(w * 0.3):int(w * 0.7)]
    edges_v = cv2.Canny(vertex_roi, 50, 150)
    v_density = np.sum(edges_v) / 255.0
    area_v = vertex_roi.shape[0] * vertex_roi.shape[1]
    
    if area_v > 0:
        vertex_ratio = v_density / area_v
        vertex_thinning_percent = max(0.0, (0.15 - vertex_ratio) * 1000)
    else:
        vertex_thinning_percent = 0.0

    return {
        "frontalRecessionCm": float(frontal_recession_cm),
        "templeRecessionCm": float(temple_recession_cm),
        "vertexThinningPercent": float(vertex_thinning_percent)
    }

def analyze_single_region(image_bytes, region_type, points_dict=None):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return 0.0, None
        
    h, w = img.shape[:2]
    pts = points_dict.get('face', []) if points_dict else []
    
    # 1. 프론트엔드에서 정확한 얼굴 좌표가 넘어왔을 경우 (Front, Left, Right)
    if pts and len(pts) > 0 and region_type != 'vertex':
        polygon = np.array([[int(p['x']), int(p['y'])] for p in pts], np.int32)
        bx, by, bw, bh = cv2.boundingRect(polygon)
        
        # 화면 밖을 벗어나지 않도록 보정
        bx, by = max(0, bx), max(0, by)
        bw, bh = min(w - bx, bw), min(h - by, bh)
        
        # 이마 부분(얼굴 전체 높이의 상단 30%)만 관심 영역(ROI)으로 지정
        forehead_h = int(bh * 0.3)
        roi_y1 = by
        roi_y2 = min(by + forehead_h, h)
        roi_x1 = bx
        roi_x2 = min(bx + bw, w)
        
        # 실제 얼굴 모양의 정확한 마스크 생성 (배경/천장 등 제외)
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(mask, [polygon], 255)
        roi_mask = mask[roi_y1:roi_y2, roi_x1:roi_x2]
        
        roi_img = img[roi_y1:roi_y2, roi_x1:roi_x2]
        gray = cv2.cvtColor(roi_img, cv2.COLOR_BGR2GRAY)
        gray = cv2.bitwise_and(gray, gray, mask=roi_mask) # 얼굴 내부만 남김
        
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        edges = cv2.Canny(gray, 50, 150)
        combined = cv2.bitwise_or(edges, thresh)
        
        # 마스크 내부의 실제 픽셀 수(천장 제외) 기반으로 계산
        area = np.count_nonzero(roi_mask)
        val = np.sum(combined) / 255.0
        density_ratio = val / area if area > 0 else 0
        
        if region_type == 'front':
            density = max(0.0, (0.15 - density_ratio) * 30)
            box = [roi_x1, roi_y1, roi_x2 - roi_x1, roi_y2 - roi_y1]
        elif region_type == 'left':
            density = max(0.0, (0.15 - density_ratio) * 50)
            box = [roi_x1, roi_y1, int((roi_x2 - roi_x1) / 2), roi_y2 - roi_y1]
        elif region_type == 'right':
            density = max(0.0, (0.15 - density_ratio) * 50)
            box = [roi_x1 + int((roi_x2 - roi_x1) / 2), roi_y1, int((roi_x2 - roi_x1) / 2), roi_y2 - roi_y1]
            
        return float(density), box, None

    # 2. 좌표가 없거나 정수리(Vertex)인 경우 (기존 방식 또는 Fallback)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    if region_type == 'vertex':
        y1, y2 = int(h * 0.2), int(h * 0.6)
        x1, x2 = int(w * 0.2), int(w * 0.8)
        roi_v = gray[y1:y2, x1:x2]
        edges_v = cv2.Canny(roi_v, 50, 150)
        val = np.sum(edges_v) / 255.0
        area = roi_v.shape[0] * roi_v.shape[1]
        density_ratio = val / area if area > 0 else 0
        density = max(0.0, (0.15 - density_ratio) * 1000)
        box = [x1, y1, x2 - x1, y2 - y1]
        return float(density), box, None
        
    # 좌표 누락시 기존 단순 상단 30% 폴백
    roi = gray[0:int(h * 0.3), 0:w]
    _, thresh = cv2.threshold(roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    edges = cv2.Canny(roi, 50, 150)
    mask = cv2.bitwise_or(edges, thresh)
    x1, x2 = (0, int(w*0.3)) if region_type == 'left' else (int(w*0.7), w) if region_type == 'right' else (int(w*0.3), int(w*0.7))
    area = int(h * 0.3) * (x2 - x1)
    val = np.sum(mask[:, x1:x2]) / 255.0
    density = max(0.0, (0.15 - (val / area if area > 0 else 0)) * 50)
    box = [x1, 0, x2 - x1, int(h * 0.3)]
    return float(density), box, None

def extract_features_multi(front_bytes, left_bytes, right_bytes, vertex_bytes, points_data=None):
    """
    4장의 이미지를 각각 분석하여 탈모 특징값과 바운딩 박스를 반환합니다.
    """
    if points_data is None:
        points_data = {}
        
    front_val, front_box, front_mask = analyze_single_region(front_bytes, 'front', points_data.get('front'))
    left_val, left_box, left_mask = analyze_single_region(left_bytes, 'left', points_data.get('left'))
    right_val, right_box, right_mask = analyze_single_region(right_bytes, 'right', points_data.get('right'))
    vertex_val, vertex_box, vertex_mask = analyze_single_region(vertex_bytes, 'vertex', None)
    
    # 템플(M자)의 대표값은 좌우 중 더 파인 곳으로 설정
    temple_val = max(left_val, right_val)
    
    masks = {
        'front': front_mask,
        'left': left_mask,
        'right': right_mask,
        'vertex': vertex_mask
    }
    
    # === 상세 원인 분석 문구 생성 로직 ===
    explanations = []
    if temple_val > 2.0:
        if left_val > right_val + 1.0:
            explanations.append(f"좌측 측두부(M자) 파임이 {left_val:.1f}cm로 우측보다 심하게 관찰됩니다. 좌우 비대칭적인 M자 탈모 진행이 의심됩니다.")
        elif right_val > left_val + 1.0:
            explanations.append(f"우측 측두부(M자) 파임이 {right_val:.1f}cm로 좌측보다 심하게 관찰됩니다. 우측 중심의 M자 탈모가 진행 중일 수 있습니다.")
        else:
            explanations.append(f"양측 측두부(M자)에 약 {temple_val:.1f}cm의 뚜렷한 후퇴가 관찰되어, 전형적인 M자 탈모 초기 증상이 나타나고 있습니다.")
    else:
        explanations.append("측두부(M자) 영역의 헤어라인은 비교적 잘 유지되고 있습니다.")

    if front_val > 1.5:
        explanations.append(f"전두부(앞머리 중앙) 모발 밀도가 낮아 약 {front_val:.1f}cm의 후퇴 양상이 보입니다. 이마 라인이 전체적으로 넓어지고 있습니다.")
        
    if vertex_val > 30.0:
        explanations.append(f"정수리 영역의 모발 숱이 기준치 대비 {vertex_val:.1f}% 감소한 것으로 측정되었습니다. 가르마 주변으로 모발이 얇아지는 초기-중기 증상이 의심됩니다.")
    elif vertex_val > 15.0:
        explanations.append(f"정수리 부위에 미세한 모발 밀도 감소({vertex_val:.1f}%)가 측정되었습니다. 관리가 필요한 시점입니다.")
    else:
        explanations.append("정수리 부위의 모발 숱과 두께는 정상 범주로 건강한 상태입니다.")

    explanation_text = " ".join(explanations)

    features = {
        "frontalRecessionCm": front_val,
        "templeRecessionCm": temple_val,
        "leftRecessionCm": left_val,
        "rightRecessionCm": right_val,
        "vertexThinningPercent": vertex_val,
        "explanation": explanation_text
    }
    
    boxes = {
        "front": front_box,
        "left": left_box,
        "right": right_box,
        "vertex": vertex_box
    }
    
    return features, boxes, masks
