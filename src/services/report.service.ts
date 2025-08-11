import { apiService } from './api.service';
import { 
  ReportStatusUpdate, 
  UpdateReportRequest, 
  DashboardStatistics, 
  DailyReportResponse,
  DailyReport,
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
  CompleteDailyReportRequest,
  DailyReportHistoryResponse
} from '../types';

export const reportService = {
  // Get daily report items (legacy endpoint)
  async getDailyReport(): Promise<DailyReportResponse> {
    return apiService.get<DailyReportResponse>('/reports');
  },

  // Update report status using new DTO structure (legacy endpoint)
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

  // NEW DAILY REPORT METHODS

  // Create a new daily report
  async createDailyReport(data: CreateDailyReportRequest): Promise<DailyReport> {
    return apiService.post<DailyReport>('/reports/daily', data);
  },

  // Get today's daily report
  async getTodaysDailyReport(): Promise<DailyReport> {
    return apiService.get<DailyReport>('/reports/daily/today');
  },

  // Get daily report history (admin only)
  async getDailyReportHistory(page: number = 1, limit: number = 10): Promise<DailyReportHistoryResponse> {
    return apiService.get<DailyReportHistoryResponse>(`/reports/daily/history?page=${page}&limit=${limit}`);
  },

  // Get daily report by ID
  async getDailyReportById(id: string): Promise<DailyReport> {
    return apiService.get<DailyReport>(`/reports/daily/${id}`);
  },

  // Update daily report
  async updateDailyReport(id: string, data: UpdateDailyReportRequest): Promise<DailyReport> {
    return apiService.patch<DailyReport>(`/reports/daily/${id}`, data);
  },

  // Complete daily report (admin only)
  async completeDailyReport(data: CompleteDailyReportRequest): Promise<DailyReport> {
    return apiService.post<DailyReport>('/reports/daily/complete', data);
  },
};
