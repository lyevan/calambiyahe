import { aiRepository } from "./ai.repository";
import { geminiClient } from "../../lib/gemini.client";
import {
  RerouteInput,
  TravelTipsInput,
  HazardAnalysisInput,
  RouteInput,
} from "./ai.validation";
import {
  RerouteSuggestionDTO,
  TravelTipsDTO,
  HazardAnalysisDTO,
  HazardSeverity,
  GeminiRerouteRaw,
  GeminiTravelTipsRaw,
  GeminiHazardAnalysisRaw,
  RouteResponseDTO,
  GeminiRouteRaw,
} from "./ai.types";
import { hazardsRepository } from "../hazards/hazards.repository";

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

/**
 * Fetches an image from a URL and converts it to base64.
 */
async function urlToBase64(
  url: string,
): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  return {
    base64: buffer.toString("base64"),
    mimeType: mimeType as any,
  };
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
    let hazardZone = await aiRepository.getHazardZoneById(input.hazardZoneId);

    // Fallback to direct hazard report if no zone found
    if (!hazardZone) {
      hazardZone = await aiRepository.getHazardReportById(input.hazardZoneId);
    }

    const [currentRoute, allRoutes] = await Promise.all([
      aiRepository.getRouteById(input.currentRouteId),
      aiRepository.getAllRoutes(),
    ]);

    if (!hazardZone) {
      throw new Error(`Hazard context not found for ID: ${input.hazardZoneId}`);
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
    const suggestion = await geminiClient.generateJson<GeminiRerouteRaw>(
      "You are CalamBiyahe, a road safety and transport assistant for Calamba City, Laguna, Philippines.",
      prompt,
    );

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
  "tips": ["<tip 1 make it into tagalog where locals can understand>", "<tip 2 make it into tagalog where locals can understand>", "<tip 3 make it into tagalog where locals can understand>"],
  "recommendedRouteCode": "<CAL-XX or null if not applicable make it into tagalog where locals can understand>",
  "fareEstimate": "<e.g. PHP 13â€“15 or null if unknown make it into tagalog where locals can understand>",
  "bestTimeToTravel": "<e.g. Before 7:00 AM or After 8:00 PM or null make it into tagalog where locals can understand>"
}`;

    // 3. Call Gemini
    const tips = await geminiClient.generateJson<GeminiTravelTipsRaw>(
      "You are CalamBiyahe, a local transport assistant for Calamba City, Laguna, Philippines.",
      prompt,
    );

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
    let base64 = input.imageBase64;
    let mime = input.mimeType;

    // 1. If reportId is provided instead of direct base64, fetch the image
    if (input.reportId && !base64) {
      const report = await hazardsRepository.getReportById(input.reportId);
      if (!report || !report.image_url) {
        throw new Error(
          `Hazard report ${input.reportId} not found or has no image`,
        );
      }

      // Construct full URL if relative
      let imageUrl = report.image_url.startsWith("http")
        ? report.image_url
        : `${process.env.BASE_URL || "http://localhost:3000"}${report.image_url}`;

      // OPTIMIZATION: If it's a Cloudinary URL, request a smaller, optimized version
      if (imageUrl.includes("res.cloudinary.com")) {
        imageUrl = imageUrl.replace(
          "/upload/",
          "/upload/w_1000,q_auto,f_auto/",
        );
      }

      const fetched = await urlToBase64(imageUrl);
      base64 = fetched.base64;
      mime = fetched.mimeType as any;
    }

    if (!base64 || !mime) {
      throw new Error("Missing image data or reportId for AI analysis");
    }

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
  "description": "<1â€“2 sentence objective description of what is visible make it into tagalog where locals can understand>",
  "recommendedAction": "<1 sentence instruction for drivers and commuters and make it into tagalog where locals can understand>",
  "confidence": <0.0 to 1.0>
}`;

    // 2. Call Gemini Vision
    const rawText = await geminiClient.generateVisionText(prompt, base64, mime);

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

  /**
   * POST /api/v1/ai/route
   *
   * 1. Fetches OSRM baseline route.
   * 2. Gathers active Calamba hazards.
   * 3. Asks Gemini to refine the duration/ETA and give safe-driving advice.
   */
  async getAiRoute(input: RouteInput): Promise<RouteResponseDTO> {
    try {
      // 1. Fetch OSRM Baseline (with alternatives)
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${input.originLng},${input.originLat};${input.destLng},${input.destLat}?overview=full&geometries=geojson&alternatives=true`;

      let osrmRes: any;
      try {
        const response = await fetch(osrmUrl);
        osrmRes = await response.json();
      } catch (err) {
        throw new Error(
          `OSRM fetch failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      if (osrmRes.code !== "Ok" || !osrmRes.routes?.[0]) {
        throw new Error(`OSRM Error: ${osrmRes.message || "No route found"}`);
      }

      const routes = osrmRes.routes; // multiple routes if alternatives=true

      // 2. Gather Hazards for Context
      const confirmedHazards =
        await hazardsRepository.getAllReports("confirmed");
      const hazardList = confirmedHazards
        .map(
          (h) =>
            `- ${h.type} at (${h.lat}, ${h.lng})${
              h.description ? `: ${h.description}` : ""
            }`,
        )
        .join("\n");

      // 3. Build Gemini Prompt
      const routeSummary = routes
        .map(
          (r: any, i: number) =>
            `Route ${i + 1}: ${Math.round(r.distance)}m, ${Math.round(r.duration)}s baseline`,
        )
        .join("\n");

      const prompt = `You are CalamBiyahe, an AI traffic and route assistant for Calamba City, Philippines.

A driver requested a route:
- Origin: (${input.originLat}, ${input.originLng})
- Destination: (${input.destLat}, ${input.destLng})

Baseline routes from OSRM:
${routeSummary}

Direct hazards reported in Calamba City right now:
${hazardList || "No major hazards confirmed."}

Task:
Refine the estimated duration for EACH route based on these hazards and typical Calamba traffic patterns.
Philippines traffic in urban areas like Calamba is often slow. Baseline OSRM times are usually too optimistic.
Factor in:
1. Hazards directly on or near the route.
2. Typical traffic congestion (increase duration by 20-50% if in urban zones).
3. If a route has hazards, increase duration significantly or advise against it.

Respond ONLY with a valid JSON object:
{
  "refinedRoutes": [
    {
      "refinedDuration": <number_in_seconds>,
      "message": "<1-2 sentence instruction/warning make it into tagalog where locals can understand>",
      "hazardsEncountered": <number_of_hazards_near_route>
    },
    ... (one for each input route)
  ]
}`;

      // 4. Call Gemini using structured JSON output
      const parsed = await geminiClient.generateJson<GeminiRouteRaw>(
        "You are CalamBiyahe, an AI traffic and route assistant for Calamba City, Philippines.",
        prompt,
      );

      // Map Gemini refinements back to OSRM routes
      const refinedRoutes = routes.map((r: any, i: number) => {
        const ref = parsed?.refinedRoutes?.[i] || {
          refinedDuration: r.duration * 1.3, // Default fallback: 30% increase for traffic
          message: "Be careful of typical traffic in this area.",
          hazardsEncountered: 0,
        };

        return {
          distance: r.distance,
          duration: ref.refinedDuration,
          geometry: r.geometry,
          message: ref.message,
          hazardsEncountered: ref.hazardsEncountered,
        };
      });

      return {
        routes: refinedRoutes,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error("AI Routing Service Error:", err);
      throw err;
    }
  },
};
