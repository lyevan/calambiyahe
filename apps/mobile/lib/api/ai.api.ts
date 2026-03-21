import { apiClient } from "./client";
import * as FileSystem from "expo-file-system";

// ─── AI API Types (Mobile-side mirror of API DTOs) ────────────────────────────

export interface RerouteRequest {
  hazardZoneId: string;
  userLat: number;
  userLng: number;
  currentRouteId: string;
}

export interface RerouteSuggestion {
  hazardZoneId: string;
  suggestedRouteCode: string | null;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  alternativeSteps: string[];
  generatedAt: string;
}

export interface TravelTipsRequest {
  originLat: number;
  originLng: number;
  destinationLabel: string;
  role: "commuter" | "driver" | "private_driver" | "citizen" | "guide";
}

export interface TravelTips {
  tips: string[];
  recommendedRouteCode: string | null;
  fareEstimate: string | null;
  bestTimeToTravel: string | null;
  generatedAt: string;
}

export interface HazardAnalysisRequest {
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  lat: number;
  lng: number;
  reporterNote?: string;
}

export interface HazardAnalysis {
  severity: "low" | "medium" | "high" | "critical";
  hazardType: string;
  description: string;
  recommendedAction: string;
  confidence: number;
  generatedAt: string;
}

// ─── AI API Functions ─────────────────────────────────────────────────────────

/**
 * Fetch an AI-generated rerouting suggestion for a hazard zone.
 * Used by: driver route screen, private-driver map.
 */
export async function fetchRerouteSuggestion(
  payload: RerouteRequest,
): Promise<RerouteSuggestion> {
  const { data } = await apiClient.post<{
    success: boolean;
    data: RerouteSuggestion;
  }>("/ai/reroute", payload);
  return data.data;
}

/**
 * Fetch AI-generated travel tips for a Calamba City destination.
 * Used by: commuter guide screen, local guide directions screen.
 */
export async function fetchTravelTips(
  payload: TravelTipsRequest,
): Promise<TravelTips> {
  const { data } = await apiClient.post<{ success: boolean; data: TravelTips }>(
    "/ai/travel-tips",
    payload,
  );
  return data.data;
}

/**
 * Send a base64 road photo to the API for AI hazard classification.
 * Used by: citizen report screen — call before/after submitting the hazard form.
 *
 * @param imageUri - Expo ImagePicker or Camera URI (file:// path)
 * @param mimeType - Image MIME type from picker result
 * @param lat      - GPS lat of photo location
 * @param lng      - GPS lng of photo location
 * @param note     - Optional reporter note
 */
export async function analyzeHazardPhoto(
  imageUri: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp",
  lat: number,
  lng: number,
  note?: string,
): Promise<HazardAnalysis> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (!base64 || !base64.trim()) {
    throw new Error("Failed to read image as base64 from imageUri");
  }

  const { data } = await apiClient.post<{
    success: boolean;
    data: HazardAnalysis;
  }>("/ai/analyze-hazard", {
    imageBase64: base64,
    mimeType,
    lat,
    lng,
    reporterNote: note,
  } satisfies HazardAnalysisRequest);

  return data.data;
}
