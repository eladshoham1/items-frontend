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

// New Daily Report Types
export interface DailyReportItem {
  id: string;
  name: string;
  idNumber?: string;
  isReported: boolean;
  reportedAt?: string;
  notes?: string;
}

export interface DailyReport {
  id: string;
  reportDate: string;
  createdBy: string; // Changed from createdById to match API
  completedAt?: string;
  isCompleted: boolean;
  totalItems: number;
  reportedItems: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: DailyReportItem[]; // Changed from reportItems to items to match API
}

export interface CreateDailyReportRequest {
  reportDate?: string;
  notes?: string;
}

export interface UpdateDailyReportItemRequest {
  itemId: string;
  isReported: boolean;
  notes?: string;
}

export interface UpdateDailyReportRequest {
  reportItems: UpdateDailyReportItemRequest[];
}

export interface CompleteDailyReportRequest {
  reportId: string;
  notes?: string;
}

export interface DailyReportHistoryItem {
  id: string;
  reportDate: string;
  isCompleted: boolean;
  totalItems: number;
  reportedItems: number;
  completedAt?: string;
  createdBy: {
    name: string;
  };
}

export interface DailyReportHistoryResponse {
  reports: DailyReportHistoryItem[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SignUser {
  id: string;
  name: string;
  phoneNumber: string;
  personalNumber: number;
  quantity: number;
  isSigned: boolean;
  location?: string; // Added for location information in user details
}

export interface LocationData {
  signUsers: SignUser[];
}

export interface UnitData {
  locations: Record<string, LocationData>;
}

export interface ItemData {
  quantity: number;
  units: Record<string, UnitData>;
}

export interface DashboardStatistics {
  [itemName: string]: ItemData;
}
