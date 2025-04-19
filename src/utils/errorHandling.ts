import { AuthError, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Unified Error Class
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Error types
export const ErrorCodes = {
  // Authentication errors
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Permission errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Resource errors
  RESOURCE_ERROR: 'RESOURCE_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // System errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  
  // Storage errors
  STORAGE_ERROR: 'STORAGE_ERROR'
} as const;

// Create a type from the ErrorCodes object
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export type ErrorResponse = {
  data?: null;
  error: {
    message: string;
    code?: string;
    details?: any;
    status?: number;
    hint?: string;
  };
};

/**
 * Standard error handler for Supabase database operations
 * @param error The error object returned from Supabase
 * @param context A string describing the operation that failed 
 * @returns Standardized error object
 */
export const handleSupabaseError = async (error: any, context: string = 'database operation') => {
  console.error(`[Error] ${context}: `, error);
  
  let message = 'An unexpected error occurred';
  let code = 'UNKNOWN_ERROR';
  let status = 500;
  
  // Handle Supabase error codes and messages
  if (error && typeof error === 'object') {
    // Extract error details if available
    code = error.code || code;
    message = error.message || message;
    status = error.status || status;
    
    // Handle specific Supabase error codes
    if (code === '23505') {
      // Unique constraint violation
      return {
        data: null, 
        error: {
          message: error.message || 'A record with this information already exists',
          code: 'DUPLICATE_ENTRY',
          status: 409,
          originalError: error
        }
      };
    }
    
    if (code === '23503') {
      // Foreign key constraint violation
      return {
        data: null, 
        error: {
          message: error.message || 'This operation references a record that does not exist',
          code: 'REFERENCE_ERROR',
          status: 404,
          originalError: error
        }
      };
    }
    
    if (code === '42501') {
      // RLS policy violation or permission issue
      console.error('Permission error details:', error);
      return {
        data: null, 
        error: {
          message: error.message || 'You do not have permission to perform this action',
          code: 'PERMISSION_DENIED',
          status: 403,
          originalError: error
        }
      };
    }
    
    if (code === 'PGRST116') {
      // Row-level security policy violation
      return {
        data: null, 
        error: {
          message: error.message || 'Access denied by security policy',
          code: 'ACCESS_DENIED',
          status: 403,
          originalError: error
        }
      };
    }
    
    if (code === 'P0001') {
      // PostgreSQL raised exception error
      return {
        data: null, 
        error: {
          message: error.message || 'Database validation error',
          code: 'VALIDATION_ERROR',
          status: 400,
          originalError: error
        }
      };
    }
  }
  
  return {
    data: null,
    error: {
      message,
      code,
      status,
      originalError: error,
      context
    }
  };
};

/**
 * Check if a database error is due to a duplicate entry
 * @param error Error to check
 * @returns True if error is due to duplicate entry
 */
export const isDuplicateError = (error: any): boolean => {
  return error?.code === '23505' || error?.code === 'DUPLICATE_ENTRY';
};

/**
 * Check if a database error is due to a permission issue
 * @param error Error to check
 * @returns True if error is a permission issue
 */
export const isPermissionError = (error: any): boolean => {
  return error?.code === '42501' || error?.code === 'PGRST116' || 
         error?.code === 'PERMISSION_DENIED' || error?.code === 'ACCESS_DENIED';
};

/**
 * Check for active Supabase session and return user ID
 * @returns User ID if authenticated, null otherwise
 */
export const getAuthenticatedUserId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session || !data.session.user) {
      console.error('Authentication error:', error || 'No valid session');
      return null;
    }
    return data.session.user.id;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return null;
  }
};

