// Client-side image classification using Hugging Face API

// Labels
const weatherLabels = ["Sunny", "Cloudy", "Rainfall", "Snowfall"];
const timeLabels = ["Day", "Night"];
const roadLabels = ["Highway", "City", "Suburb", "Rural"];
const laneLabels = ["more than two lanes", "two way traffic", "one lane"];

// Hugging Face API
const HF_MODEL = "openai/clip-vit-base-patch32";

// Convert uploaded image to Base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Call Hugging Face API directly from client
async function callHuggingFaceAPI(imageData: string, candidateLabels: string[], apiKey: string) {
  const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: {
        image: imageData,
        text: candidateLabels
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  console.log('HF API response:', result);
  
  if (result && Array.isArray(result) && result.length > 0) {
    const scores = result[0].scores || result[0];
    if (Array.isArray(scores)) {
      const maxIdx = scores.indexOf(Math.max(...scores));
      return { 
        label: candidateLabels[maxIdx], 
        score: Math.max(...scores),
        allScores: scores.map((score: number, idx: number) => ({ label: candidateLabels[idx], score }))
      };
    }
  }

  return { label: "Unknown", score: 0, allScores: [] };
}

// Enhanced function for URL-based classification
export async function classifyImageUrl(imageUrl: string, apiKey?: string) {
  console.log("Classifying image from URL:", imageUrl);
  
  // Use provided API key or try to get from environment
  const HF_TOKEN = apiKey || (window as any).HF_API_KEY;
  
  if (!HF_TOKEN) {
    throw new Error("Hugging Face API key is required. Please provide it as a parameter.");
  }

  try {
    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBlob = await imageResponse.blob();
    const imageFile = new File([imageBlob], "image.jpg", { type: imageBlob.type });
    const base64Image = await fileToBase64(imageFile);
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

    // Create prompts for each classification
    const weatherPrompts = weatherLabels.map(label => `a photo of ${label.toLowerCase()} weather`);
    const timePrompts = timeLabels.map(label => `a photo taken during ${label.toLowerCase()}`);
    const roadPrompts = roadLabels.map(label => `a photo of a ${label.toLowerCase()} road`);
    const lanePrompts = laneLabels.map(label => `a photo of a road with ${label}`);

    console.log('Starting classifications...');

    // Make parallel API calls
    const [weather, time, road, lanes] = await Promise.allSettled([
      callHuggingFaceAPI(imageDataUrl, weatherPrompts, HF_TOKEN),
      callHuggingFaceAPI(imageDataUrl, timePrompts, HF_TOKEN),
      callHuggingFaceAPI(imageDataUrl, roadPrompts, HF_TOKEN),
      callHuggingFaceAPI(imageDataUrl, lanePrompts, HF_TOKEN)
    ]);

    // Process results with fallbacks
    const weatherResult = weather.status === 'fulfilled' ? weather.value : { label: 'Sunny', score: 0.5 };
    const timeResult = time.status === 'fulfilled' ? time.value : { label: 'Day', score: 0.5 };
    const roadResult = road.status === 'fulfilled' ? road.value : { label: 'City', score: 0.5 };
    const laneResult = lanes.status === 'fulfilled' ? lanes.value : { label: 'two way traffic', score: 0.5 };

    // Calculate average confidence
    const avgConfidence = (weatherResult.score + timeResult.score + roadResult.score + laneResult.score) / 4;

    const result = {
      weather: weatherResult.label,
      "day-night": timeResult.label,
      "road-type": roadResult.label,
      lanes: laneResult.label,
      confidence: avgConfidence,
      details: {
        weather: weatherResult,
        time: timeResult,
        road: roadResult,
        lanes: laneResult
      }
    };

    console.log('Classification completed:', result);
    return result;

  } catch (error) {
    console.error("Classification error:", error);
    throw new Error(`Classification failed: ${error.message}`);
  }
}

// File-based classification function
export async function classifyImageFile(image: File, apiKey?: string) {
  const HF_TOKEN = apiKey || (window as any).HF_API_KEY;
  
  if (!HF_TOKEN) {
    throw new Error("Hugging Face API key is required. Please provide it as a parameter.");
  }

  const base64Image = await fileToBase64(image);
  const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

  // Create prompts for each classification
  const weatherPrompts = weatherLabels.map(label => `a photo of ${label.toLowerCase()} weather`);
  const timePrompts = timeLabels.map(label => `a photo taken during ${label.toLowerCase()}`);
  const roadPrompts = roadLabels.map(label => `a photo of a ${label.toLowerCase()} road`);
  const lanePrompts = laneLabels.map(label => `a photo of a road with ${label}`);

  const [weather, time, road, lanes] = await Promise.allSettled([
    callHuggingFaceAPI(imageDataUrl, weatherPrompts, HF_TOKEN),
    callHuggingFaceAPI(imageDataUrl, timePrompts, HF_TOKEN),
    callHuggingFaceAPI(imageDataUrl, roadPrompts, HF_TOKEN),
    callHuggingFaceAPI(imageDataUrl, lanePrompts, HF_TOKEN)
  ]);

  // Process results with fallbacks
  const weatherResult = weather.status === 'fulfilled' ? weather.value : { label: 'Sunny', score: 0.5 };
  const timeResult = time.status === 'fulfilled' ? time.value : { label: 'Day', score: 0.5 };
  const roadResult = road.status === 'fulfilled' ? road.value : { label: 'City', score: 0.5 };
  const laneResult = lanes.status === 'fulfilled' ? lanes.value : { label: 'two way traffic', score: 0.5 };

  // Calculate average confidence
  const avgConfidence = (weatherResult.score + timeResult.score + roadResult.score + laneResult.score) / 4;

  return {
    weather: weatherResult.label,
    "day-night": timeResult.label,
    "road-type": roadResult.label,
    lanes: laneResult.label,
    confidence: avgConfidence,
    details: {
      weather: weatherResult,
      time: timeResult,
      road: roadResult,
      lanes: laneResult
    }
  };
}