import { aiRepository } from "./ai.repository";
import { geminiClient } from "../../lib/gemini.client";
import {
  RerouteInput,
  TravelTipsInput,
  HazardAnalysisInput,
} from "./ai.validation";
import {
  RerouteSuggestionDTO,
  TravelTipsDTO,
  HazardAnalysisDTO,
  HazardSeverity,
  GeminiRerouteRaw,
  GeminiTravelTipsRaw,
  GeminiHazardAnalysisRaw,
} from "./ai.types";

// â”€â”€â”€ Utility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Safely parse a Gemini text response as JSON.
 * Strips markdown code fences Gemini sometimes wraps output in.
 */
function parseGeminiJson<T>(raw: string): T | null {
  try {
    const clean = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();
    return JSON.parse(clean) as T;
  } catch {
    return null;
  }
}

// â”€â”€â”€ AI Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const aiService = {
  /**
   * POST /api/v1/ai/reroute
   *
   * Fetches hazard zone + all available Calamba routes, then asks Gemini
   * to suggest an alternative route for a driver approaching the hazard.
   */
  async getRerouteSuggestion(
    input: RerouteInput,
  ): Promise<RerouteSuggestionDTO> {
    // 1. Gather context from DB
    const [hazardZone, currentRoute, allRoutes] = await Promise.all([
      aiRepository.getHazardZoneById(input.hazardZoneId),
      aiRepository.getRouteById(input.currentRouteId),
      aiRepository.getAllRoutes(),
    ]);

    if (!hazardZone) {
      throw new Error(`Hazard zone not found: ${input.hazardZoneId}`);
    }

    const routeList = allRoutes
      .map(
        (r) =>
          `- ${r.routeCode}` +
          (r.fromTerminal && r.toTerminal
            ? `: ${r.fromTerminal} â†’ ${r.toTerminal}`
            : "") +
          (r.keyStops && r.keyStops.length > 0
            ? ` (via ${r.keyStops.join(", ")})`
            : ""),
      )
      .join("\n");

    const currentRouteLabel = currentRoute
      ? `${currentRoute.routeCode}${
          currentRoute.fromTerminal && currentRoute.toTerminal
            ? ` â€” ${currentRoute.fromTerminal} â†’ ${currentRoute.toTerminal}`
            : ""
        }`
      : "Unknown";

    // 2. Build Gemini prompt
    const prompt = `You are CalamBiyahe, a road safety and transport assistant for Calamba City, Laguna, Philippines.

A road hazard has been reported ahead of a driver:
- Hazard Type: ${hazardZone.hazardType}
- Road: ${hazardZone.roadName}
- Severity: ${hazardZone.severity}
- Zone span: (${hazardZone.startLat}, ${hazardZone.startLng}) â†’ (${hazardZone.endLat}, ${hazardZone.endLng})

Driver details:
- Current route: ${currentRouteLabel}
- Current location: (${input.userLat}, ${input.userLng})

Available jeepney routes in Calamba City:
${routeList}

Task: Suggest a safe rerouting action. If no alternative route exists, advise the driver to proceed with caution or wait.
Keep instructions brief, practical, and specific to Calamba City roads.

Respond ONLY with a valid JSON object â€” no markdown, no explanation outside JSON:
{
  "suggestedRouteCode": "<CAL-XX or null if no alternative>",
  "message": "<1â€“2 sentence rerouting instruction in English or Filipino>",
  "alternativeSteps": ["<step 1>", "<step 2>", "<step 3 if needed>"]
}`;

    // 3. Call Gemini
    const rawText = await geminiClient.generateText(prompt);

    const parsed = parseGeminiJson<GeminiRerouteRaw>(rawText);

    // 4. Fallback if JSON parse fails
    const suggestion: GeminiRerouteRaw = parsed ?? {
      suggestedRouteCode: null,
      message: rawText || "Mag-ingat sa harap. Mabagal na magmaneho.",
      alternativeSteps: ["Proceed with caution through the hazard zone."],
    };

    return {
      hazardZoneId: input.hazardZoneId,
      suggestedRouteCode: suggestion.suggestedRouteCode,
      message: suggestion.message,
      severity: hazardZone.severity as HazardSeverity,
      alternativeSteps: suggestion.alternativeSteps,
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * POST /api/v1/ai/travel-tips
   *
   * Fetches nearby terminals + all routes, then asks Gemini to give
   * role-tailored commute tips for a Calamba City destination.
   */
  async getTravelTips(input: TravelTipsInput): Promise<TravelTipsDTO> {
    // 1. Gather context from DB
    const [nearbyTerminals, allRoutes] = await Promise.all([
      aiRepository.getNearbyTerminals(input.originLat, input.originLng),
      aiRepository.getAllRoutes(),
    ]);

    const terminalList =
      nearbyTerminals.length > 0
        ? nearbyTerminals
            .map((t) => `- ${t.name} (routes: ${t.routeCodes.join(", ")})`)
            .join("\n")
        : "- No terminals within 2 km. User may need to walk to a stop.";

    const routeList = allRoutes
      .map(
        (r) =>
          `- ${r.routeCode}` +
          (r.fromTerminal && r.toTerminal
            ? `: ${r.fromTerminal} â†’ ${r.toTerminal}`
            : "") +
          (r.keyStops && r.keyStops.length > 0
            ? ` (via ${r.keyStops.join(", ")})`
            : ""),
      )
      .join("\n");

    const roleDescriptions: Record<typeof input.role, string> = {
      commuter: "a daily public transport commuter",
      driver: "a jeepney driver doing route planning",
      private_driver: "a private vehicle driver avoiding traffic",
      citizen: "a concerned citizen navigating the city",
      guide: "a local guide helping visitors get around Calamba City",
    };

    // 2. Build Gemini prompt
    const prompt = `You are CalamBiyahe, a local transport assistant for Calamba City, Laguna, Philippines.

User profile: ${roleDescriptions[input.role]}
Origin coordinates: (${input.originLat}, ${input.originLng})
Destination: ${input.destinationLabel}

Nearby terminals/stops from origin:
${terminalList}

Available Calamba City jeepney routes:
${routeList}

Task: Provide practical, Calamba-specific travel advice for this user to reach their destination.
Consider typical Calamba traffic patterns, jeepney operations, and local knowledge.

Respond ONLY with a valid JSON object â€” no markdown, no explanation outside JSON:
{
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "recommendedRouteCode": "<CAL-XX or null if not applicable>",
  "fareEstimate": "<e.g. PHP 13â€“15 or null if unknown>",
  "bestTimeToTravel": "<e.g. Before 7:00 AM or After 8:00 PM or null>"
}`;

    // 3. Call Gemini
    const rawText = await geminiClient.generateText(prompt);

    const parsed = parseGeminiJson<GeminiTravelTipsRaw>(rawText);

    const tips: GeminiTravelTipsRaw = parsed ?? {
      tips: [rawText || "Check with locals for the best jeepney to take."],
      recommendedRouteCode: null,
      fareEstimate: null,
      bestTimeToTravel: null,
    };

    return {
      tips: tips.tips,
      recommendedRouteCode: tips.recommendedRouteCode,
      fareEstimate: tips.fareEstimate,
      bestTimeToTravel: tips.bestTimeToTravel,
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * POST /api/v1/ai/analyze-hazard
   *
   * Sends a base64 road photo to Gemini Vision for hazard classification.
   * Returns severity, hazard type, description, and recommended action.
   */
  async analyzeHazardPhoto(
    input: HazardAnalysisInput,
  ): Promise<HazardAnalysisDTO> {
    const prompt = `You are CalamBiyahe's road hazard detection system for Calamba City, Laguna, Philippines.

Analyze this road photograph and identify any road hazards present.
Photo location: (${input.lat}, ${input.lng}) â€” within Calamba City.
${input.reporterNote ? `Reporter's note: "${input.reporterNote}"` : ""}

Severity scale:
- low: Minor surface wear, hairline cracks, minimal road impact
- medium: Visible potholes (lubak) or damage affecting one lane
- high: Large potholes, flooding, or hazards affecting most of the road
- critical: Road impassable or immediately dangerous to all vehicles

Respond ONLY with a valid JSON object â€” no markdown, no explanation outside JSON:
{
  "severity": "<low | medium | high | critical>",
  "hazardType": "<pothole | lubak | flooding | construction | road damage | debris | other>",
  "description": "<1â€“2 sentence objective description of what is visible>",
  "recommendedAction": "<1 sentence instruction for drivers and commuters>",
  "confidence": <0.0 to 1.0>
}`;

    // 2. Call Gemini Vision
    const rawText = await geminiClient.generateVisionText(
      prompt,
      input.imageBase64,
      input.mimeType,
    );

    const parsed = parseGeminiJson<GeminiHazardAnalysisRaw>(rawText);

    const analysis: GeminiHazardAnalysisRaw = parsed ?? {
      severity: "medium",
      hazardType: "unknown",
      description:
        "Unable to fully parse hazard from image. Manual review recommended.",
      recommendedAction: "Proceed with caution and reduce speed.",
      confidence: 0.4,
    };

    return {
      severity: analysis.severity,
      hazardType: analysis.hazardType,
      description: analysis.description,
      recommendedAction: analysis.recommendedAction,
      // Clamp confidence to [0, 1]
      confidence: Math.min(1, Math.max(0, analysis.confidence)),
      generatedAt: new Date().toISOString(),
    };
  },
};
