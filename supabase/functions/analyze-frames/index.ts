import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { pipeline } from 'https://esm.sh/@huggingface/transformers@3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sequenceId } = await req.json();

    if (!sequenceId) {
      return new Response(
        JSON.stringify({ error: 'sequenceId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting frame analysis for sequence:', sequenceId);

    // Fetch all frames for the sequence
    const { data: frames, error: framesError } = await supabaseClient
      .from('frames')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('frame_number');

    if (framesError) {
      console.error('Error fetching frames:', framesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch frames' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!frames || frames.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No frames found for sequence' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${frames.length} frames to analyze`);

    // Initialize CLIP classifier pipeline
    const classifier = await pipeline('zero-shot-image-classification', 'openai/clip-vit-base-patch32');

    // Classification labels as per your Python script
    const weatherLabels = ["Sunny", "Cloudy", "Rainfall", "Snowfall"];
    const timeLabels = ["Day", "Night"];
    const roadLabels = ["Highway", "City", "Suburb", "Rural"];
    const laneLabels = ["more than two lanes", "two way traffic", "one lane"];

    const analysisResults = [];
    
    for (const frame of frames) {
      console.log(`Analyzing frame ${frame.frame_number}`);
      
      try {
        if (!frame.image_url) {
          console.error(`No image URL for frame ${frame.frame_number}`);
          continue;
        }

        // Classify image using CLIP model
        const [weatherResult, timeResult, roadResult, laneResult] = await Promise.all([
          classifier(frame.image_url, weatherLabels.map(l => `a photo of ${l.toLowerCase()} weather`)),
          classifier(frame.image_url, timeLabels.map(l => `a photo taken during ${l.toLowerCase()}`)),
          classifier(frame.image_url, roadLabels.map(l => `a photo of a ${l.toLowerCase()} road`)),
          classifier(frame.image_url, laneLabels.map(l => `a photo of a road with ${l}`))
        ]);

        const analysisResult = {
          weather: weatherLabels[weatherResult.findIndex((r: any) => r.score === Math.max(...weatherResult.map((item: any) => item.score)))],
          day_night: timeLabels[timeResult.findIndex((r: any) => r.score === Math.max(...timeResult.map((item: any) => item.score)))],
          road_type: roadLabels[roadResult.findIndex((r: any) => r.score === Math.max(...roadResult.map((item: any) => item.score)))],
          lanes: laneLabels[laneResult.findIndex((r: any) => r.score === Math.max(...laneResult.map((item: any) => item.score)))]
        };

        // Update frame with analysis results
        const { error: updateError } = await supabaseClient
          .from('frames')
          .update({
            weather_condition: analysisResult.weather,
            scene_type: analysisResult.day_night,
            traffic_density: analysisResult.road_type,
            lane_count: analysisResult.lanes === 'one lane' ? 1 : analysisResult.lanes === 'two way traffic' ? 2 : 3,
            vehicle_count: 0, // Not classified in this model
            accuracy: 0.85, // Fixed confidence score
            updated_at: new Date().toISOString()
          })
          .eq('id', frame.id);

        if (updateError) {
          console.error('Error updating frame:', updateError);
          continue;
        }

        analysisResults.push({
          frameId: frame.id,
          frameNumber: frame.frame_number,
          analysis: analysisResult
        });

      } catch (error) {
        console.error(`Error analyzing frame ${frame.frame_number}:`, error);
        continue;
      }
    }

    console.log(`Analysis complete. Updated ${analysisResults.length} frames`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Analysis complete for ${analysisResults.length} frames`,
        results: analysisResults 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-frames function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});