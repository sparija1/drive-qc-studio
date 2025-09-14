import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  weather: string;
  timeOfDay: string;
  roadType: string;
  lanes: number;
  confidence: number;
  vehicleCount: number;
  pedestrianCount: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sequenceId } = await req.json();
    
    if (!sequenceId) {
      return new Response(
        JSON.stringify({ error: 'sequenceId is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Hugging Face
    const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!hfToken) {
      throw new Error('Hugging Face access token not configured');
    }
    
    const hf = new HfInference(hfToken);
    console.log('Initialized Hugging Face client');

    // Get frames for the sequence
    const { data: frames, error: framesError } = await supabase
      .from('frames')
      .select('*')
      .eq('sequence_id', sequenceId)
      .not('image_url', 'is', null)
      .order('frame_number');

    if (framesError) {
      throw new Error(`Failed to fetch frames: ${framesError.message}`);
    }

    if (!frames || frames.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No frames with images found for analysis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${frames.length} frames to analyze`);
    let successCount = 0;
    let errorCount = 0;

    // Process each frame
    for (const frame of frames) {
      try {
        console.log(`Processing frame ${frame.frame_number} with image: ${frame.image_url}`);
        
        const analysisResult = await analyzeFrameWithHF(hf, frame.image_url);
        
        // Update frame with analysis results
        const { error: updateError } = await supabase
          .from('frames')
          .update({
            weather_condition: analysisResult.weather,
            time_of_day: analysisResult.timeOfDay,
            scene_type: analysisResult.roadType,
            lane_count: analysisResult.lanes,
            vehicle_count: analysisResult.vehicleCount,
            pedestrian_count: analysisResult.pedestrianCount,
            accuracy: analysisResult.confidence,
            status: 'analyzed',
            updated_at: new Date().toISOString()
          })
          .eq('id', frame.id);

        if (updateError) {
          console.error(`Error updating frame ${frame.frame_number}:`, updateError);
          errorCount++;
        } else {
          console.log(`Successfully updated frame ${frame.frame_number}`);
          successCount++;
        }

      } catch (error) {
        console.error(`Error processing frame ${frame.frame_number}:`, error);
        errorCount++;
      }
    }

    const message = `Analysis complete. Updated ${successCount} frames successfully.${errorCount > 0 ? ` ${errorCount} frames failed.` : ''}`;
    console.log(message);

    return new Response(
      JSON.stringify({ 
        message,
        successCount,
        errorCount,
        totalFrames: frames.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-frames function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function analyzeFrameWithHF(hf: HfInference, imageUrl: string): Promise<AnalysisResult> {
  console.log('Analyzing image with Hugging Face models:', imageUrl);

  try {
    // Use CLIP for zero-shot image classification
    const weatherResult = await hf.zeroShotImageClassification({
      model: 'openai/clip-vit-base-patch32',
      inputs: imageUrl,
      parameters: {
        candidate_labels: ['sunny weather', 'cloudy weather', 'rainy weather', 'snowy weather', 'foggy weather']
      }
    });

    const timeResult = await hf.zeroShotImageClassification({
      model: 'openai/clip-vit-base-patch32',
      inputs: imageUrl,
      parameters: {
        candidate_labels: ['daytime scene', 'nighttime scene', 'dawn scene', 'dusk scene']
      }
    });

    const roadResult = await hf.zeroShotImageClassification({
      model: 'openai/clip-vit-base-patch32',
      inputs: imageUrl,
      parameters: {
        candidate_labels: ['highway road', 'city street', 'suburban road', 'rural road']
      }
    });

    const laneResult = await hf.zeroShotImageClassification({
      model: 'openai/clip-vit-base-patch32',
      inputs: imageUrl,
      parameters: {
        candidate_labels: ['single lane road', 'two lane road', 'multi lane highway', 'wide highway with many lanes']
      }
    });

    const vehicleResult = await hf.zeroShotImageClassification({
      model: 'openai/clip-vit-base-patch32',
      inputs: imageUrl,
      parameters: {
        candidate_labels: ['no vehicles', 'few vehicles', 'moderate traffic', 'heavy traffic', 'very heavy traffic']
      }
    });

    const pedestrianResult = await hf.zeroShotImageClassification({
      model: 'openai/clip-vit-base-patch32',
      inputs: imageUrl,
      parameters: {
        candidate_labels: ['no pedestrians', 'few pedestrians', 'some pedestrians', 'many pedestrians']
      }
    });

    // Process results
    const weather = mapWeatherLabel(weatherResult[0].label);
    const timeOfDay = mapTimeLabel(timeResult[0].label);
    const roadType = mapRoadLabel(roadResult[0].label);
    const lanes = mapLaneCount(laneResult[0].label);
    const vehicleCount = mapVehicleCount(vehicleResult[0].label);
    const pedestrianCount = mapPedestrianCount(pedestrianResult[0].label);

    // Calculate average confidence
    const confidence = (
      weatherResult[0].score + 
      timeResult[0].score + 
      roadResult[0].score + 
      laneResult[0].score + 
      vehicleResult[0].score + 
      pedestrianResult[0].score
    ) / 6;

    const result = {
      weather,
      timeOfDay,
      roadType,
      lanes,
      vehicleCount,
      pedestrianCount,
      confidence
    };

    console.log('Classification result:', result);
    return result;

  } catch (error) {
    console.error('Error in Hugging Face analysis:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

function mapWeatherLabel(label: string): string {
  if (label.includes('sunny')) return 'sunny';
  if (label.includes('cloudy')) return 'cloudy';
  if (label.includes('rainy')) return 'rainfall';
  if (label.includes('snowy')) return 'snowfall';
  if (label.includes('foggy')) return 'cloudy';
  return 'sunny';
}

function mapTimeLabel(label: string): string {
  if (label.includes('daytime')) return 'day';
  if (label.includes('nighttime')) return 'night';
  if (label.includes('dawn')) return 'dawn';
  if (label.includes('dusk')) return 'dusk';
  return 'day';
}

function mapRoadLabel(label: string): string {
  if (label.includes('highway')) return 'highway';
  if (label.includes('city')) return 'city';
  if (label.includes('suburban')) return 'suburb';
  if (label.includes('rural')) return 'rural';
  return 'city';
}

function mapLaneCount(label: string): number {
  if (label.includes('single')) return 1;
  if (label.includes('two')) return 2;
  if (label.includes('multi') || label.includes('many') || label.includes('wide')) return 4;
  return 2;
}

function mapVehicleCount(label: string): number {
  if (label.includes('no vehicles')) return 0;
  if (label.includes('few vehicles')) return 2;
  if (label.includes('moderate')) return 5;
  if (label.includes('heavy')) return 10;
  if (label.includes('very heavy')) return 15;
  return 3;
}

function mapPedestrianCount(label: string): number {
  if (label.includes('no pedestrians')) return 0;
  if (label.includes('few')) return 1;
  if (label.includes('some')) return 3;
  if (label.includes('many')) return 5;
  return 0;
}