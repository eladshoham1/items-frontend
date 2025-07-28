import { ID, Timestamp } from './common.types';
import { User } from './user.types';

export interface Receipt {
  id: ID;
  receiptItems: BackendReceiptItem[];
  userId: ID;
  user: User;
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
    name: string;
    origin: string;
    idNumber?: string;
    note?: string;
  };
}

export interface ReceiptItem {
  id: string;
  origin: string;
  name: string;
  idNumber?: string;
  quantity?: number; // For מרת"ק items
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
