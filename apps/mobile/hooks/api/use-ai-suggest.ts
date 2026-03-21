import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRerouteSuggestion,
  fetchTravelTips,
  analyzeHazardPhoto,
  RerouteRequest,
  TravelTipsRequest,
} from '../api/ai.api';

// ─── Query Keys ───────────────────────────────────────────────────────────────
// Matches conventions defined in agent rules section 4.4

export const aiQueryKeys = {
  reroute: (hazardZoneId: string) => ['ai', 'suggest', hazardZoneId] as const,
  travelTips: (originLat: number, originLng: number, destination: string) =>
    ['ai', 'tips', originLat, originLng, destination] as const,
};

// ─── useRerouteSuggestion ─────────────────────────────────────────────────────

/**
 * Fetches an AI rerouting suggestion when a driver is near a hazard zone.
 * Query is DISABLED until all required params are available.
 *
 * staleTime: 60s — reroute advice is short-lived but not instant-changing.
 *
 * Usage (driver route screen):
 *   const { data, isLoading } = useRerouteSuggestion({
 *     hazardZoneId,
 *     userLat,
 *     userLng,
 *     currentRouteId,
 *   });
 */
export function useRerouteSuggestion(params: RerouteRequest | null) {
  return useQuery({
    queryKey: aiQueryKeys.reroute(params?.hazardZoneId ?? ''),
    queryFn: () => fetchRerouteSuggestion(params!),
    enabled:
      !!params &&
      !!params.hazardZoneId &&
      !!params.currentRouteId &&
      !!params.userLat &&
      !!params.userLng,
    staleTime: 60 * 1000, // 60 seconds
    retry: 1,
  });
}

// ─── useTravelTips ────────────────────────────────────────────────────────────

/**
 * Fetches AI-generated travel tips for a Calamba City destination.
 *
 * staleTime: 5 minutes — tips don't change frequently within a session.
 *
 * Usage (commuter guide / directions screen):
 *   const { data, isLoading } = useTravelTips({
 *     originLat,
 *     originLng,
 *     destinationLabel: 'SM City Calamba',
 *     role: 'commuter',
 *   });
 */
export function useTravelTips(params: TravelTipsRequest | null) {
  return useQuery({
    queryKey: aiQueryKeys.travelTips(
      params?.originLat ?? 0,
      params?.originLng ?? 0,
      params?.destinationLabel ?? '',
    ),
    queryFn: () => fetchTravelTips(params!),
    enabled:
      !!params &&
      !!params.originLat &&
      !!params.originLng &&
      !!params.destinationLabel &&
      !!params.role,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// ─── useAnalyzeHazardPhoto ────────────────────────────────────────────────────

/**
 * Mutation: sends a hazard photo for AI analysis before/after form submission.
 * Invalidates nothing — analysis is a fire-and-read operation, not cached state.
 *
 * Usage (citizen report screen):
 *   const { mutate, data, isPending } = useAnalyzeHazardPhoto();
 *
 *   mutate({
 *     imageUri: pickerResult.assets[0].uri,
 *     mimeType: 'image/jpeg',
 *     lat: currentLocation.coords.latitude,
 *     lng: currentLocation.coords.longitude,
 *     note: 'Malaking butas sa gitna',
 *   });
 */
export function useAnalyzeHazardPhoto() {
  return useMutation({
    mutationFn: ({
      imageUri,
      mimeType,
      lat,
      lng,
      note,
    }: {
      imageUri: string;
      mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
      lat: number;
      lng: number;
      note?: string;
    }) => analyzeHazardPhoto(imageUri, mimeType, lat, lng, note),
  });
}
