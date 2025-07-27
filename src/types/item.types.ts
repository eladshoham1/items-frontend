import { ID, Origin } from './common.types';

export interface Item {
  id: ID;
  origin: Origin;
  name: string;
  idNumber?: string;
  note?: string;
  subItems?: string[];
}

export type CreateItemRequest = Omit<Item, 'id'>;
export type UpdateItemRequest = Partial<CreateItemRequest> & { id: ID };
