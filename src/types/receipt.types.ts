import { ID, Timestamp } from './common.types';

export interface Receipt {
  id: ID;
  receiptItems: BackendReceiptItem[];
  userId: ID;
  user: {
    id: ID;
    name: string;
    personalNumber: number;
    rank: string;
    location: string;
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
  quantity: number;
  subItem?: string;
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
