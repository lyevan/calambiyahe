import { apiClient } from './client';
import { ApiResponse } from '../types/api.types';

export interface GpsSignal {
  signal_id: string;
  user_id: string;
  route_id: string;
  lat: number;
  lng: number;
  role: 'commuter' | 'driver';
  emitted_at: string;
}

export const gpsApi = {
  broadcast: async (data: { route_id: string; lat: number; lng: number }): Promise<GpsSignal> => {
    const res = await apiClient.post<any, ApiResponse<GpsSignal>>('/gps/broadcast', data);
    if (!res.success) throw new Error(res.error);
    return res.data;
  },
  
  getSignals: async (route_id: string): Promise<GpsSignal[]> => {
    try {
      const res = await apiClient.get<any, ApiResponse<GpsSignal[]>>(`/gps/signals/${route_id}`);
      if (!res.success) return [];
      return res.data;
    } catch {
      return [];
    }
  },

  startDriverRoute: async (route_id: string): Promise<any> => {
    const res = await apiClient.post<any, ApiResponse<any>>('/gps/driver/start-route', { route_id });
    if (!res.success) throw new Error(res.error);
    return res.data;
  },

  endDriverRoute: async (): Promise<any> => {
    const res = await apiClient.post<any, ApiResponse<any>>('/gps/driver/end-route');
    if (!res.success) throw new Error(res.error);
    return res.data;
  }
};
