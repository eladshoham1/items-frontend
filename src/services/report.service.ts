import { apiService } from './api.service';
import { 
  DashboardStatistics, 
  CurrentReportingStatusResponse,
  UpdateReportItemsRequest,
  ReportCompletionHistoryResponse,
  UnitDashboardResponse
} from '../types';

export const reportService = {
  // Get dashboard statistics
  async getStatistics(): Promise<DashboardStatistics> {
    return apiService.get<DashboardStatistics>('/reports/dashboard');
  },

  // Get current reporting status
  async getCurrentReportingStatus(): Promise<CurrentReportingStatusResponse> {
    return apiService.get<CurrentReportingStatusResponse>('/reports/current');
  },

  // Update multiple items reporting status
  async updateReportItems(data: UpdateReportItemsRequest): Promise<void> {
    return apiService.patch<void>('/reports/reportItems', data);
  },

  // Complete current report cycle (admin only)
  async completeReportCycle(): Promise<void> {
    return apiService.post<void>('/reports/complete', {});
  },

  // Get report completion history (admin only)
  async getCompletionHistory(page: number = 1, limit: number = 10): Promise<ReportCompletionHistoryResponse> {
    return apiService.get<ReportCompletionHistoryResponse>(`/reports/history?page=${page}&limit=${limit}`);
  },

  // Download report PDF by ID (admin only)
  async downloadReportPDF(reportId: string): Promise<Blob> {
    return apiService.getBlob(`/reports/download/${reportId}`);
  },

  // Get dashboard data for specific unit (admin only)
  async getDashboardByUnit(unitId: string): Promise<UnitDashboardResponse> {
    return apiService.get<UnitDashboardResponse>(`/reports/dashboard/${unitId}`);
  },
};
