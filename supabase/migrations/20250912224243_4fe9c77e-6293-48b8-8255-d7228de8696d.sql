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