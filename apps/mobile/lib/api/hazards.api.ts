import { apiClient } from './client';
import { ApiResponse } from '../types/api.types';

export interface Hazard {
  report_id: string;
  type: string;
  description?: string;
  lat: number;
  lng: number;
  status: string;
  severity: string;
  image_url?: string;
  confirmation_count: number;
  created_at: string;
}

export interface HazardAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  hazardType: string;
  description: string;
  recommendedAction: string;
  confidence: number;
  generatedAt: string;
}

export const hazardsApi = {
  create: async (formData: FormData): Promise<Hazard> => {
    const res = await apiClient.post<any, ApiResponse<Hazard>>('/hazards', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!res.success) throw new Error(res.error);
    return res.data;
  },

  list: async (): Promise<Hazard[]> => {
    const res = await apiClient.get<any, ApiResponse<Hazard[]>>('/hazards');
    if (!res.success) throw new Error(res.error);
    return res.data;
  },

  confirm: async (id: string): Promise<any> => {
    const res = await apiClient.post<any, ApiResponse<any>>(`/hazards/${id}/confirm`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  },

  /**
   * Sends a hazard photo to Gemini for AI analysis.
   */
  analyze: async (
    imageBase64: string,
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
    location: { lat: number; lng: number },
    reporterNote?: string,
    reportId?: string
  ): Promise<HazardAnalysis> => {
    const res = await apiClient.post<any, ApiResponse<HazardAnalysis>>('/ai/analyze-hazard', {
      imageBase64,
      mimeType,
      lat: location.lat,
      lng: location.lng,
      reporterNote,
      reportId,
    });
    if (!res.success) throw new Error(res.error);
    return res.data;
  }
};
