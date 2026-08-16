import cv2
import numpy as np

def align_face_orb(orig_img, gen_img):
    # Convert to grayscale
    orig_gray = cv2.cvtColor(orig_img, cv2.COLOR_BGR2GRAY)
    gen_gray = cv2.cvtColor(gen_img, cv2.COLOR_BGR2GRAY)
    
    # We only care about the face area for alignment (bottom 60%)
    h, w = orig_img.shape[:2]
    orig_mask = np.zeros_like(orig_gray)
    orig_mask[int(h*0.4):, :] = 255
    
    gh, gw = gen_img.shape[:2]
    gen_mask = np.zeros_like(gen_gray)
    gen_mask[int(gh*0.4):, :] = 255

    # Use ORB or AKAZE
    detector = cv2.AKAZE_create()
    kp1, des1 = detector.detectAndCompute(gen_gray, gen_mask)
    kp2, des2 = detector.detectAndCompute(orig_gray, orig_mask)

    if des1 is None or len(kp1) < 4 or des2 is None or len(kp2) < 4:
        return cv2.resize(gen_img, (w, h))

    # Match features
    matcher = cv2.DescriptorMatcher_create(cv2.DESCRIPTOR_MATCHER_BRUTEFORCE_HAMMING)
    matches = matcher.match(des1, des2, None)
    
    # Sort matches by score
    matches = sorted(matches, key=lambda x: x.distance)

    # Keep top 15% matches
    numGoodMatches = int(len(matches) * 0.15)
    if numGoodMatches < 4:
        return cv2.resize(gen_img, (w, h))
        
    matches = matches[:numGoodMatches]

    # Extract location of good matches
    points1 = np.zeros((len(matches), 2), dtype=np.float32)
    points2 = np.zeros((len(matches), 2), dtype=np.float32)

    for i, match in enumerate(matches):
        points1[i, :] = kp1[match.queryIdx].pt
        points2[i, :] = kp2[match.trainIdx].pt

    # Find affine transform (we want scale, rotation, translation)
    M, inliers = cv2.estimateAffinePartial2D(points1, points2, method=cv2.RANSAC)
    
    if M is None:
        return cv2.resize(gen_img, (w, h))

    # Warp gen_img
    aligned_gen = cv2.warpAffine(gen_img, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
    return aligned_gen

if __name__ == "__main__":
    orig = np.random.randint(0, 255, (500, 500, 3), dtype=np.uint8)
    gen = np.random.randint(0, 255, (600, 600, 3), dtype=np.uint8)
    # The output should run
    align_face_orb(orig, gen)
    print("Test passed.")
