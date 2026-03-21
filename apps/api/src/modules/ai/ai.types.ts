// ─── Domain Types ────────────────────────────────────────────────────────────

export type UserRole =
  | "commuter"
  | "driver"
  | "private_driver"
  | "citizen"
  | "guide";

export type HazardSeverity = "low" | "medium" | "high" | "critical";

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface RerouteRequestDTO {
  hazardZoneId: string;
  userLat: number;
  userLng: number;
  currentRouteId: string;
}

export interface TravelTipsRequestDTO {
  originLat: number;
  originLng: number;
  destinationLabel: string;
  role: UserRole;
}

export interface HazardAnalysisRequestDTO {
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  lat: number;
  lng: number;
  reporterNote?: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface RerouteSuggestionDTO {
  hazardZoneId: string;
  suggestedRouteCode: string | null;
  message: string;
  severity: HazardSeverity;
  alternativeSteps: string[];
  generatedAt: string;
}

export interface TravelTipsDTO {
  tips: string[];
  recommendedRouteCode: string | null;
  fareEstimate: string | null;
  bestTimeToTravel: string | null;
  generatedAt: string;
}

export interface HazardAnalysisDTO {
  severity: HazardSeverity;
  hazardType: string;
  description: string;
  recommendedAction: string;
  confidence: number;
  generatedAt: string;
}

// ─── Internal Context Types (used by repository → service) ───────────────────

export interface HazardZoneContext {
  zoneId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  hazardType: string;
  severity: HazardSeverity;
  roadName: string | null;
}

export interface RouteContext {
  routeId: string;
  routeCode: string;
  fromTerminal: string | null;
  toTerminal: string | null;
  keyStops: string[];
}

export interface TerminalContext {
  terminalId: string;
  name: string;
  lat: number;
  lng: number;
  routeCodes: string[];
}

// ─── Gemini Raw JSON Shapes ───────────────────────────────────────────────────
// These are the expected raw parsed shapes from Gemini responses before mapping.

export interface GeminiRerouteRaw {
  suggestedRouteCode: string | null;
  message: string;
  alternativeSteps: string[];
}

export interface GeminiTravelTipsRaw {
  tips: string[];
  recommendedRouteCode: string | null;
  fareEstimate: string | null;
  bestTimeToTravel: string | null;
}

export interface GeminiHazardAnalysisRaw {
  severity: HazardSeverity;
  hazardType: string;
  description: string;
  recommendedAction: string;
  confidence: number;
}
