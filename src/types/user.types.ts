import { ID, Location, Rank } from './common.types';

export interface User {
  id: ID;
  name: string;
  personalNumber: number;
  phoneNumber: string;
  rank: Rank;
  location: Location;
  role?: string;
}

export type CreateUserRequest = Omit<User, 'id'>;
export type UpdateUserRequest = Partial<CreateUserRequest> & { id: ID };
