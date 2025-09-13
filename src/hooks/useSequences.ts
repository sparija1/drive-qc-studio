import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Sequence {
  id: string;
  pipeline_id: string;
  name: string;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  fps: number | null;
  duration: number | null;
  total_frames: number;
  scene_type: 'highway' | 'urban' | 'rural' | 'suburban' | null;
  weather_condition: 'sunny' | 'cloudy' | 'rainy' | 'foggy' | 'snowy' | null;
  traffic_density: 'light' | 'moderate' | 'heavy' | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSequenceData {
  pipeline_id: string;
  name: string;
}

export const useSequencesByPipelineId = (pipelineId: string) => {
  return useQuery({
    queryKey: ['sequences', pipelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sequences')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Sequence[];
    },
    enabled: !!pipelineId,
  });
};

export const useCreateSequence = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sequenceData: CreateSequenceData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sequences')
        .insert([{ ...sequenceData, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequences', data.pipeline_id] });
      toast({
        title: "Success",
        description: "Sequence created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create sequence",
        variant: "destructive",
      });
      console.error('Error creating sequence:', error);
    },
  });
};

export const useDeleteSequence = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sequences')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      toast({
        title: "Success",
        description: "Sequence deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete sequence",
        variant: "destructive",
      });
      console.error('Error deleting sequence:', error);
    },
  });
};

export const useSequenceById = (id: string) => {
  return useQuery({
    queryKey: ['sequence', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sequences')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Sequence;
    },
    enabled: !!id,
  });
};