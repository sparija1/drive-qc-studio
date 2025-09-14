# Deploy Python Analysis Service

## Option 1: Railway (Recommended - Free Tier Available)

1. **Sign up at Railway**: https://railway.app
2. **Create new project** from GitHub repo or upload files
3. **Add service** and select your repository
4. **Set environment variables**:
   - Set `PORT` to `8000` (Railway will auto-detect)
5. **Deploy**: Railway will automatically build using the Dockerfile
6. **Get service URL**: Copy the generated URL (e.g., `https://your-service.railway.app`)

## Option 2: Render (Alternative)

1. **Sign up at Render**: https://render.com
2. **Create new Web Service**
3. **Connect GitHub repository**
4. **Configure**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Deploy** and get service URL

## Option 3: Google Cloud Run

1. **Build and push Docker image**:
   ```bash
   docker build -t gcr.io/YOUR_PROJECT_ID/frame-analyzer .
   docker push gcr.io/YOUR_PROJECT_ID/frame-analyzer
   ```
2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy frame-analyzer --image gcr.io/YOUR_PROJECT_ID/frame-analyzer --platform managed
   ```

## After Deployment

1. **Copy your service URL**
2. **Add it to Supabase Edge Function secrets**:
   - Go to: https://supabase.com/dashboard/project/sengiffddirprlxmmabi/settings/functions
   - Add secret: `PYTHON_SERVICE_URL` = `https://your-deployed-service-url.com`
3. **Test the service**: Visit `https://your-service-url.com/health`

## Testing Locally

```bash
cd python-analysis-service
docker build -t frame-analyzer .
docker run -p 8000:8000 frame-analyzer
```

Visit http://localhost:8000/health to test.