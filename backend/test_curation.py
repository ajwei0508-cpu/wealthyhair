import json
import time
import requests
import base64
from duckduckgo_search import DDGS
import vertexai
from vertexai.generative_models import GenerativeModel, Part

# 초기화
vertexai.init(project="wealthyhair-ai-trans", location="us-central1")
model = GenerativeModel("gemini-2.5-flash")

def download_image(url):
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return response.content
    except Exception as e:
        pass
    return None

def analyze_image(img_bytes):
    try:
        part = Part.from_bytes(data=img_bytes, mime_type="image/jpeg")
        prompt = """
        You are a dermatologist data curator. Analyze this image.
        Return ONLY a JSON object with these keys:
        - "is_hair_loss_photo": boolean (true if it shows human scalp/hair loss/recovery, false if it's a chart, product, text, or unrelated)
        - "type": string (choose ONE: "M-shape", "Crown", "Overall", or "Unknown")
        - "state": string (choose ONE: "Before", "After", "Both_Comparison", or "Unknown" if it's just one photo and you can't tell if it's before or after medication)
        - "confidence": number (1 to 100)
        """
        response = model.generate_content([part, prompt])
        text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
    except Exception as e:
        return {"is_hair_loss_photo": False, "error": str(e)}

def search_and_analyze(query, max_results=5):
    print(f"Searching for: {query}")
    results = DDGS().images(query, max_results=max_results)
    for res in results:
        url = res['image']
        print(f"Downloading {url} ...")
        img_bytes = download_image(url)
        if img_bytes:
            analysis = analyze_image(img_bytes)
            print(f"Analysis: {analysis}")
        time.sleep(1)

if __name__ == "__main__":
    search_and_analyze("finasteride before after crown hair loss", 3)
