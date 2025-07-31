import { ID, Timestamp } from './common.types';

export interface Receipt {
  id: ID;
  receiptItems: BackendReceiptItem[];
  userId: ID;
  user: {
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
  signature: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BackendReceiptItem {
  id: string;
  receiptId: string;
  itemId: string;
  createdAt: Timestamp;
  item: {
    id: string;
    idNumber?: string | null;
    note?: string;
    itemName: {
      name: string;
    };
  };
}

export interface ReceiptItem {
  id: string;
  name: string;
  idNumber?: string;
  isNeedReport?: boolean;
  quantity?: number;
}

export interface CreateReceiptRequest {
  items: ReceiptItem[];
  userId: ID;
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

export interface PendingReceipt {
  id: ID;
  receiptItems: BackendReceiptItem[];
  userId: ID;
  user: {
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreatePendingReceiptRequest {
  userId: ID;
  itemIds: string[];
}

export interface SignPendingReceiptRequest {
  signature: string;
}
