import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Mock Python model analysis - in real implementation, this would call your AI model
    const analysisResults = [];
    
    for (const frame of frames) {
      console.log(`Analyzing frame ${frame.frame_number}`);
      
      // Simulate AI model processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mock analysis result - vary results based on frame number for demonstration
      const mockResult = {
        weather: ['sunny', 'cloudy', 'rainy'][frame.frame_number % 3],
        day_night: frame.frame_number % 2 === 0 ? 'day' : 'night',
        road_type: ['urban', 'highway', 'residential'][frame.frame_number % 3],
        lanes: Math.floor(Math.random() * 4) + 1,
        parking: Math.random() > 0.5,
        underground: false
      };

      // Update frame with analysis results
      const { error: updateError } = await supabaseClient
        .from('frames')
        .update({
          weather_condition: mockResult.weather,
          scene_type: mockResult.day_night,
          traffic_density: mockResult.road_type,
          lane_count: mockResult.lanes,
          vehicle_count: mockResult.parking ? 1 : 0,
          accuracy: 0.85 + Math.random() * 0.1, // Mock confidence score
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
        analysis: mockResult
      });
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