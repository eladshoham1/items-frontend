import { ID } from './common.types';

export interface Item {
  id: ID;
  nameId: string;
  itemName?: {
    name: string;
  };
  allocatedLocationId?: string | null;
  allocatedLocation?: {
    id: string;
    name: string;
    unit: {
      name: string;
    };
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
  receiptInfo?: {
    receiptId: string;
    isSigned: boolean;
    signedBy: {
      name: string;
      location: {
        name: string;
        unit: {
          name: string;
        };
      };
    };
  };
}

export type CreateItemRequest = {
  nameId?: string; // Reference to ItemName table
  name?: string; // Legacy support - will be converted to nameId
  allocatedLocationId?: string | null; // Reference to Location table
  idNumber?: string | null;
  note?: string | null;
  isOperational?: boolean;
  requiresReporting?: boolean;
  quantity?: number;
};

export type UpdateItemRequest = {
  nameId?: string;
  name?: string;
  allocatedLocationId?: string | null;
  idNumber?: string | null;
  note?: string | null;
  isOperational?: boolean;
  requiresReporting?: boolean;
  receiptId?: string | null;
} & { id: ID };
