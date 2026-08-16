import os
import cv2
import numpy as np
import base64
from google import genai
from google.genai import types

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "D:/wealthyhair/gcp-key.json"
os.environ["GCP_PROJECT_ID"] = "wealthyhair-ai-trans"

def test_genai_edit_real():
    try:
        client = genai.Client(vertexai=True, project=os.environ["GCP_PROJECT_ID"], location="us-central1")
        
        # Load a sample image (e.g. create a dummy face-like image or load one if exists)
        img = np.ones((512, 512, 3), dtype=np.uint8) * 200
        cv2.circle(img, (256, 256), 100, (100, 100, 250), -1) # Draw a red circle as a head
        _, img_buf = cv2.imencode('.png', img)
        image_bytes = img_buf.tobytes()

        # Create mask for top half
        mask = np.zeros((512, 512), dtype=np.uint8)
        mask[0:256, :] = 255
        _, mask_buf = cv2.imencode('.png', mask)
        mask_bytes = mask_buf.tobytes()

        prompt = "Add thick black hair to the top of the red circle."

        print("Calling edit_image via genai SDK...")
        res = client.models.edit_image(
            model="gemini-3.1-flash-image",
            prompt=prompt,
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
        print("Success! Number of images:", len(res.generated_images))
        if res.generated_images:
            with open("test_output.png", "wb") as f:
                f.write(res.generated_images[0].image.image_bytes)
            print("Saved test_output.png")
            
            # Check if image is completely gray
            out_img = cv2.imdecode(np.frombuffer(res.generated_images[0].image.image_bytes, np.uint8), cv2.IMREAD_COLOR)
            print("Output shape:", out_img.shape)
            print("Unique colors:", len(np.unique(out_img.reshape(-1, out_img.shape[2]), axis=0)))
    except Exception as e:
        import traceback
        print("Error details:")
        traceback.print_exc()

if __name__ == "__main__":
    test_genai_edit_real()
