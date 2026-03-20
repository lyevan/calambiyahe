import { aiRepository } from "./ai.repository";
import { geminiClient } from "../../lib/gemini.client";

type ServiceError = Error & { statusCode?: number };

function createServiceError(message: string, statusCode: number): ServiceError {
  const error = new Error(message) as ServiceError;
  error.statusCode = statusCode;
  return error;
}

interface RerouteResponse {
  summary: string;
  risk_level: "low" | "medium" | "high";
  recommendations: string[];
  cautions: string[];
}

interface TravelTipsResponse {
  summary: string;
  best_times: string[];
  avoid_times: string[];
  tips: string[];
}

const SYSTEM_PROMPT = `You are CalamBiyahe AI assistant for Calamba City, Laguna, Philippines only.
Rules:
1) Never provide advice outside Calamba city context.
2) Use concise, practical guidance for jeepney commuters/drivers.
3) Output strictly valid JSON only, no markdown.
4) If information is insufficient, say so clearly in summary and keep recommendations conservative.
5) Do not invent specific road closures unless provided in input context.`;

export const aiService = {
  async suggestReroute(userRole: string, payload: any) {
    if (userRole !== "driver") {
      throw createServiceError(
        "Only drivers can request reroute suggestions",
        403,
      );
    }

    const route = await aiRepository.getRouteContext(payload.route_id);
    if (!route || !route.is_active) {
      throw createServiceError("Route not found or inactive", 404);
    }

    const hazards = await aiRepository.getHazardContext(10);

    if (!geminiClient.isConfigured()) {
      const fallback: RerouteResponse = {
        summary:
          "Gemini is not configured. Using fallback: continue on active route and avoid recently reported hazard-prone streets.",
        risk_level: "medium",
        recommendations: [
          "Stay on official route waypoints and avoid unnecessary detours.",
          "Slow down near known hazard reports and monitor road condition.",
          "Coordinate with dispatcher before route deviation.",
        ],
        cautions: [
          "AI key missing, response generated without Gemini context.",
        ],
      };

      return {
        route_id: route.route_id,
        route_code: route.code,
        ai: fallback,
        generated_at: new Date().toISOString(),
      };
    }

    const userPrompt = JSON.stringify(
      {
        task: "Provide reroute suggestion for driver",
        input: payload,
        route_context: {
          route_id: route.route_id,
          route_code: route.code,
          route_name: route.name,
          waypoints_count: route.waypoints?.length ?? 0,
        },
        hazard_context: hazards,
        output_schema: {
          summary: "string",
          risk_level: "low|medium|high",
          recommendations: ["string"],
          cautions: ["string"],
        },
      },
      null,
      2,
    );

    const ai = await geminiClient.generateJson<RerouteResponse>(
      SYSTEM_PROMPT,
      userPrompt,
    );

    return {
      route_id: route.route_id,
      route_code: route.code,
      ai,
      generated_at: new Date().toISOString(),
    };
  },

  async getTravelTips(userRole: string, payload: any) {
    if (!["commuter", "driver"].includes(userRole)) {
      throw createServiceError(
        "Only commuters or drivers can request travel tips",
        403,
      );
    }

    const route = payload.route_id
      ? await aiRepository.getRouteContext(payload.route_id)
      : null;

    const hazards = await aiRepository.getHazardContext(10);

    if (!geminiClient.isConfigured()) {
      const fallback: TravelTipsResponse = {
        summary:
          "Gemini is not configured. Using fallback commuter safety tips for Calamba.",
        best_times: ["Before 7:00 AM", "After 7:00 PM"],
        avoid_times: ["7:00 AM - 9:00 AM", "5:00 PM - 7:00 PM"],
        tips: [
          "Choose active CAL routes with complete waypoint coverage.",
          "Allow extra travel buffer near hazard-prone roads.",
          "Prioritize well-lit and known stops during heavy weather.",
        ],
      };

      return {
        route_id: route?.route_id ?? null,
        route_code: route?.code ?? null,
        ai: fallback,
        generated_at: new Date().toISOString(),
      };
    }

    const userPrompt = JSON.stringify(
      {
        task: "Provide travel tips",
        input: payload,
        route_context: route
          ? {
              route_id: route.route_id,
              route_code: route.code,
              route_name: route.name,
            }
          : null,
        hazard_context: hazards,
        output_schema: {
          summary: "string",
          best_times: ["string"],
          avoid_times: ["string"],
          tips: ["string"],
        },
      },
      null,
      2,
    );

    const ai = await geminiClient.generateJson<TravelTipsResponse>(
      SYSTEM_PROMPT,
      userPrompt,
    );

    return {
      route_id: route?.route_id ?? null,
      route_code: route?.code ?? null,
      ai,
      generated_at: new Date().toISOString(),
    };
  },
};
