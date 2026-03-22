import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { Terminal } from './use-terminals';

export const useAdminTerminals = () => {
  return useQuery({
    queryKey: ['admin', 'terminals'],
    queryFn: async () => {
      const response = await apiClient.get<Terminal[]>('/terminals?status=all');
      return response.data;
    },
    refetchInterval: 10000,
  });
};

export const useAdminSpots = () => {
  return useQuery({
    queryKey: ['admin', 'spots'],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/terminals/all-spots?status=all');
      return response.data;
    },
    refetchInterval: 10000,
  });
};

export const useUpdateTerminalStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/terminals/${id}/status`, { status });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'terminals'] });
      const previousTerminals = queryClient.getQueryData<Terminal[]>(['admin', 'terminals']);
      queryClient.setQueryData(['admin', 'terminals'], (old: Terminal[] | undefined) =>
        old?.map(t => t.terminal_id === id ? { ...t, status } : t)
      );
      return { previousTerminals };
    },
    onError: (err, variables, context) => {
      if (context?.previousTerminals) {
        queryClient.setQueryData(['admin', 'terminals'], context.previousTerminals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'terminals'] });
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
    },
  });
};

export const useUpdateSpotStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/terminals/spots/${id}/status`, { status });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'spots'] });
      const previousSpots = queryClient.getQueryData<any[]>(['admin', 'spots']);
      queryClient.setQueryData(['admin', 'spots'], (old: any[] | undefined) =>
        old?.map(s => s.spot_id === id ? { ...s, status } : s)
      );
      return { previousSpots };
    },
    onError: (err, variables, context) => {
      if (context?.previousSpots) {
        queryClient.setQueryData(['admin', 'spots'], context.previousSpots);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'spots'] });
    },
  });
};

export const useDeleteTerminal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/terminals/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'terminals'] });
      const previousTerminals = queryClient.getQueryData<Terminal[]>(['admin', 'terminals']);
      queryClient.setQueryData(['admin', 'terminals'], (old: Terminal[] | undefined) =>
        old?.filter(t => t.terminal_id !== id)
      );
      return { previousTerminals };
    },
    onError: (err, id, context) => {
      if (context?.previousTerminals) {
        queryClient.setQueryData(['admin', 'terminals'], context.previousTerminals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'terminals'] });
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
    },
  });
};

export const useDeleteSpot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/terminals/spots/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'spots'] });
      const previousSpots = queryClient.getQueryData<any[]>(['admin', 'spots']);
      queryClient.setQueryData(['admin', 'spots'], (old: any[] | undefined) =>
        old?.filter(s => s.spot_id !== id)
      );
      return { previousSpots };
    },
    onError: (err, id, context) => {
      if (context?.previousSpots) {
        queryClient.setQueryData(['admin', 'spots'], context.previousSpots);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'spots'] });
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
    },
  });
};
