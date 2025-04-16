import { 
  AminoError, 
  ErrorTypes, 
  handleError,
  createApiResponse
} from '../../utils/errors';

describe('AminoError', () => {
  it('should create error with correct properties', () => {
    const message = 'Test error message';
    const code = ErrorTypes.AUTHENTICATION_ERROR;
    const statusCode = 401;
    const details = { userId: '123' };

    const error = new AminoError(message, code, statusCode, details);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AminoError);
    expect(error.message).toBe(message);
    expect(error.code).toBe(code);
    expect(error.statusCode).toBe(statusCode);
    expect(error.details).toBe(details);
    expect(error.name).toBe('AminoError');
  });

  it('should use default status code if not provided', () => {
    const error = new AminoError('Test', ErrorTypes.SYSTEM_ERROR);
    expect(error.statusCode).toBe(500);
  });
});

describe('handleError', () => {
  it('should return the error if already an AminoError', () => {
    const originalError = new AminoError('Test', ErrorTypes.NOT_FOUND, 404);
    const result = handleError(originalError);
    
    expect(result).toBe(originalError);
  });

  it('should wrap standard Error in AminoError', () => {
    const originalError = new Error('Standard error');
    const result = handleError(originalError);
    
    expect(result).toBeInstanceOf(AminoError);
    expect(result.message).toBe('Standard error');
    expect(result.code).toBe(ErrorTypes.SYSTEM_ERROR);
    expect(result.statusCode).toBe(500);
    expect(result.details).toHaveProperty('originalError', originalError);
  });

  it('should handle unknown error types', () => {
    const result = handleError('string error');
    
    expect(result).toBeInstanceOf(AminoError);
    expect(result.message).toBe('An unknown error occurred');
    expect(result.code).toBe(ErrorTypes.SYSTEM_ERROR);
    expect(result.statusCode).toBe(500);
    expect(result.details).toHaveProperty('originalError', 'string error');
  });
});

describe('createApiResponse', () => {
  it('should create success response with data', () => {
    const data = { id: 1, name: 'Test' };
    const response = createApiResponse(data);
    
    expect(response.data).toBe(data);
    expect(response.error).toBeNull();
  });

  it('should create error response with null data', () => {
    const error = new Error('API Error');
    const response = createApiResponse(null, error);
    
    expect(response.data).toBeNull();
    expect(response.error).toBeInstanceOf(AminoError);
    expect(response.error?.message).toBe('API Error');
  });

  it('should handle AminoError in error response', () => {
    const error = new AminoError('Not Found', ErrorTypes.NOT_FOUND, 404);
    const response = createApiResponse({}, error);
    
    expect(response.data).toBeNull();
    expect(response.error).toBe(error);
  });
}); 