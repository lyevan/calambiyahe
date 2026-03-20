import { terminalsRepository } from "./terminals.repository";
import { isWithinCalamba } from "../../lib/calamba.bounds";

type ServiceError = Error & { statusCode?: number };

function createServiceError(message: string, statusCode: number): ServiceError {
  const error = new Error(message) as ServiceError;
  error.statusCode = statusCode;
  return error;
}

export const terminalsService = {
  async createTerminal(user_id: string, data: any) {
    if (!isWithinCalamba(Number(data.lat), Number(data.lng))) {
      throw createServiceError(
        "Terminal coordinates are outside Calamba City bounds",
        400,
      );
    }

    return await terminalsRepository.createTerminal({
      ...data,
      lat: data.lat.toString(),
      lng: data.lng.toString(),
      created_by: user_id,
    });
  },

  async listTerminals() {
    return await terminalsRepository.listTerminals();
  },

  async getTerminalDetail(terminal_id: string) {
    const terminal = await terminalsRepository.getTerminalById(terminal_id);
    if (!terminal) {
      throw createServiceError("Terminal not found", 404);
    }

    const spots =
      await terminalsRepository.listWaitingSpotsByTerminal(terminal_id);
    return { ...terminal, waiting_spots: spots };
  },

  async updateTerminal(terminal_id: string, data: any) {
    const terminal = await terminalsRepository.getTerminalById(terminal_id);
    if (!terminal) {
      throw createServiceError("Terminal not found", 404);
    }

    const nextLat = data.lat ?? Number(terminal.lat);
    const nextLng = data.lng ?? Number(terminal.lng);

    if (!isWithinCalamba(Number(nextLat), Number(nextLng))) {
      throw createServiceError(
        "Terminal coordinates are outside Calamba City bounds",
        400,
      );
    }

    return await terminalsRepository.updateTerminal(terminal_id, {
      ...data,
      lat: data.lat !== undefined ? data.lat.toString() : undefined,
      lng: data.lng !== undefined ? data.lng.toString() : undefined,
    });
  },

  async deleteTerminal(terminal_id: string) {
    const deleted = await terminalsRepository.deleteTerminal(terminal_id);
    if (!deleted) {
      throw createServiceError("Terminal not found", 404);
    }
    return deleted;
  },

  async createWaitingSpot(terminal_id: string, data: any) {
    const terminal = await terminalsRepository.getTerminalById(terminal_id);
    if (!terminal) {
      throw createServiceError("Terminal not found", 404);
    }

    const route = await terminalsRepository.getRouteById(data.route_id);
    if (!route || !route.is_active) {
      throw createServiceError("Route not found or inactive", 404);
    }

    if (!isWithinCalamba(Number(data.lat), Number(data.lng))) {
      throw createServiceError(
        "Waiting spot coordinates are outside Calamba City bounds",
        400,
      );
    }

    return await terminalsRepository.createWaitingSpot({
      terminal_id,
      route_id: data.route_id,
      label: data.label,
      lat: data.lat.toString(),
      lng: data.lng.toString(),
      is_active: true,
    });
  },

  async deleteWaitingSpot(spot_id: string) {
    const deleted = await terminalsRepository.deleteWaitingSpot(spot_id);
    if (!deleted) {
      throw createServiceError("Waiting spot not found", 404);
    }
    return deleted;
  },
};
