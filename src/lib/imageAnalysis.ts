import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

interface ImageAnalysisResult {
  weather: string;
  timeOfDay: string;
  roadType: string;
  lanes: number;
  confidence: number;
}

class ImageAnalyzer {
  private clipModel: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing CLIP model for image analysis...');
    try {
      this.clipModel = await pipeline(
        'zero-shot-image-classification',
        'Xenova/clip-vit-base-patch32',
        { device: 'webgpu' }
      );
      this.isInitialized = true;
      console.log('CLIP model initialized successfully');
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU');
      this.clipModel = await pipeline(
        'zero-shot-image-classification',
        'Xenova/clip-vit-base-patch32'
      );
      this.isInitialized = true;
    }
  }

  async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('Analyzing image:', imageUrl);

    // Define classification categories
    const weatherLabels = ['sunny weather', 'cloudy weather', 'rainy weather', 'snowy weather', 'foggy weather'];
    const timeLabels = ['daytime', 'nighttime', 'dawn', 'dusk'];
    const roadLabels = ['highway road', 'city street', 'suburban road', 'rural road'];
    const laneLabels = ['single lane road', 'two lane road', 'multi lane road', 'highway with many lanes'];

    try {
      // Perform classifications
      const [weatherResult, timeResult, roadResult, laneResult] = await Promise.all([
        this.clipModel(imageUrl, weatherLabels),
        this.clipModel(imageUrl, timeLabels),
        this.clipModel(imageUrl, roadLabels),
        this.clipModel(imageUrl, laneLabels)
      ]);

      // Extract top predictions
      const weather = this.mapWeatherLabel(weatherResult[0].label);
      const timeOfDay = this.mapTimeLabel(timeResult[0].label);
      const roadType = this.mapRoadLabel(roadResult[0].label);
      const lanes = this.mapLaneCount(laneResult[0].label);

      // Calculate average confidence
      const confidence = (
        weatherResult[0].score + 
        timeResult[0].score + 
        roadResult[0].score + 
        laneResult[0].score
      ) / 4;

      const result = {
        weather,
        timeOfDay,
        roadType,
        lanes,
        confidence
      };

      console.log('Analysis result:', result);
      return result;

    } catch (error) {
      console.error('Error during image analysis:', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  private mapWeatherLabel(label: string): string {
    if (label.includes('sunny')) return 'sunny';
    if (label.includes('cloudy')) return 'cloudy';
    if (label.includes('rainy')) return 'rainfall';
    if (label.includes('snowy')) return 'snowfall';
    if (label.includes('foggy')) return 'cloudy';
    return 'sunny';
  }

  private mapTimeLabel(label: string): string {
    if (label.includes('daytime')) return 'day';
    if (label.includes('nighttime')) return 'night';
    if (label.includes('dawn')) return 'dawn';
    if (label.includes('dusk')) return 'dusk';
    return 'day';
  }

  private mapRoadLabel(label: string): string {
    if (label.includes('highway')) return 'highway';
    if (label.includes('city')) return 'city';
    if (label.includes('suburban')) return 'suburb';
    if (label.includes('rural')) return 'rural';
    return 'city';
  }

  private mapLaneCount(label: string): number {
    if (label.includes('single')) return 1;
    if (label.includes('two')) return 2;
    if (label.includes('multi') || label.includes('many')) return 3;
    return 2;
  }

  async analyzeMultipleImages(imageUrls: string[]): Promise<ImageAnalysisResult[]> {
    const results: ImageAnalysisResult[] = [];
    
    for (const imageUrl of imageUrls) {
      try {
        const result = await this.analyzeImage(imageUrl);
        results.push(result);
      } catch (error) {
        console.error(`Failed to analyze image ${imageUrl}:`, error);
        // Add default result for failed analysis
        results.push({
          weather: 'sunny',
          timeOfDay: 'day',
          roadType: 'city',
          lanes: 2,
          confidence: 0
        });
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const imageAnalyzer = new ImageAnalyzer();