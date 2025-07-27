import { apiService } from './api.service';
import { ReportItem, ReportStatusUpdate, DashboardStatistics } from '../types';

export const reportService = {
  // Get daily report items
  async getDailyReport(): Promise<ReportItem[]> {
    return apiService.get<ReportItem[]>('/reports');
  },

  // Update report status
  async updateReportStatus(reportUpdates: ReportStatusUpdate[]): Promise<void> {
    return apiService.post<void>('/reports', reportUpdates);
  },

  // Get dashboard statistics
  async getStatistics(): Promise<DashboardStatistics> {
    return apiService.get<DashboardStatistics>('/reports/statistics');
  },
};
