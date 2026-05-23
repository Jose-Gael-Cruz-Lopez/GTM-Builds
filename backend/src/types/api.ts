// ─── Response Envelope ───────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Error Codes ─────────────────────────────────────────────────────────────

export type ErrorCode =
  | 'AUTH_MISSING'
  | 'AUTH_INVALID'
  | 'AUTH_EXPIRED'
  | 'AUTH_FORBIDDEN'
  | 'RATE_LIMITED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_ALREADY_USED'
  | 'TOKEN_INVALID'
  | 'VISIT_DUPLICATE'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SUPABASE_ERROR'
  | 'NIM_ERROR'
  | 'INTERNAL_ERROR';

// ─── Hono Context Variables ───────────────────────────────────────────────────

export type ContextVariables = {
  userId: string;
  businessId: string;
  userRole: 'client' | 'staff' | 'admin';
};

// ─── Pagination ──────────────────────────────────────────────────────────────

export type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function err(code: ErrorCode, message: string): ApiError {
  return { success: false, error: { code, message } };
}

export function parsePagination(url: URL, defaultLimit = 20): PaginationParams {
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? String(defaultLimit), 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
