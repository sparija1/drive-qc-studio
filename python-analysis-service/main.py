from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import requests
from io import BytesIO
import uvicorn
from typing import Dict, Any

app = FastAPI(title="AIEOU Frame Analysis Service", version="1.0.0")

# Load pretrained CLIP model
print("Loading CLIP model...")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Try to load fine-tuned model if available
try:
    # You can replace this URL with your actual model URL
    model_url = "https://sengiffddirprlxmmabi.supabase.co/storage/v1/object/public/sequence-images/models/clip_finetuned_final.pt"
    response = requests.get(model_url)
    if response.status_code == 200:
        # Load the fine-tuned model
        fine_tuned_state = torch.load(BytesIO(response.content), map_location='cpu')
        model.load_state_dict(fine_tuned_state)
        print("Fine-tuned model loaded successfully!")
except Exception as e:
    print(f"Could not load fine-tuned model, using base model: {e}")

# Candidate labels
weather_labels = ["Sunny", "Cloudy", "Rainfall", "Snowfall"]
time_labels = ["Day", "Night"]
road_labels = ["Highway", "City", "Suburb", "Rural"]
lane_labels = ["more than two lanes", "two way traffic", "one lane"]

class ImageAnalysisRequest(BaseModel):
    image_url: str

class ImageAnalysisResponse(BaseModel):
    weather: str
    day_night: str
    road_type: str
    lanes: str
    confidence_scores: Dict[str, float] = {}

def classify_with_clip(image, labels, prompt_template="a photo of {}"):
    """Helper function to classify using CLIP given a list of labels."""
    texts = [prompt_template.format(l) for l in labels]
    inputs = processor(text=texts, images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)
    
    # Get the best prediction and confidence
    best_idx = probs.argmax().item()
    confidence = probs.max().item()
    
    return labels[best_idx], confidence

def classify_image(image_url: str) -> Dict[str, Any]:
    """Main classification function matching your Python script."""
    try:
        # Download image
        response = requests.get(image_url)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content)).convert("RGB")
        
        # Classify different aspects
        weather, weather_conf = classify_with_clip(
            image, weather_labels, prompt_template="a photo of {} weather"
        )
        time, time_conf = classify_with_clip(
            image, time_labels, prompt_template="a photo taken during {}"
        )
        road, road_conf = classify_with_clip(
            image, road_labels, prompt_template="a photo of a {} road"
        )
        lanes, lanes_conf = classify_with_clip(
            image, lane_labels, prompt_template="a photo of a road with {}"
        )
        
        return {
            "weather": weather,
            "day-night": time,
            "road-type": road,
            "lanes": lanes,
            "confidence_scores": {
                "weather": float(weather_conf),
                "time": float(time_conf),
                "road": float(road_conf),
                "lanes": float(lanes_conf)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

@app.get("/")
async def root():
    return {"message": "AIEOU Frame Analysis Service is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": True}

@app.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(request: ImageAnalysisRequest):
    """Analyze a single image and return classification results."""
    try:
        result = classify_image(request.image_url)
        
        return ImageAnalysisResponse(
            weather=result["weather"],
            day_night=result["day-night"],
            road_type=result["road-type"],
            lanes=result["lanes"],
            confidence_scores=result["confidence_scores"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-batch")
async def analyze_batch(image_urls: list[str]):
    """Analyze multiple images in batch."""
    results = []
    
    for url in image_urls:
        try:
            result = classify_image(url)
            results.append({
                "image_url": url,
                "analysis": result,
                "success": True
            })
        except Exception as e:
            results.append({
                "image_url": url,
                "error": str(e),
                "success": False
            })
    
    return {"results": results}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)