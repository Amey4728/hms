/**
 * The canonical API envelope. Every successful response is wrapped in this
 * shape by the API's TransformInterceptor; every error uses ApiErrorResponse.
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<TData = unknown, TMeta = Record<string, unknown>> {
  success: true;
  message: string;
  data: TData;
  meta: TMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    statusCode: number;
    details?: ApiErrorDetail[];
  };
  meta: {
    timestamp: string;
    path: string;
    requestId?: string;
  };
}

export type Paginated<T> = ApiResponse<T[], PaginationMeta>;
