import { ID } from './common.types';

export interface ReportItem {
  id: ID;
  name: string;
  idNumber: string;
  userName: string;
  phoneNumber: string;
  hasRecentReport: boolean;
  isReported?: boolean; // For local state management
}

export interface DailyReportResponse {
  items: ReportItem[];
  total: number;
  timestamp: string;
}

export interface ReportStatusUpdate {
  id: ID;
  status: boolean;
}

export interface UpdateReportRequest {
  items: ReportStatusUpdate[];
}

export interface DashboardStatistics {
  totalUsers: number;
  totalItems: number;
  totalReceipts: number;
  activeReports: number;
  // Matrix data structure
  matrix: Record<string, Record<string, number>>; // location -> item -> count
  locations: string[];
  itemNames: string[];
  totals: {
    byLocation: Record<string, number>;
    byItem: Record<string, number>;
    grand: number;
  };
  metadata: {
    locationsCount: number;
    itemsCount: number;
    totalAssignments: number;
    generatedAt: string;
  };
}
