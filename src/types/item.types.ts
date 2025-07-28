import { ID, Origin } from './common.types';

export interface Item {
  id: ID;
  origin: Origin;
  name: string;
  idNumber?: string;
  note?: string;
  isAvailable: boolean;
}

export type CreateItemRequest = Omit<Item, 'id'> & {
  quantity?: number;
};
export type UpdateItemRequest = Partial<CreateItemRequest> & { id: ID };