/**
 * Check if user has a valid session
 * @returns True if user has valid session
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const userId = await getAuthenticatedUserId();
  return userId !== null;
};

/**
 * Handles any error and returns a standardized AppError
 * @param error The error to handle
 * @returns A standardized AppError instance
 */
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof PostgrestError) {
    let status = 500;
    let code: ErrorCode = ErrorCodes.DATABASE_ERROR;
    
    // Map PostgreSQL error codes to our error codes
    if (error.code === '23505') {
      status = 409;
      code = ErrorCodes.DUPLICATE_ENTRY;
    } else if (error.code === '23503') {
      status = 400;
      code = ErrorCodes.RESOURCE_ERROR;
    } else if (['PGRST301', 'PGRST204', '42P01'].includes(error.code)) {
      status = 404;
      code = ErrorCodes.NOT_FOUND;
    } else if (['42501', 'PGRST103'].includes(error.code)) {
      status = 403;
      code = ErrorCodes.PERMISSION_DENIED;
    }
    
    return new AppError(
      error.message || 'Database operation failed',
      code,
      status,
      { postgrestError: error }
    );
  }

  if (error instanceof AuthError) {
    return new AppError(
      error.message || 'Authentication error',
      ErrorCodes.AUTHENTICATION_ERROR,
      error.status || 401,
      { authError: error }
    );
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorCodes.SYSTEM_ERROR,
      500,
      { originalError: error }
    );
  }

  return new AppError(
    'An unknown error occurred',
    ErrorCodes.SYSTEM_ERROR,
    500,
    { originalError: error }
  );
}

/**
 * Get a user-friendly error message from an AppError
 * @param error The AppError instance
 * @returns A user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: AppError): string {
  switch (error.code) {
    case ErrorCodes.AUTHENTICATION_ERROR:
    case ErrorCodes.INVALID_CREDENTIALS:
    case ErrorCodes.UNAUTHORIZED:
      return 'Authentication failed. Please check your credentials and try again.';
      
    case ErrorCodes.VALIDATION_ERROR:
    case ErrorCodes.INVALID_INPUT:
      return 'Please check your input and try again.';
      
    case ErrorCodes.NOT_FOUND:
    case ErrorCodes.RESOURCE_NOT_FOUND:
      return 'The requested resource was not found.';
      
    case ErrorCodes.DUPLICATE_ENTRY:
    case ErrorCodes.RESOURCE_CONFLICT:
      return 'This resource already exists.';
      
    case ErrorCodes.PERMISSION_DENIED:
    case ErrorCodes.INSUFFICIENT_PERMISSIONS:
      return 'You don\'t have permission to perform this action.';
      
    case ErrorCodes.NETWORK_ERROR:
    case ErrorCodes.TIMEOUT:
      return 'Network error. Please check your connection and try again.';
      
    case ErrorCodes.STORAGE_ERROR:
      return 'There was an error uploading or retrieving your file.';
      
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * API response type for consistent responses
 */
export type ApiResponse<T> = {
  data: T | null;
  error: AppError | null;
};

/**
 * Create a standardized API response
 */
export const createApiResponse = <T>(
  data: T | null,
  error: unknown = null
): ApiResponse<T> => {
  if (error) {
    return {
      data: null,
      error: handleError(error)
    };
  }
  return { data, error: null };
};

/**
 * Create an error response for APIs
 */
export function createErrorResponse(
  message: string, 
  status: number = 400, 
  code: ErrorCode = ErrorCodes.SYSTEM_ERROR
): ErrorResponse {
  return {
    data: null,
    error: {
      message,
      status,
      code
    }
  };
}

/**
 * Determine if an error is a specific type of error
 */
export function isErrorCode(error: any, code: ErrorCode | string): boolean {
  if (error instanceof AppError) {
    return error.code === code;
  }
  return error && error.code === code;
}

/**
 * Check if an error is a not found error
 */
export function isNotFoundError(error: any): boolean {
  return isErrorCode(error, ErrorCodes.NOT_FOUND) || 
         isErrorCode(error, ErrorCodes.RESOURCE_NOT_FOUND) || 
         isErrorCode(error, 'PGRST301') || 
         isErrorCode(error, 'PGRST204') || 
         (error && error.status === 404);
}

/**
 * Handle errors from API responses
 */
export function handleApiError(response: any): AppError {
  const error = response?.error;
  
  if (!error) {
    return new AppError(
      'Unknown API error',
      ErrorCodes.SYSTEM_ERROR,
      500
    );
  }
  
  return new AppError(
    error.message || 'API request failed',
    error.code || ErrorCodes.SYSTEM_ERROR,
    error.status || 500,
    error.details
  );
}

/**
 * Creates a standardized error for storage operations
 */
export function createStorageError(message: string, statusCode = 500): AppError {
  return new AppError(
    message,
    ErrorCodes.STORAGE_ERROR,
    statusCode
  );
}

/**
 * Generates fallback placeholder avatar URL
 */
export function generatePlaceholderAvatar(username: string = 'user') {
  const encodedUsername = encodeURIComponent(username);
  return `https://ui-avatars.com/api/?name=${encodedUsername}&background=random&size=200`;
} 