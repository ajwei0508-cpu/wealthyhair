import os
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession
import base64
import numpy as np
import cv2

creds = service_account.Credentials.from_service_account_file("D:/wealthyhair/gcp-key.json", scopes=["https://www.googleapis.com/auth/cloud-platform"])
authed_session = AuthorizedSession(creds)

project_id = "wealthyhair-ai-trans"
location = "us-central1"

url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/gemini-2.5-flash-image:generateContent"

img = np.zeros((256, 256, 3), dtype=np.uint8)
_, img_buf = cv2.imencode('.png', img)
b64_img = base64.b64encode(img_buf).decode('utf-8')

payload = {
    "contents": [
        {
            "role": "user",
            "parts": [
                {"text": "Make it blue"},
                {"inlineData": {"mimeType": "image/png", "data": b64_img}}
            ]
        }
    ]
}

response = authed_session.post(url, json=payload)
print("Status:", response.status_code)
print("Response:", response.text)
