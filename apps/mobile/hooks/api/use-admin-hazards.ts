import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';

export type HazardReport = {
  report_id: string;
  type: string;
  severity: string;
  description: string;
  image_url: string | null;
  lat: string;
  lng: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
};

export const useAdminHazards = () => {
  return useQuery({
    queryKey: ['admin', 'hazards'],
    queryFn: async () => {
      const response = await apiClient.get<HazardReport[]>('/hazards?status=all');
      return response.data;
    },
    refetchInterval: 10000,
  });
};

export const useUpdateHazardStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/hazards/${id}/status`, { status });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'hazards'] });
      const previousHazards = queryClient.getQueryData<HazardReport[]>(['admin', 'hazards']);
      queryClient.setQueryData(['admin', 'hazards'], (old: HazardReport[] | undefined) =>
        old?.map(h => h.report_id === id ? { ...h, status } : h) as HazardReport[]
      );
      return { previousHazards };
    },
    onError: (err, variables, context) => {
      if (context?.previousHazards) {
        queryClient.setQueryData(['admin', 'hazards'], context.previousHazards);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'hazards'] });
      queryClient.invalidateQueries({ queryKey: ['hazards'] });
    },
  });
};

export const useDeleteHazard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/hazards/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'hazards'] });
      const previousHazards = queryClient.getQueryData<HazardReport[]>(['admin', 'hazards']);
      queryClient.setQueryData(['admin', 'hazards'], (old: HazardReport[] | undefined) =>
        old?.filter(h => h.report_id !== id)
      );
      return { previousHazards };
    },
    onError: (err, id, context) => {
      if (context?.previousHazards) {
        queryClient.setQueryData(['admin', 'hazards'], context.previousHazards);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'hazards'] });
      queryClient.invalidateQueries({ queryKey: ['hazards'] });
    },
  });
};
