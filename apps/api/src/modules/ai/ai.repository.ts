import { routesRepository } from "../jeepney-routes/jeepney-routes.repository";
import { hazardsRepository } from "../hazards/hazards.repository";

export const aiRepository = {
  async getRouteContext(routeId: string) {
    return await routesRepository.getRouteById(routeId);
  },

  async getHazardContext(limit = 10) {
    const hazards = await hazardsRepository.getAllReports();
    return hazards.slice(0, limit);
  },
};
