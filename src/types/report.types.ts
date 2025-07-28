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
  quantity: number;
  timestamp: string;
}

export interface ReportStatusUpdate {
  id: ID;
  status: boolean;
}

export interface UpdateReportRequest {
  items: ReportStatusUpdate[];
}

export interface SignUser {
  id: string;
  name: string;
  phoneNumber: string;
  personalNumber: number;
  quantity: number;
}

export interface LocationData {
  signUsers: SignUser[];
}

export interface ItemData {
  quantity: number;
  locations: Record<string, LocationData>;
}

export interface DashboardStatistics {
  [itemName: string]: ItemData;
}
