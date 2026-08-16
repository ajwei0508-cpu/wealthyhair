import cv2
import numpy as np
import sys

def process(img_path):
    img = cv2.imread(img_path)
    if img is None:
        print("Cannot read image")
        return
    
    h, w = img.shape[:2]
    
    # 그레이스케일 변환
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 엣지 검출 (모발 텍스처 찾기)
    edges = cv2.Canny(gray, 30, 100)
    
    # 엣지를 팽창시켜 덩어리로 만듦
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    hair_blob = cv2.dilate(edges, kernel, iterations=3)
    hair_blob = cv2.morphologyEx(hair_blob, cv2.MORPH_CLOSE, kernel)
    
    # 상단 60%만 남기기 (하단 얼굴의 엣지 제거)
    roi_mask = np.zeros_like(hair_blob)
    roi_mask[0:int(h*0.60), :] = 255
    hair_blob = cv2.bitwise_and(hair_blob, roi_mask)
    
    # 가장 큰 컨투어 찾기 (이게 머리 영역)
    contours, _ = cv2.findContours(hair_blob, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        print("No contours")
        return
        
    largest_contour = max(contours, key=cv2.contourArea)
    
    # 컨투어 내부를 채워서 완벽한 마스크 생성
    final_mask = np.zeros_like(hair_blob)
    cv2.drawContours(final_mask, [largest_contour], -1, 255, thickness=cv2.FILLED)
    
    # M자 라인 등 모발 경계를 부드럽게 만들기 위해 팽창 & 블러
    # (AI가 경계선 부근을 자연스럽게 채울 수 있도록 마스크를 모발 바깥쪽(이마쪽)으로 살짝 넓힘)
    final_mask = cv2.dilate(final_mask, kernel, iterations=2)
    
    cv2.imwrite("test_mask.png", final_mask)
    print("Done")

if __name__ == "__main__":
    process(sys.argv[1])
