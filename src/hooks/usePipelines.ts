import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Pipeline {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: 'pending' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreatePipelineData {
  project_id: string;
  name: string;
  description?: string;
}

export const usePipelinesByProjectId = (projectId: string) => {
  return useQuery({
    queryKey: ['pipelines', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Pipeline[];
    },
    enabled: !!projectId,
  });
};

export const useCreatePipeline = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pipelineData: CreatePipelineData) => {
      const { data, error } = await supabase
        .from('pipelines')
        .insert([pipelineData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', data.project_id] });
      toast({
        title: "Success",
        description: "Pipeline created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create pipeline",
        variant: "destructive",
      });
      console.error('Error creating pipeline:', error);
    },
  });
};

export const useDeletePipeline = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pipelines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({
        title: "Success",
        description: "Pipeline deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete pipeline",
        variant: "destructive",
      });
      console.error('Error deleting pipeline:', error);
    },
  });
};

export const usePipelineById = (id: string) => {
  return useQuery({
    queryKey: ['pipeline', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Pipeline;
    },
    enabled: !!id,
  });
};