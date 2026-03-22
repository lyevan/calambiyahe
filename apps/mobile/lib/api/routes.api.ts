import { apiClient } from './client';
import { ApiResponse } from '../types/api.types';

export interface Waypoint {
  waypoint_id: string;
  route_id: string;
  sequence: number;
  lat: string;
  lng: string;
  label?: string | null;
  is_key_stop: boolean;
}

export interface WaypointInput {
  sequence: number;
  lat: number;
  lng: number;
  label?: string;
  is_key_stop: boolean;
}

export interface Route {
  route_id: string;
  name: string;
  code: string;
  is_active: boolean;
  waypoints?: Waypoint[];
  polyline?: string | null;
}

export const routesApi = {
  /** Public list (active only). Pass all=true for admin to get all routes. */
  getRoutes: async (all = false): Promise<Route[]> => {
    const endpoint = all ? '/admin/routes' : '/routes';
    const res = await apiClient.get<any, ApiResponse<Route[]>>(endpoint);
    if (!res.success) throw new Error(res.error);
    return res.data;
  },

  getRouteById: async (id: string): Promise<Route> => {
    const res = await apiClient.get<any, ApiResponse<Route>>(`/routes/${id}`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  },

  createRoute: async (data: { name: string; code: string; polyline?: string }): Promise<Route> => {
    const res = await apiClient.post<any, ApiResponse<Route>>('/admin/routes', data);
    if (!res.success) throw new Error(res.error);
    return res.data;
  },

  updateRoute: async (id: string, data: { name?: string; is_active?: boolean; polyline?: string }): Promise<Route> => {
    const res = await apiClient.patch<any, ApiResponse<Route>>(`/admin/routes/${id}`, data);
    if (!res.success) throw new Error(res.error);
    return res.data;
  },

  /** Replace all waypoints for a route in one call (PUT). */
  bulkUpdateWaypoints: async (routeId: string, waypoints: WaypointInput[]): Promise<Waypoint[]> => {
    const res = await apiClient.put<any, ApiResponse<Waypoint[]>>(
      `/admin/routes/${routeId}/waypoints`,
      waypoints,
    );
    if (!res.success) throw new Error(res.error);
    return res.data;
  },
  
  deleteRoute: async (id: string): Promise<void> => {
    const res = await apiClient.delete<any, ApiResponse<void>>(`/admin/routes/${id}`);
    if (!res.success) throw new Error(res.error);
  },
};
