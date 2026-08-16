import os
import glob
import shutil
import json
import re
from dotenv import load_dotenv
import vertexai
from vertexai.generative_models import GenerativeModel, Part

# Load env variables from project root
load_dotenv(dotenv_path="../.env")

# Initialize Vertex AI
vertexai.init(project="wealthyhair-ai-trans", location="us-central1")
model = GenerativeModel("gemini-2.5-flash")

DATASET_DIRS = [
    "dataset/images",
    "dataset/real_bald_dataset/images",
    "dataset/bald_men",
    "dataset/bald_women"
]

OUTPUT_DIR = "dataset/categorized"

def get_all_images():
    images = []
    for d in DATASET_DIRS:
        if os.path.exists(d):
            images.extend(glob.glob(os.path.join(d, "**", "*.[jJ][pP]*[gG]"), recursive=True))
            images.extend(glob.glob(os.path.join(d, "**", "*.[pP][nN][gG]"), recursive=True))
    return images

def group_images(image_paths):
    groups = {}
    for path in image_paths:
        filename = os.path.basename(path)
        # Check if it has a prefix like ID_Front.jpg or ID-Front.jpg
        match = re.match(r'(.+)_[A-Za-z\-]+\.jpg', filename, re.IGNORECASE)
        if match:
            patient_id = match.group(1)
        else:
            # Fallback: the whole filename without extension is the ID
            patient_id = os.path.splitext(filename)[0]
        
        if patient_id not in groups:
            groups[patient_id] = []
        groups[patient_id].append(path)
    return groups

def analyze_patient_group(patient_id, file_paths):
    try:
        parts = []
        for path in file_paths:
            with open(path, "rb") as f:
                img_bytes = f.read()
            parts.append(Part.from_data(data=img_bytes, mime_type="image/jpeg")) # Assuming mostly jpeg
        
        prompt = """
        You are a dermatologist data curator. Analyze the provided clinical photos of a hair loss patient.
        If there are multiple photos, they may show different angles (Front, Back, Top) or different time periods (Before/After).
        
        Answer the following based on visual evidence:
        1. "type": What is the primary hair loss type? Choose ONE from ["M-shape", "Crown", "Overall", "Normal/None"].
        2. "state": What is the state of the hair loss? Choose ONE from ["Before", "After", "Both_Before_And_After", "Unknown"].
           - If it's a severely balding patient, it's likely "Before" medication.
           - If there's clear thick density or evidence of recovery, it's "After".
        3. "estimated_months": If the state is "After" or "Both", estimate the months of medical treatment (3, 6, 9, 12, or 24) using the following clinical efficacy rule:
           - Finasteride typically increases density by 4-6 hairs/cm² over 6 months.
           - Dutasteride typically increases density by 22-23 hairs/cm² over 6 months (much more dense).
           - Base your estimate on how dense the hair looks compared to a typical bald baseline. If "Before", return 0.
        
        Return ONLY a raw JSON object with the keys: "type" (string), "state" (string), "estimated_months" (number). Do not include markdown blocks like ```json.
        """
        parts.append(prompt)
        
        response = model.generate_content(parts)
        text = response.text.replace('```json', '').replace('```', '').strip()
        result = json.loads(text)
        return result
    except Exception as e:
        print(f"Error analyzing {patient_id}: {e}")
        return {"type": "Unknown", "state": "Unknown", "estimated_months": 0}

def curate():
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)

    all_images = get_all_images()
    print(f"Found {len(all_images)} total images.")
    
    patient_groups = group_images(all_images)
    print(f"Grouped into {len(patient_groups)} patient sets.")

    # Process up to 50 groups to avoid rate limits or long execution for testing
    count = 0
    for pid, paths in patient_groups.items():
        if count >= 50:
            break
            
        print(f"[{count+1}/50] Analyzing Patient: {pid} (Files: {len(paths)})")
        analysis = analyze_patient_group(pid, paths)
        print(f"  Result: {analysis}")
        
        # Determine target folder
        hl_type = analysis.get("type", "Unknown")
        state = analysis.get("state", "Before")
        months = analysis.get("estimated_months", 0)
        
        target_dir = os.path.join(OUTPUT_DIR, hl_type, f"Patient_{pid}")
        os.makedirs(target_dir, exist_ok=True)
        
        for idx, src_path in enumerate(paths):
            ext = os.path.splitext(src_path)[1]
            if state == "After" or state == "Both_Before_And_After":
                dst_name = f"After_Est_{months}M_{idx}{ext}"
            else:
                dst_name = f"Before_{idx}{ext}"
            dst_path = os.path.join(target_dir, dst_name)
            shutil.copy2(src_path, dst_path)
        
        count += 1

    print("Curation complete!")

if __name__ == "__main__":
    curate()
