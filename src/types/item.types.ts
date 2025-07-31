import { ID } from './common.types';

export interface Item {
  id: ID;
  nameId: string;
  itemName: {
    name: string;
  };
  idNumber?: string;
  note?: string;
  isNeedReport: boolean;
  isAvailable: boolean;
  lastReported?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateItemRequest = {
  name: string;
  idNumber?: string;
  note?: string;
  isNeedReport: boolean;
  isAvailable: boolean;
  quantity?: number;
};
export type UpdateItemRequest = Partial<Omit<CreateItemRequest, 'quantity'>> & { id: ID };
