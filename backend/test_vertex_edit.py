import os
import cv2
import numpy as np
from vertexai.preview.vision_models import Image, ImageGenerationModel

# Load env variables manually since dotenv isn't imported here
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "D:/wealthyhair/gcp-key.json"
os.environ["GCP_PROJECT_ID"] = "wealthyhair-ai-trans"

def test_edit():
    try:
        import vertexai
        vertexai.init(project=os.environ["GCP_PROJECT_ID"], location="us-central1")
        
        # We must use imagen-3.0-generate-002 or imagegeneration@006
        # According to GCP docs, imagen-3.0-generate-002 is the latest
        model = ImageGenerationModel.from_pretrained("imagegeneration@006")
        
        # Create dummy image and mask
        img = np.zeros((256, 256, 3), dtype=np.uint8)
        _, img_buf = cv2.imencode('.png', img)
        base_image = Image(img_buf.tobytes())

        mask = np.zeros((256, 256), dtype=np.uint8)
        mask[100:150, 100:150] = 255
        _, mask_buf = cv2.imencode('.png', mask)
        mask_image = Image(mask_buf.tobytes())

        print("Calling edit_image on Vertex AI...")
        response = model.edit_image(
            base_image=base_image,
            mask=mask_image,
            prompt="A blue square",
            edit_mode="inpainting-insert"
        )
        print("Success! Output:", response)
    except Exception as e:
        print("Vertex Error:", e)

test_edit()
