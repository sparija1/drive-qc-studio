import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Frame {
  id: string;
  sequence_id: string;
  frame_number: number;
  timestamp_ms: number;
  image_url: string | null;
  vehicle_count: number | null;
  pedestrian_count: number | null;
  lane_count: number | null;
  scene_type: string | null;
  weather_condition: string | null;
  traffic_density: string | null;
  traffic_light_status: string | null;
  accuracy: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFrameData {
  sequence_id: string;
  frame_number: number;
  timestamp_ms: number;
  image_url?: string;
  vehicle_count?: number;
  pedestrian_count?: number;
  lane_count?: number;
  scene_type?: string;
  weather_condition?: string;
  traffic_density?: string;
  traffic_light_status?: string;
  accuracy?: number;
}

export interface UpdateFrameData {
  vehicle_count?: number;
  pedestrian_count?: number;
  lane_count?: number;
  scene_type?: string;
  weather_condition?: string;
  traffic_density?: string;
  traffic_light_status?: string;
  accuracy?: number;
}

export const useFramesBySequenceId = (sequenceId: string) => {
  return useQuery({
    queryKey: ['frames', sequenceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('frames')
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('frame_number', { ascending: true });
      
      if (error) throw error;
      return data as Frame[];
    },
    enabled: !!sequenceId,
  });
};

export const useCreateFrame = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (frameData: CreateFrameData) => {
      const { data, error } = await supabase
        .from('frames')
        .insert([frameData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['frames', data.sequence_id] });
      toast({
        title: "Success",
        description: "Frame created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create frame",
        variant: "destructive",
      });
      console.error('Error creating frame:', error);
    },
  });
};

export const useUpdateFrame = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFrameData }) => {
      const { data: updatedData, error } = await supabase
        .from('frames')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['frames', data.sequence_id] });
      toast({
        title: "Success",
        description: "Frame updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update frame",
        variant: "destructive",
      });
      console.error('Error updating frame:', error);
    },
  });
};

export const useDeleteFrame = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('frames')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frames'] });
      toast({
        title: "Success",
        description: "Frame deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete frame",
        variant: "destructive",
      });
      console.error('Error deleting frame:', error);
    },
  });
};

export const useDeleteFramesBySequence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sequenceId: string) => {
      const { error } = await supabase
        .from('frames')
        .delete()
        .eq('sequence_id', sequenceId);
      
      if (error) throw error;
      return sequenceId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frames'] });
    },
    onError: (error) => {
      console.error('Error deleting frames:', error);
    },
  });
};