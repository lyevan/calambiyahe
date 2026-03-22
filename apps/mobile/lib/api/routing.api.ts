import axios from 'axios';
import { apiClient } from './client';

export interface RouteOption {
  distance: number;
  duration: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat]
  };
  weight: number;
}

export interface AiRouteResponse {
  routes: {
    distance: number;
    duration: number;
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
    message: string;
    hazardsEncountered: number;
  }[];
  generatedAt: string;
}

export interface RerouteSuggestion {
  hazardZoneId: string;
  suggestedRouteCode: string | null;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  alternativeSteps: string[];
  generatedAt: string;
}

export interface TravelTips {
  tips: string[];
  recommendedRouteCode: string | null;
  fareEstimate: string | null;
  bestTimeToTravel: string | null;
  generatedAt: string;
}

export const routingApi = {
  /**
   * Fetches road-aware routes between multiple waypoints.
   * Returns multiple options if alternatives=true.
   */
  getRouteOptions: async (
    waypoints: { lat: number; lng: number }[],
    alternatives = true
  ): Promise<RouteOption[]> => {
    if (waypoints.length < 2) return [];

    const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}`;

    try {
      const response = await axios.get(url, {
        params: {
          overview: 'full',
          geometries: 'geojson', // simpler to parse than encoded polyline
          alternatives: alternatives,
        },
      });

      if (response.data?.code !== 'Ok') {
        throw new Error(response.data?.message || 'Routing error');
      }

      return response.data.routes as RouteOption[];
    } catch (error) {
      console.error('OSRM Routing Error:', error);
      return [];
    }
  },

  reverseGeocode: async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await axios.get(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
      const features = res.data.features;
      if (features.length > 0) {
        const p = features[0].properties;
        return p.name || p.street || p.district || 'Wayback Point';
      }
      return 'Via Point';
    } catch {
      return 'Via Point';
    }
  },

  /**
   * Fetches an AI-enhanced route from the CalamBiyahe API.
   * Considers confirmed hazards and provides a refined ETA.
   */
  getAiRoute: async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<AiRouteResponse | null> => {
    try {
      const response = await apiClient.post('/ai/route', {
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: destination.lat,
        destLng: destination.lng,
      });

      // apiClient returns response.data directly due to interceptor
      return (response as any).data as AiRouteResponse;
    } catch (error) {
      console.error('AI Routing Error:', error);
      return null;
    }
  },

  /**
   * Gets an AI reroute suggestion for a driver near a hazard.
   */
  getRerouteSuggestion: async (
    hazardZoneId: string,
    currentRouteId: string,
    userLocation: { lat: number; lng: number }
  ): Promise<RerouteSuggestion | null> => {
    try {
      const response = await apiClient.post('/ai/reroute', {
        hazardZoneId,
        currentRouteId,
        userLat: userLocation.lat,
        userLng: userLocation.lng,
      });
      return (response as any).data as RerouteSuggestion;
    } catch (error) {
      console.error('AI Reroute Error:', error);
      return null;
    }
  },

  /**
   * Gets AI travel tips for a destination.
   */
  getTravelTips: async (
    origin: { lat: number; lng: number },
    destinationLabel: string,
    role: string
  ): Promise<TravelTips | null> => {
    try {
      const response = await apiClient.post('/ai/travel-tips', {
        originLat: origin.lat,
        originLng: origin.lng,
        destinationLabel,
        role,
      });
      return (response as any).data as TravelTips;
    } catch (error) {
      console.error('AI Travel Tips Error:', error);
      return null;
    }
  }
};
