import os
import base64
from google import genai
from google.genai import types

def main():
    try:
        client = genai.Client()
        import numpy as np
        import cv2
        img = np.zeros((256, 256, 3), dtype=np.uint8)
        _, buffer = cv2.imencode('.jpg', img)
        image_bytes = buffer.tobytes()

        print("Calling edit_image...")
        res = client.models.edit_image(
            model="imagen-3.0-generate-002",
            prompt="Make it blue",
            reference_images=[types.ReferenceImage(
                reference_id=1,
                reference_image=types.Image(image_bytes=image_bytes)
            )],
        )
        print("Success:", res)
    except Exception as e:
        print("Error:", e)

main()
