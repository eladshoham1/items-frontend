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
