-- Create storage bucket for sequence images
INSERT INTO storage.buckets (id, name, public) VALUES ('sequence-images', 'sequence-images', true);

-- Create storage policies for sequence images
CREATE POLICY "Anyone can view sequence images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'sequence-images');

CREATE POLICY "Anyone can upload sequence images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'sequence-images');

CREATE POLICY "Anyone can update sequence images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'sequence-images');

CREATE POLICY "Anyone can delete sequence images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'sequence-images');

-- Add foreign key constraint from frames to sequences
ALTER TABLE frames ADD CONSTRAINT frames_sequence_id_fkey 
FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE;

-- Add foreign key constraint from sequences to pipelines  
ALTER TABLE sequences ADD CONSTRAINT sequences_pipeline_id_fkey 
FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE;

-- Add foreign key constraint from pipelines to projects
ALTER TABLE pipelines ADD CONSTRAINT pipelines_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Add trigger for sequences updated_at
CREATE TRIGGER update_sequences_updated_at
BEFORE UPDATE ON sequences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for pipelines updated_at  
CREATE TRIGGER update_pipelines_updated_at
BEFORE UPDATE pipelines
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for frames updated_at
CREATE TRIGGER update_frames_updated_at
BEFORE UPDATE ON frames
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();