import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Python service URL - replace with your deployed service URL
const PYTHON_SERVICE_URL = Deno.env.get('PYTHON_SERVICE_URL') || 'http://localhost:8000';

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

    const analysisResults = [];
    
    // Helper function to call Python service for image analysis
    async function analyzeImageWithPython(imageUrl: string) {
      const response = await fetch(`${PYTHON_SERVICE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_url: imageUrl }),
      });

      if (!response.ok) {
        throw new Error(`Python service error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return {
        weather: result.weather,
        dayNight: result.day_night,
        roadType: result.road_type,
        lanes: result.lanes,
        confidence: result.confidence_scores
      };
    }
    
    for (const frame of frames) {
      console.log(`Analyzing frame ${frame.frame_number}`);
      
      if (!frame.image_url) {
        console.error(`No image URL for frame ${frame.frame_number}`);
        continue;
      }

      try {
        // Call Python service for analysis
        const classification = await analyzeImageWithPython(frame.image_url);

        const analysisResult = {
          weather: classification.weather,
          day_night: classification.dayNight,
          road_type: classification.roadType,
          lanes: classification.lanes
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
        // Return error response if any frame fails
        return new Response(
          JSON.stringify({ 
            error: `Failed to analyze frame ${frame.frame_number}: ${error.message}`,
            frame_number: frame.frame_number
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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