# Frame Analysis Service

A Python FastAPI service that uses CLIP model for frame analysis.

## Setup

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
python main.py
```

The service will be available at `http://localhost:8000`

### Docker Deployment

1. Build the image:
```bash
docker build -t frame-analysis-service .
```

2. Run the container:
```bash
docker run -p 8000:8000 frame-analysis-service
```

### Deploy to Cloud

You can deploy this service to:

#### Railway
1. Create a new project on Railway
2. Connect your GitHub repository
3. Railway will automatically detect the Dockerfile and deploy

#### Render
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Google Cloud Run
```bash
gcloud run deploy frame-analysis --source . --platform managed --allow-unauthenticated
```

## API Endpoints

### `POST /analyze`
Analyze a single image.

Request:
```json
{
  "image_url": "https://example.com/image.jpg"
}
```

Response:
```json
{
  "weather": "Sunny",
  "day_night": "Day",
  "road_type": "Highway",
  "lanes": "more than two lanes",
  "confidence_scores": {
    "weather": 0.95,
    "time": 0.87,
    "road": 0.92,
    "lanes": 0.78
  }
}
```

### `POST /analyze-batch`
Analyze multiple images in batch.

Request:
```json
["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
```

### `GET /health`
Health check endpoint.