// Base types and constants
export const origins = ['מרת"ק', 'כ"ס'] as const;
export type Origin = typeof origins[number];

export const locations = ['קצ"ק', 'מפקדה', 'ינשו"ף', 'יל"ק', 'יטנ"א'] as const;
export type Location = typeof locations[number];

export const ranks = [
  'טוראי', 'רב"ט', 'סמל', 'סמ"ר', 'רס"ל', 'רס"ר', 'רס"ם', 'רס"ב', 'רנ"ג',
  'קמ"א', 'קא"ב', 'קא"ם', 'סג"מ', 'סגן', 'סרן', 'רס"ן', 'סא"ל',
  'אל"מ', 'תא"ל', 'אלוף', 'רא"ל',
] as const;
export type Rank = typeof ranks[number];

// Generic API types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Error handling
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Form states
export type FormMode = 'create' | 'edit' | 'view';

// Common utility types
export type ID = string;
export type Timestamp = string;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
