-- Fix security warnings
-- 1. Set search_path for the function to prevent search path manipulation
DROP FUNCTION IF EXISTS analyze_frame_attributes(TEXT);

CREATE OR REPLACE FUNCTION analyze_frame_attributes(
  frame_image_url TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- This function would call a Python model to analyze frame attributes
  -- For now, return mock data structure
  result := json_build_object(
    'weather', 'sunny',
    'day_night', 'day', 
    'road_type', 'urban',
    'lanes', 2,
    'parking', true,
    'underground', false
  );
  
  RETURN result;
END;
$$;