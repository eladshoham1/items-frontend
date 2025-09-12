// New Simplified Report Types - matching new server controller

// Individual report item data structure
export interface ReportItemData {
  id: string; // This is the item ID, not report item ID
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
  notes?: string;
}

// Current reporting status response
export interface CurrentReportingStatusResponse {
  items: ReportItemData[];
  totalItems: number;
  reportedItems: number;
  userLocation?: string;
  isAdmin: boolean;
}

// Request to update report items
export interface ReportItemRequest {
  itemId: string;
  notes?: string;
}

export interface UpdateReportItemsRequest {
  items: ReportItemRequest[];
}

// Report completion history item
export interface ReportCompletionHistoryItem {
  id: string;
  completedById: string;
  totalItems: number;
  reportedItems: number;
  fileStoragePath: string;
  fileName: string;
  completedAt: string;
  completedBy: {
    id: string;
    name: string;
    rank: string;
  };
  downloadUrl: string;
}

// Report completion history response
export interface ReportCompletionHistoryResponse {
  completions: ReportCompletionHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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
  downloadUrl?: string; // Add downloadUrl for new API
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
  items?: Array<{
    itemId: string;
    idNumber: string | null;
    note: string;
    allocatedLocationName: string | null;
  }>;
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

// Legacy types - keeping for backward compatibility
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

// Unit Dashboard Types
export interface UnitDashboardLocationData {
  locationName: string;
  signed: number;
  pending: number;
  allocation: number;
  receipts: any[]; // You can define a more specific type if needed
}

export interface UnitDashboardRow {
  itemName: string;
  locations: Record<string, UnitDashboardLocationData>;
}

export interface UnitDashboardColumn {
  id: string;
  name: string;
}

export interface UnitDashboardTableStructure {
  columns: UnitDashboardColumn[];
  rows: UnitDashboardRow[];
}

export interface UnitDashboardMetadata {
  unitId: string;
  unitName: string;
  totalLocations: number;
  totalAllocations: number;
}

export interface UnitDashboardResponse {
  tableStructure: UnitDashboardTableStructure;
  metadata: UnitDashboardMetadata;
}

// User Dashboard Types (for regular users)
export interface UserDashboardItem {
  id: string;                    // Receipt ID
  itemId: string;               // Item ID
  itemName: string;             // Item name (e.g., "M16")
  itemIdNumber?: string | null; // Physical item serial number
  status: 'signed' | 'pending'; // Receipt status
  createdAt: string;            // ISO date string
  signedAt?: string | null;     // ISO date string (only if signed)
  signature?: string | null;    // Base64 signature (only if signed)
  requiresReporting?: boolean;  // Whether this item requires reporting
  createdBy: {                  // Who created the receipt
    id: string;
    name: string;
    rank: string;
  };
}

export interface UserDashboardSummary {
  totalSigned: number;
  totalPending: number;
  totalItems: number;
}

export interface UserDashboardData {
  user: {
    id: string;
    name: string;
    personalNumber: number;
    rank: string;
    location: string;
    unit: string;
  };
  summary: UserDashboardSummary;
  items: UserDashboardItem[];
}

export interface UserDashboardResponse {
  success: true;
  data: UserDashboardData;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface UserDashboardQueryParams {
  page?: number;
  limit?: number;
  status?: 'signed' | 'pending' | 'all';
  sortBy?: 'itemName' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
