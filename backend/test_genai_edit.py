import os
import cv2
import numpy as np
from google import genai
from google.genai import types

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "D:/wealthyhair/gcp-key.json"
os.environ["GCP_PROJECT_ID"] = "wealthyhair-ai-trans"

def test_genai_edit():
    try:
        client = genai.Client(vertexai=True, project=os.environ["GCP_PROJECT_ID"], location="us-central1")
        
        img = np.zeros((256, 256, 3), dtype=np.uint8)
        _, img_buf = cv2.imencode('.png', img)
        image_bytes = img_buf.tobytes()

        mask = np.zeros((256, 256), dtype=np.uint8)
        mask[100:150, 100:150] = 255
        _, mask_buf = cv2.imencode('.png', mask)
        mask_bytes = mask_buf.tobytes()

        print("Calling edit_image via genai SDK...")
        # Note: edit_image requires a reference_image of type MASK
        res = client.models.edit_image(
            model="gemini-3.1-flash-image", # Or imagen-3.0-generate-002
            prompt="Make it blue",
            reference_images=[
                {
                    "reference_id": 1,
                    "reference_image": {"image_bytes": image_bytes}
                },
                {
                    "reference_id": 2,
                    "reference_type": "MASK",
                    "reference_image": {"image_bytes": mask_bytes}
                }
            ]
        )
        print("Success!", res)
    except Exception as e:
        print("Error:", e)

test_genai_edit()
