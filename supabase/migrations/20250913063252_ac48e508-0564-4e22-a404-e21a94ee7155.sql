-- Complete the secure RLS policies setup after authentication is implemented
-- First, let's drop the temporary lockdown policies
DROP POLICY IF EXISTS "Temporary admin only access to projects" ON public.projects;
DROP POLICY IF EXISTS "Temporary admin only access to pipelines" ON public.pipelines;
DROP POLICY IF EXISTS "Temporary admin only access to sequences" ON public.sequences;
DROP POLICY IF EXISTS "Temporary admin only access to frames" ON public.frames;
DROP POLICY IF EXISTS "Temporary admin only access to storage" ON storage.objects;

-- Create secure RLS policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create secure RLS policies for pipelines
CREATE POLICY "Users can view their own pipelines" 
ON public.pipelines 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pipelines" 
ON public.pipelines 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pipelines" 
ON public.pipelines 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pipelines" 
ON public.pipelines 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create secure RLS policies for sequences
CREATE POLICY "Users can view their own sequences" 
ON public.sequences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sequences" 
ON public.sequences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sequences" 
ON public.sequences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sequences" 
ON public.sequences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create secure RLS policies for frames
CREATE POLICY "Users can view their own frames" 
ON public.frames 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own frames" 
ON public.frames 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own frames" 
ON public.frames 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own frames" 
ON public.frames 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create secure storage policies
CREATE POLICY "Users can view their own sequence images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sequence-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own sequence images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sequence-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own sequence images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sequence-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own sequence images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sequence-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add additional columns for new features
ALTER TABLE public.frames ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review'));
ALTER TABLE public.frames ADD COLUMN IF NOT EXISTS confidence_score REAL DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0);
ALTER TABLE public.frames ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.sequences ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review'));
ALTER TABLE public.sequences ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their own records"
ON public.audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Create function to log changes
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_values)
    VALUES (auth.uid(), TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_values, new_values)
    VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, table_name, record_id, action, new_values)
    VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'create', to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Add audit triggers (drop existing first)
DROP TRIGGER IF EXISTS audit_projects_trigger ON public.projects;
DROP TRIGGER IF EXISTS audit_pipelines_trigger ON public.pipelines;
DROP TRIGGER IF EXISTS audit_sequences_trigger ON public.sequences;
DROP TRIGGER IF EXISTS audit_frames_trigger ON public.frames;

CREATE TRIGGER audit_projects_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_changes();

CREATE TRIGGER audit_pipelines_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pipelines
  FOR EACH ROW EXECUTE FUNCTION public.log_changes();

CREATE TRIGGER audit_sequences_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sequences
  FOR EACH ROW EXECUTE FUNCTION public.log_changes();

CREATE TRIGGER audit_frames_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.frames
  FOR EACH ROW EXECUTE FUNCTION public.log_changes();