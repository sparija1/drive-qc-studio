-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pipelines table
CREATE TABLE public.pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequences table
CREATE TABLE public.sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  fps REAL DEFAULT 30.0,
  duration REAL,
  total_frames INTEGER DEFAULT 0,
  scene_type TEXT CHECK (scene_type IN ('highway', 'urban', 'rural', 'suburban')),
  weather_condition TEXT CHECK (weather_condition IN ('sunny', 'cloudy', 'rainy', 'foggy', 'snowy')),
  traffic_density TEXT CHECK (traffic_density IN ('light', 'moderate', 'heavy')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create frames table
CREATE TABLE public.frames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  frame_number INTEGER NOT NULL,
  timestamp_ms REAL NOT NULL,
  image_url TEXT,
  vehicle_count INTEGER DEFAULT 0,
  pedestrian_count INTEGER DEFAULT 0,
  traffic_light_status TEXT CHECK (traffic_light_status IN ('red', 'yellow', 'green', 'none')),
  lane_count INTEGER DEFAULT 1,
  accuracy REAL DEFAULT 0.0 CHECK (accuracy >= 0.0 AND accuracy <= 1.0),
  weather_condition TEXT CHECK (weather_condition IN ('sunny', 'cloudy', 'rainy', 'foggy', 'snowy')),
  traffic_density TEXT CHECK (traffic_density IN ('light', 'moderate', 'heavy')),
  scene_type TEXT CHECK (scene_type IN ('highway', 'urban', 'rural', 'suburban')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, frame_number)
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth is implemented yet)
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Anyone can create projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete projects" ON public.projects FOR DELETE USING (true);

CREATE POLICY "Anyone can view pipelines" ON public.pipelines FOR SELECT USING (true);
CREATE POLICY "Anyone can create pipelines" ON public.pipelines FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pipelines" ON public.pipelines FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pipelines" ON public.pipelines FOR DELETE USING (true);

CREATE POLICY "Anyone can view sequences" ON public.sequences FOR SELECT USING (true);
CREATE POLICY "Anyone can create sequences" ON public.sequences FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sequences" ON public.sequences FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete sequences" ON public.sequences FOR DELETE USING (true);

CREATE POLICY "Anyone can view frames" ON public.frames FOR SELECT USING (true);
CREATE POLICY "Anyone can create frames" ON public.frames FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update frames" ON public.frames FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete frames" ON public.frames FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON public.pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sequences_updated_at
  BEFORE UPDATE ON public.sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_frames_updated_at
  BEFORE UPDATE ON public.frames
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.projects (name, description, status) VALUES 
('Urban Traffic Analysis', 'Comprehensive analysis of urban traffic patterns and vehicle detection', 'active'),
('Highway Safety Study', 'Large-scale highway traffic monitoring for safety improvements', 'active'),
('Pedestrian Behavior Research', 'Study of pedestrian crossing patterns in city centers', 'completed');

INSERT INTO public.pipelines (project_id, name, description, status) VALUES 
((SELECT id FROM public.projects WHERE name = 'Urban Traffic Analysis'), 'City Center Pipeline', 'Processing traffic data from downtown intersections', 'active'),
((SELECT id FROM public.projects WHERE name = 'Urban Traffic Analysis'), 'Residential Areas Pipeline', 'Analysis of traffic in residential neighborhoods', 'pending'),
((SELECT id FROM public.projects WHERE name = 'Highway Safety Study'), 'Highway Main Lane Pipeline', 'Primary highway traffic analysis', 'active');

INSERT INTO public.sequences (pipeline_id, name, status, fps, duration, total_frames, scene_type, weather_condition, traffic_density) VALUES 
((SELECT id FROM public.pipelines WHERE name = 'City Center Pipeline'), 'Intersection Morning Rush', 'processed', 30.0, 120.0, 3600, 'urban', 'sunny', 'heavy'),
((SELECT id FROM public.pipelines WHERE name = 'City Center Pipeline'), 'Evening Traffic Flow', 'processing', 25.0, 90.0, 2250, 'urban', 'cloudy', 'moderate'),
((SELECT id FROM public.pipelines WHERE name = 'Highway Main Lane Pipeline'), 'Highway Segment A', 'processed', 30.0, 180.0, 5400, 'highway', 'sunny', 'light');