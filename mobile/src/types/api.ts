export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
}

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ValidationErrorItem[];
  data?: null;
  meta?: ApiMeta;
}
