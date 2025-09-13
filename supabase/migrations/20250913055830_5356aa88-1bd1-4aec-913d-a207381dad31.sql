-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'reviewer', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'viewer'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id to existing tables and update RLS policies
ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.pipelines ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sequences ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.frames ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing data to have a user_id (temporary for migration)
UPDATE public.projects SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.pipelines SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.sequences SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.frames SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Make user_id required
ALTER TABLE public.projects ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.pipelines ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.sequences ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.frames ALTER COLUMN user_id SET NOT NULL;

-- DROP existing dangerous policies
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can create projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can update projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can delete projects" ON public.projects;

DROP POLICY IF EXISTS "Anyone can view pipelines" ON public.pipelines;
DROP POLICY IF EXISTS "Anyone can create pipelines" ON public.pipelines;
DROP POLICY IF EXISTS "Anyone can update pipelines" ON public.pipelines;
DROP POLICY IF EXISTS "Anyone can delete pipelines" ON public.pipelines;

DROP POLICY IF EXISTS "Anyone can view sequences" ON public.sequences;
DROP POLICY IF EXISTS "Anyone can create sequences" ON public.sequences;
DROP POLICY IF EXISTS "Anyone can update sequences" ON public.sequences;
DROP POLICY IF EXISTS "Anyone can delete sequences" ON public.sequences;

DROP POLICY IF EXISTS "Anyone can view frames" ON public.frames;
DROP POLICY IF EXISTS "Anyone can create frames" ON public.frames;
DROP POLICY IF EXISTS "Anyone can update frames" ON public.frames;
DROP POLICY IF EXISTS "Anyone can delete frames" ON public.frames;

-- Secure RLS policies for projects
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

-- Secure RLS policies for pipelines
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

-- Secure RLS policies for sequences
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

-- Secure RLS policies for frames
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

-- Secure storage policies (replace existing dangerous ones)
DROP POLICY IF EXISTS "Anyone can view sequence images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload sequence images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update sequence images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete sequence images" ON storage.objects;

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
CREATE TABLE public.audit_logs (
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

-- Add audit triggers
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