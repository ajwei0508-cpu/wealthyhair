import cv2
import numpy as np
import mediapipe as mp

def align_face(orig_img, gen_img):
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)

    # Convert to RGB for mediapipe
    orig_rgb = cv2.cvtColor(orig_img, cv2.COLOR_BGR2RGB)
    gen_rgb = cv2.cvtColor(gen_img, cv2.COLOR_BGR2RGB)

    orig_results = face_mesh.process(orig_rgb)
    gen_results = face_mesh.process(gen_rgb)

    if not orig_results.multi_face_landmarks or not gen_results.multi_face_landmarks:
        # Fallback if face not found
        h, w = orig_img.shape[:2]
        return cv2.resize(gen_img, (w, h))

    orig_landmarks = orig_results.multi_face_landmarks[0].landmark
    gen_landmarks = gen_results.multi_face_landmarks[0].landmark

    h, w = orig_img.shape[:2]
    gh, gw = gen_img.shape[:2]

    # Use a few stable points: Left eye center, Right eye center, Nose tip, Mouth center
    # Mediapipe landmark indices: Left eye (33, 133), Right eye (362, 263), Nose (1), Mouth (13, 14)
    key_indices = [33, 133, 362, 263, 1, 13, 14]

    orig_pts = []
    gen_pts = []

    for idx in key_indices:
        orig_pts.append([orig_landmarks[idx].x * w, orig_landmarks[idx].y * h])
        gen_pts.append([gen_landmarks[idx].x * gw, gen_landmarks[idx].y * gh])

    orig_pts = np.array(orig_pts, dtype=np.float32)
    gen_pts = np.array(gen_pts, dtype=np.float32)

    # Estimate affine transform (translation, scale, rotation) from GEN to ORIG
    M, inliers = cv2.estimateAffinePartial2D(gen_pts, orig_pts)

    if M is None:
        return cv2.resize(gen_img, (w, h))

    # Warp generated image to match original image
    aligned_gen = cv2.warpAffine(gen_img, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
    return aligned_gen

if __name__ == "__main__":
    # Test script: create dummy images and run
    orig = np.zeros((500, 500, 3), dtype=np.uint8)
    gen = np.zeros((600, 600, 3), dtype=np.uint8)
    # The output should just run without crashing
    align_face(orig, gen)
    print("Test passed.")
