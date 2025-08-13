import { ID } from './common.types';

// Backend Receipt structure (matches the server)
export interface Receipt {
  id: string;
  createdById: string;
  signedById: string;
  signature: string | null;
  isSigned: boolean;
  createdAt: Date;
  updatedAt: Date;
  // These will be populated by the service layer or separate API calls
  createdBy?: {
    id: string;
    name: string;
    personalNumber: number;
    phoneNumber: string;
    rank: string;
    location?: {
      name: string;
      unit?: {
        name: string;
      };
    };
  };
  signedBy?: {
    id: string;
    name: string;
    personalNumber: number;
    phoneNumber: string;
    rank: string;
    location?: {
      name: string;
      unit?: {
        name: string;
      };  
    };
  };
  receiptItems?: {
    id: string;
    receiptId: string;
    itemId: string;
    createdAt: Date;
    item: {
      id: string;
      idNumber?: string | null;
      note?: string;
      requiresReporting?: boolean;
      itemName: {
        name: string;
      };
    };
  }[];
  // Legacy support for old structure
  items?: ReceiptItemWithDetails[];
}// Backend Receipt Item structure (matches the server)
export interface BackendReceiptItem {
  id: string;
  receiptId: string;
  itemId: string;
  createdAt: Date;
  item?: {
    id: string;
    itemName?: {
      name: string;
    };
    idNumber?: string | null;
    note?: string | null;
    requiresReporting?: boolean;
  };
}

// Receipt Item with details (for display purposes)
export interface ReceiptItemWithDetails {
  id: string;
  receiptId: string;
  itemId: string;
  createdAt: Date;
  item?: {
    id: string;
    idNumber?: string | null;
    note?: string | null;
    requiresReporting?: boolean;
    itemName?: {
      name: string;
    };
  };
}

export interface ReceiptItem {
  id: string;
  name: string;
  idNumber?: string | null;
  requiresReporting?: boolean;
  quantity?: number;
}

// Backend DTOs (matching the server)
export interface CreateReceiptRequest {
  createdById: string;
  signedById: string;
  items: string[]; // Array of item IDs
}

export interface UpdateReceiptRequest {
  signedById?: string;
  items?: string[]; // Array of item IDs
}

export interface SignReceiptRequest {
  signature: string;
}

export interface ReturnReceiptRequest {
  receiptId: ID;
  signature: string;
}

export interface ReturnItemsRequest {
  receiptId: ID;
  receiptItemIds: string[];
}

// For legacy compatibility, we'll remove PendingReceipt since the backend doesn't seem to have it
// Instead, we'll use Receipt with isSigned: false

export interface CreatePendingReceiptRequest {
  userId: ID;
  itemIds: string[];
}

export interface SignPendingReceiptRequest {
  signature: string;
}
