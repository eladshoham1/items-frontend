import { apiService } from './api.service';
import { ReportStatusUpdate, UpdateReportRequest, DashboardStatistics, DailyReportResponse } from '../types';

export const reportService = {
  // Get daily report items
  async getDailyReport(): Promise<DailyReportResponse> {
    return apiService.get<DailyReportResponse>('/reports');
  },

  // Update report status using new DTO structure
  async updateReportStatus(reportUpdates: ReportStatusUpdate[]): Promise<void> {
    const updateRequest: UpdateReportRequest = {
      items: reportUpdates
    };
    return apiService.patch<void>('/reports', updateRequest);
  },

  // Get dashboard statistics (now includes matrix data)
  async getStatistics(): Promise<DashboardStatistics> {
    return apiService.get<DashboardStatistics>('/reports/statistics');
  },
};
