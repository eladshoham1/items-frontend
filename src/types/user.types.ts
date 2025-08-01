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
  isAdmin: boolean;
  firebaseUid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  personalNumber: number;
  phoneNumber: string;
  rank: string;
  firebaseUid?: string;
  locationId: string;
}

export interface UpdateUserRequest {
  name?: string;
  personalNumber?: number;
  phoneNumber?: string;
  rank?: string;
  isAdmin?: boolean;
  firebaseUid?: string;
  locationId?: string;
}
