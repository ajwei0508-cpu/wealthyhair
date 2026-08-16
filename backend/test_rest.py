import os
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

creds = service_account.Credentials.from_service_account_file("D:/wealthyhair/gcp-key.json", scopes=["https://www.googleapis.com/auth/cloud-platform"])
authed_session = AuthorizedSession(creds)

project_id = "wealthyhair-ai-trans"
location = "us-central1"
# Try imagegeneration@006
url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/gemini-3.1-flash-image:predict"

payload = {
    "instances": [{"prompt": "A blue square"}],
    "parameters": {"sampleCount": 1}
}

response = authed_session.post(url, json=payload)
print(response.status_code)
print(response.text)
