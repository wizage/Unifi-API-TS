/**
 * API response and data types
 * 
 * Generic types for API responses and common patterns
 */

export interface APIResponse<T = any> {
  data: T;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  rc: string;
  msg?: string;
}

// Generic response types for common API patterns
export type ListResponse<T> = APIResponse<T[]>;
export type SingleResponse<T> = APIResponse<T>;
export type BooleanResponse = APIResponse<boolean>;
export type StringResponse = APIResponse<string>;
export type NumberResponse = APIResponse<number>;

// Pagination support
export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Error response structure
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: ResponseMeta;
}