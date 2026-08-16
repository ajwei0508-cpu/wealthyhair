import cv2
import numpy as np

def test_orb_alignment():
    # Create dummy images with some features
    img1 = np.zeros((500, 500, 3), dtype=np.uint8)
    cv2.rectangle(img1, (100, 100), (300, 300), (255, 255, 255), -1)
    cv2.circle(img1, (200, 200), 50, (0, 0, 255), -1)
    
    # img2 is scaled down and shifted
    img2 = np.zeros((500, 500, 3), dtype=np.uint8)
    M_true = cv2.getRotationMatrix2D((250, 250), 0, 0.8)
    M_true[0, 2] += 50
    M_true[1, 2] -= 30
    img2 = cv2.warpAffine(img1, M_true, (500, 500))

    # Add noise to simulate generative differences
    img2 = cv2.add(img2, np.random.randint(-10, 10, img2.shape, dtype=np.int16).clip(0, 255).astype(np.uint8))

    # ORB
    detector = cv2.ORB_create(5000)
    kp1, des1 = detector.detectAndCompute(img2, None)
    kp2, des2 = detector.detectAndCompute(img1, None)

    matcher = cv2.DescriptorMatcher_create(cv2.DESCRIPTOR_MATCHER_BRUTEFORCE_HAMMING)
    matches = matcher.match(des1, des2)
    matches = sorted(matches, key=lambda x: x.distance)
    matches = matches[:int(len(matches)*0.15)]

    pts1 = np.float32([kp1[m.queryIdx].pt for m in matches])
    pts2 = np.float32([kp2[m.trainIdx].pt for m in matches])

    M, mask = cv2.estimateAffinePartial2D(pts1, pts2, method=cv2.RANSAC, ransacReprojThreshold=5.0)
    print("Estimated M:\n", M)
    print("True M (inverse):\n", cv2.invertAffineTransform(M_true))

if __name__ == "__main__":
    test_orb_alignment()
