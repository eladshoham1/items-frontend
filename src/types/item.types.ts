import { ID } from './common.types';

export interface Item {
  id: ID;
  origin: string;
  name: string;
  idNumber?: string;
  note?: string;
  isAvailable: boolean;
}

export type CreateItemRequest = Omit<Item, 'id'> & {
  quantity?: number;
};
export type UpdateItemRequest = Partial<CreateItemRequest> & { id: ID };
