import { ID } from './common.types';

export const ranks = [
  'טוראי', 'רב"ט', 'סמל', 'סמ"ר', 'רס"ל', 'רס"ר', 'רס"ם', 'רס"ב', 'רנ"ג',
  'קמ"א', 'קא"ב', 'קא"ם', 'סג"מ', 'סגן', 'סרן', 'רס"ן', 'סא"ל',
  'אל"מ', 'תא"ל', 'אלוף', 'רא"ל',
] as const;

export type Rank = typeof ranks[number];

export interface User {
  id: ID;
  name: string;
  personalNumber: number;
  phoneNumber: string;
  location: string;
  unit: string;
  rank: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  personalNumber: number;
  phoneNumber: string;
  rank: string;
  locationId: string; // Server expects location ID only
}

export type UpdateUserRequest = Partial<CreateUserRequest> & { id: ID };
