import { ID } from './common.types';

export interface Item {
  id: ID;
  nameId: string;
  itemName?: {
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  idNumber?: string | null;
  note?: string | null;
  isOperational: boolean;
  requiresReporting?: boolean;
  lastReported?: string | null;
  createdAt: string;
  updatedAt: string;
  receiptItems?: {
    id: string;
    receiptId: string;
  }[];
  // Note: isAvailable is computed server-side and may not always be present
  isAvailable?: boolean;
}

export type CreateItemRequest = {
  nameId?: string; // Reference to ItemName table
  name?: string; // Legacy support - will be converted to nameId
  idNumber?: string | null;
  note?: string | null;
  isOperational?: boolean;
  requiresReporting?: boolean;
  quantity?: number;
};

export type UpdateItemRequest = {
  nameId?: string;
  name?: string;
  idNumber?: string | null;
  note?: string | null;
  isOperational?: boolean;
  requiresReporting?: boolean;
  receiptId?: string | null;
} & { id: ID };
