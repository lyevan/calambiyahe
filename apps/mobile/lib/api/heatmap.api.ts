import { apiClient } from './client';
import { ApiResponse } from '../types/api.types';

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  count: number;
}

export interface HeatmapData {
  route_id: string;
  route_code: string;
  points: HeatmapPoint[];
  generated_at: string;
}

export const heatmapApi = {
  getHeatmapForRoute: async (route_id: string): Promise<HeatmapData> => {
    const res = await apiClient.get<any, ApiResponse<HeatmapData>>(`/heatmap/${route_id}`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  }
};
