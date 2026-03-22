import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';

export type Terminal = {
  terminal_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: 'pending' | 'confirmed' | 'rejected';
};

export const useTerminals = () => {
  return useQuery({
    queryKey: ['terminals'],
    queryFn: async () => {
      const response = await apiClient.get<Terminal[]>('/terminals');
      return response.data;
    },
  });
};

export type WaitingSpot = {
  spot_id: string;
  terminal_id: string;
  route_id: string;
  label: string;
  lat: number;
  lng: number;
  status: 'pending' | 'confirmed' | 'rejected';
};

export const useSpots = () => {
  return useQuery({
    queryKey: ['spots'],
    queryFn: async () => {
      const response = await apiClient.get<WaitingSpot[]>('/terminals/all-spots');
      return response.data;
    },
  });
};
