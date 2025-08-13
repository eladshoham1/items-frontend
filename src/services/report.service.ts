import { apiService } from './api.service';
import { 
  DashboardStatistics, 
  DailyReport,
  DailyReportResponse,
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
  CompleteDailyReportRequest,
  DailyReportHistoryResponse,
  DetailedDailyReportResponse
} from '../types';

export const reportService = {
  // Get dashboard statistics (admin only)
  async getStatistics(): Promise<DashboardStatistics> {
    return apiService.get<DashboardStatistics>('/reports/statistics');
  },

  // Create a new daily report (admin only)
  async createDailyReport(data: CreateDailyReportRequest): Promise<DailyReportResponse> {
    return apiService.post<DailyReportResponse>('/reports/create', data);
  },

  // Get current daily report
  async getCurrentDailyReport(): Promise<DailyReportResponse> {
    return apiService.get<DailyReportResponse>('/reports/current');
  },

  // Get daily report history (admin only)
  async getDailyReportHistory(page: number = 1, limit: number = 10): Promise<DailyReportHistoryResponse> {
    return apiService.get<DailyReportHistoryResponse>(`/reports/history?page=${page}&limit=${limit}`);
  },

  // Get daily report by ID (admin only)
  async getDailyReportById(id: string): Promise<DetailedDailyReportResponse> {
    return apiService.get<DetailedDailyReportResponse>(`/reports/${id}`);
  },

  // Update daily report items
  async updateDailyReport(id: string, data: UpdateDailyReportRequest): Promise<DailyReport> {
    return apiService.patch<DailyReport>('/reports/items', data);
  },

  // Complete daily report (admin only)
  async completeDailyReport(data: CompleteDailyReportRequest): Promise<DailyReport> {
    return apiService.post<DailyReport>('/reports/complete', data);
  },
};
