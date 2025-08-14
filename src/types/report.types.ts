// New Daily Report Types
export interface DailyReportItem {
  id: string;
  itemId: string;
  itemName: string;
  idNumber?: string;
  location: string;
  signedByUserName?: string;
  isReported: boolean;
  reportedAt?: string;
  reportedBy?: {
    id: string;
    name: string;
    rank: string;
  };
  notes?: string | null;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  createdBy: {
    id: string;
    name: string;
    rank: string;
  };
  totalItems: number;
  reportedItems: number;
  isCompleted: boolean;
  createdAt: string;
}

export interface DailyReportResponse {
  report: DailyReport;
  items: DailyReportItem[];
  userLocation: string;
  isAdmin: boolean;
}

export interface CreateDailyReportRequest {
  // Empty object - auto-generated reports don't need title or notes
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
}

export interface DetailedDailyReportItem {
  id: string;
  reportId: string;
  itemId: string;
  isReported: boolean;
  reportedAt?: string;
  reportedById?: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  item: {
    id: string;
    nameId: string;
    createdById: string;
    isOperational: boolean;
    requiresReporting: boolean;
    idNumber: string;
    note: string;
    createdAt: string;
    updatedAt: string;
    itemName: {
      name: string;
    };
    receiptItems?: any; // Complex nested structure
  };
  reportedBy?: {
    id: string;
    name: string;
    rank: string;
  };
}

export interface DetailedDailyReportResponse {
  id: string;
  createdById: string;
  completedAt?: string;
  completedById?: string;
  isActive: boolean;
  isCompleted: boolean;
  totalItems: number;
  reportedItems: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    rank: string;
  };
  completedBy?: {
    id: string;
    name: string;
    rank: string;
  };
  reportItems: DetailedDailyReportItem[];
}

export interface DailyReportHistoryItem {
  id: string;
  createdById: string;
  completedAt?: string;
  completedById?: string;
  isActive: boolean;
  isCompleted: boolean;
  totalItems: number;
  reportedItems: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    rank: string;
  };
  completedBy?: {
    id: string;
    name: string;
    rank: string;
  };
}

export interface DailyReportHistoryResponse {
  reports: DailyReportHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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
  operationalQuantity: number;
  nonOperationalQuantity: number;
  units: Record<string, UnitData>;
}

export interface DashboardStatistics {
  [itemName: string]: ItemData;
}
