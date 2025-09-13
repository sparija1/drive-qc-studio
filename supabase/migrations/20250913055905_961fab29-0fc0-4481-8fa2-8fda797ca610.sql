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

-- Add user_id to existing tables as nullable first
ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.pipelines ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sequences ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.frames ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- DROP existing dangerous policies first
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

-- Create temporary admin-only policies to lock down data during migration
CREATE POLICY "Temporary admin only access to projects" 
ON public.projects 
FOR ALL 
USING (false);

CREATE POLICY "Temporary admin only access to pipelines" 
ON public.pipelines 
FOR ALL 
USING (false);

CREATE POLICY "Temporary admin only access to sequences" 
ON public.sequences 
FOR ALL 
USING (false);

CREATE POLICY "Temporary admin only access to frames" 
ON public.frames 
FOR ALL 
USING (false);

-- Secure storage policies (replace existing dangerous ones)
DROP POLICY IF EXISTS "Anyone can view sequence images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload sequence images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update sequence images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete sequence images" ON storage.objects;

-- Lockdown storage during migration
CREATE POLICY "Temporary admin only access to storage"
ON storage.objects FOR ALL
USING (false);