import { hazardsRepository } from "./hazards.repository";
import { isWithinCalamba } from "../../lib/calamba.bounds";

export const hazardsService = {
  async reportHazard(userId: string, data: any) {
    if (!isWithinCalamba(parseFloat(data.lat), parseFloat(data.lng))) {
      throw new Error("Hazard location is outside Calamba City bounds");
    }

    return await hazardsRepository.createReport({
      ...data,
      reporter_id: userId,
      lat: data.lat.toString(),
      lng: data.lng.toString(),
    });
  },

  async listHazards(statusFilter: string = "confirmed") {
    return await hazardsRepository.getAllReports(statusFilter);
  },

  async updateStatus(id: string, status: string) {
    return await hazardsRepository.updateReport(id, { status } as any);
  },

  async addPotholeZone(reportId: string, data: any) {
    return await hazardsRepository.createPotholeZone({
      report_id: reportId,
      start_lat: data.start_lat.toString(),
      start_lng: data.start_lng.toString(),
      end_lat: data.end_lat.toString(),
      end_lng: data.end_lng.toString(),
    });
  },

  async listPotholeZones() {
    return await hazardsRepository.getPotholeZones();
  },
  async deleteHazard(id: string) {
    return await hazardsRepository.deleteReport(id);
  },
};
