-- Update RLS policies to allow all authenticated users to view all data
-- while maintaining ownership for modifications

-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own pipelines" ON public.pipelines;
DROP POLICY IF EXISTS "Users can view their own sequences" ON public.sequences;
DROP POLICY IF EXISTS "Users can view their own frames" ON public.frames;

-- Create new permissive SELECT policies for all authenticated users
CREATE POLICY "All authenticated users can view all projects" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can view all pipelines" 
ON public.pipelines 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can view all sequences" 
ON public.sequences 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can view all frames" 
ON public.frames 
FOR SELECT 
TO authenticated
USING (true);

-- Keep existing ownership-based policies for INSERT/UPDATE/DELETE operations
-- These ensure users can only modify their own data