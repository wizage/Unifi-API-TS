/**
 * Unit tests for error handling and validation
 * Tests error types, error factory, and validation utilities
 */

import { 
  UniFiError, 
  AuthenticationError, 
  NetworkError, 
  APIError, 
  TimeoutError,
  SessionExpiredError,
  ConfigurationError,
  ValidationError,
  ErrorFactory,
  ValidationUtils
} from '../../src/errors';

describe('Error Classes', () => {
  describe('UniFiError (abstract)', () => {
    it('should be extended by concrete error classes', () => {
      const error = new AuthenticationError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UniFiError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError('Login failed');
      
      expect(error).toBeInstanceOf(UniFiError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Login failed');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should include response data', () => {
      const responseData = { meta: { msg: 'Invalid credentials' } };
      const error = new AuthenticationError('Login failed', responseData);
      
      expect(error.details).toBe(responseData);
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const cause = new Error('Connection refused');
      const error = new NetworkError('Network failure', cause);
      
      expect(error).toBeInstanceOf(UniFiError);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Network failure');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.cause).toBe(cause);
    });
  });

  describe('APIError', () => {
    it('should create API error with status code', () => {
      const error = new APIError('Bad request', 400);
      
      expect(error).toBeInstanceOf(UniFiError);
      expect(error).toBeInstanceOf(APIError);
      expect(error.message).toBe('Bad request');
      expect(error.code).toBe('API_ERROR');
      expect(error.statusCode).toBe(400);
    });

    it('should include response data', () => {
      const responseData = { error: 'Invalid parameter' };
      const error = new APIError('Bad request', 400, responseData);
      
      expect(error.response).toBe(responseData);
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError('Request timeout');
      
      expect(error).toBeInstanceOf(UniFiError);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toBe('Request timeout');
      expect(error.code).toBe('TIMEOUT_ERROR');
    });
  });

  describe('SessionExpiredError', () => {
    it('should create session expired error', () => {
      const error = new SessionExpiredError('Session has expired');
      
      expect(error).toBeInstanceOf(UniFiError);
      expect(error).toBeInstanceOf(SessionExpiredError);
      expect(error.message).toBe('Session has expired');
      expect(error.code).toBe('SESSION_EXPIRED_ERROR');
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('Invalid config');
      
      expect(error).toBeInstanceOf(UniFiError);
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.message).toBe('Invalid config');
      expect(error.code).toBe('CONFIGURATION_ERROR');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid parameter', 'username');
      
      expect(error).toBeInstanceOf(UniFiError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid parameter');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('username');
    });
  });
});

describe('ErrorFactory', () => {
  describe('fromHttpStatus', () => {
    it('should create AuthenticationError for 401', () => {
      const error = ErrorFactory.fromHttpStatus(401, 'Unauthorized');
      
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Unauthorized');
      expect((error as APIError).statusCode).toBe(401);
    });

    it('should create AuthenticationError for 403', () => {
      const error = ErrorFactory.fromHttpStatus(403, 'Forbidden');
      
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Access forbidden');
    });

    it('should create ValidationError for 400', () => {
      const error = ErrorFactory.fromHttpStatus(400, 'Bad Request');
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).not.toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Bad Request');
      expect((error as ValidationError).statusCode).toBe(400);
    });

    it('should create APIError for 500', () => {
      const error = ErrorFactory.fromHttpStatus(500, 'Internal Server Error');
      
      expect(error).toBeInstanceOf(APIError);
      expect(error.message).toBe('Server error');
      expect((error as APIError).statusCode).toBe(500);
    });

    it('should include response data', () => {
      const responseData = { error: 'Details' };
      const error = ErrorFactory.fromHttpStatus(400, 'Bad Request', responseData);
      
      expect((error as ValidationError).value).toBe(responseData);
    });
  });

  describe('fromNetworkError', () => {
    it('should create NetworkError from axios error', () => {
      const axiosError = {
        message: 'Network Error',
        code: 'ECONNREFUSED',
        isAxiosError: true
      } as any;
      
      const error = ErrorFactory.fromNetworkError(axiosError);
      
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Network Error');
      expect((error as NetworkError).cause).toBe(axiosError);
    });

    it('should create NetworkError from generic error', () => {
      const genericError = new Error('Connection failed');
      
      const error = ErrorFactory.fromNetworkError(genericError);
      
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Connection failed');
      expect((error as NetworkError).cause).toBe(genericError);
    });
  });
});

describe('ValidationUtils', () => {
  describe('validateString', () => {
    it('should validate valid string', () => {
      expect(() => ValidationUtils.validateString('test', 'field')).not.toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => ValidationUtils.validateString('', 'field'))
        .toThrow(ValidationError);
    });

    it('should throw for null/undefined', () => {
      expect(() => ValidationUtils.validateString(null as any, 'field'))
        .toThrow(ValidationError);
      expect(() => ValidationUtils.validateString(undefined as any, 'field'))
        .toThrow(ValidationError);
    });

    it('should validate minimum length', () => {
      expect(() => ValidationUtils.validateString('ab', 'field', 3))
        .toThrow(ValidationError);
      expect(() => ValidationUtils.validateString('abc', 'field', 3))
        .not.toThrow();
    });
  });

  describe('validateNumber', () => {
    it('should validate valid number', () => {
      expect(() => ValidationUtils.validateNumber(42, 'field')).not.toThrow();
    });

    it('should throw for non-number', () => {
      expect(() => ValidationUtils.validateNumber('42' as any, 'field'))
        .toThrow(ValidationError);
      expect(() => ValidationUtils.validateNumber(null as any, 'field'))
        .toThrow(ValidationError);
    });

    it('should validate minimum value', () => {
      expect(() => ValidationUtils.validateNumber(5, 'field', 10))
        .toThrow(ValidationError);
      expect(() => ValidationUtils.validateNumber(15, 'field', 10))
        .not.toThrow();
    });
  });

  describe('validateUrl', () => {
    it('should validate valid URLs', () => {
      expect(() => ValidationUtils.validateUrl('https://example.com', 'url'))
        .not.toThrow();
      expect(() => ValidationUtils.validateUrl('http://192.168.1.1:8443', 'url'))
        .not.toThrow();
    });

    it('should throw for invalid URLs', () => {
      expect(() => ValidationUtils.validateUrl('not-a-url', 'url'))
        .toThrow(ValidationError);
      expect(() => ValidationUtils.validateUrl('', 'url'))
        .toThrow(ValidationError);
    });
  });

  describe('validateMacAddress', () => {
    it('should validate valid MAC addresses', () => {
      expect(() => ValidationUtils.validateMacAddress('00:11:22:33:44:55', 'mac'))
        .not.toThrow();
      expect(() => ValidationUtils.validateMacAddress('aa:bb:cc:dd:ee:ff', 'mac'))
        .not.toThrow();
      expect(() => ValidationUtils.validateMacAddress('AA:BB:CC:DD:EE:FF', 'mac'))
        .not.toThrow();
    });

    it('should throw for invalid MAC addresses', () => {
      expect(() => ValidationUtils.validateMacAddress('invalid-mac', 'mac'))
        .toThrow(ValidationError);
      expect(() => ValidationUtils.validateMacAddress('00:11:22:33:44', 'mac'))
        .toThrow(ValidationError);
      expect(() => ValidationUtils.validateMacAddress('00:11:22:33:44:gg', 'mac'))
        .toThrow(ValidationError);
    });
  });

  describe('validateEmail', () => {
    it('should validate valid email addresses', () => {
      expect(() => ValidationUtils.validateEmail('test@example.com', 'email'))
        .not.toThrow();
      expect(() => ValidationUtils.validateEmail('user.name+tag@domain.co.uk', 'email'))
        .not.toThrow();
    });

    it('should throw for invalid email addresses', () => {
      expect(() => ValidationUtils.validateEmail('invalid-email', 'email'))
        .toThrow(ValidationError);
      expect(() => ValidationUtils.validateEmail('test@', 'email'))
        .toThrow(ValidationError);
      expect(() => ValidationUtils.validateEmail('@example.com', 'email'))
        .toThrow(ValidationError);
    });
  });
});