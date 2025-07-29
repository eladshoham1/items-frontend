import { ID } from './common.types';

export interface User {
  id: ID;
  name: string;
  personalNumber: number;
  phoneNumber: string;
  rank: string;
  location: string;
  unit: string;
  role?: string;
}

export type CreateUserRequest = Omit<User, 'id'>;
export type UpdateUserRequest = Partial<CreateUserRequest> & { id: ID };
