// Custom error class for Amino App
export class AminoError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AminoError';
  }
}

// Error types
export const ErrorTypes = {
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
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
} as const;

// Error handler utility
export const handleError = (error: unknown): AminoError => {
  if (error instanceof AminoError) {
    return error;
  }

  if (error instanceof Error) {
    return new AminoError(
      error.message,
      ErrorTypes.SYSTEM_ERROR,
      500,
      { originalError: error }
    );
  }

  return new AminoError(
    'An unknown error occurred',
    ErrorTypes.SYSTEM_ERROR,
    500,
    { originalError: error }
  );
};

// API response type
export type ApiResponse<T> = {
  data: T | null;
  error: AminoError | null;
};

// Create API response
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