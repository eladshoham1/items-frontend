import { ID } from './common.types';

export interface ReportItem {
  id: ID;
  itemName: string;
  itemNumberId: string;
  userName: string;
  phoneNumber: string;
  isReported: boolean;
}

export interface ReportStatusUpdate {
  id: ID;
  reported: boolean;
}

export interface DashboardStatistics {
  totalUsers: number;
  totalItems: number;
  totalReceipts: number;
  activeReports: number;
}
