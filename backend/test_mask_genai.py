import os
from google import genai
from google.genai import types
import base64
import cv2
import numpy as np

def test_mask():
    project_id = os.environ.get("GCP_PROJECT_ID")
    client = genai.Client(vertexai=True, project=project_id, location="us-central1")
    
    # Create dummy images
    img = np.zeros((500, 500, 3), dtype=np.uint8)
    cv2.circle(img, (250, 250), 100, (255, 255, 255), -1)
    _, img_bytes = cv2.imencode('.png', img)
    
    mask = np.zeros((500, 500), dtype=np.uint8)
    cv2.circle(mask, (250, 250), 50, 255, -1)
    _, mask_bytes = cv2.imencode('.png', mask)

    print("Sending request with mask...")
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=[
                types.Part.from_bytes(data=img_bytes.tobytes(), mime_type="image/png"),
                types.Part.from_bytes(data=mask_bytes.tobytes(), mime_type="image/png"),
                "Fill the center circle with red color."
            ],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"]
            )
        )
        print("Success!")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_mask()
