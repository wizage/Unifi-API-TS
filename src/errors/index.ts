/**
 * Error classes for UniFi API Client
 */

export abstract class UniFiError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode?: number;
  
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class AuthenticationError extends UniFiError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;
  
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, details);
  }
}

export class NetworkError extends UniFiError {
  readonly code = 'NETWORK_ERROR';
  readonly statusCode?: number;
  
  constructor(message: string, public readonly cause?: Error, statusCode?: number) {
    super(message, { cause: cause?.message, stack: cause?.stack });
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    }
  }
}

export class APIError extends UniFiError {
  readonly code = 'API_ERROR';
  
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: any
  ) {
    super(message, { statusCode, response });
  }
}

export class ValidationError extends UniFiError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  
  constructor(message: string, public readonly field?: string, public readonly value?: any) {
    super(message, { field, value });
  }
}

export class TimeoutError extends UniFiError {
  readonly code = 'TIMEOUT_ERROR';
  readonly statusCode = 408;
  
  constructor(message: string = 'Request timeout', public readonly timeout?: number) {
    super(message, { timeout });
  }
}

export class SessionExpiredError extends UniFiError {
  readonly code = 'SESSION_EXPIRED_ERROR';
  readonly statusCode = 401;
  
  constructor(message: string = 'Session has expired') {
    super(message);
  }
}

export class ConfigurationError extends UniFiError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode?: number = undefined;
  
  constructor(message: string, public readonly configField?: string) {
    super(message, { configField });
  }
}

/**
 * Error factory for creating appropriate error instances based on HTTP status codes
 */
export class ErrorFactory {
  static fromHttpStatus(status: number, message: string, response?: any): UniFiError {
    switch (status) {
      case 400:
        return new ValidationError(message, undefined, response);
      case 401:
        return new AuthenticationError(message, response);
      case 403:
        return new AuthenticationError('Access forbidden', response);
      case 404:
        return new APIError('Resource not found', status, response);
      case 408:
        return new TimeoutError(message);
      case 429:
        return new APIError('Rate limit exceeded', status, response);
      case 500:
      case 502:
      case 503:
      case 504:
        return new APIError('Server error', status, response);
      default:
        return new APIError(message, status, response);
    }
  }
  
  static fromNetworkError(error: Error): NetworkError {
    if (error.message.includes('timeout')) {
      return new NetworkError('Network timeout', error);
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      return new NetworkError('Connection refused - server may be down', error);
    }
    
    if (error.message.includes('ENOTFOUND')) {
      return new NetworkError('Host not found - check the URL', error);
    }
    
    if (error.message.includes('ECONNRESET')) {
      return new NetworkError('Connection reset by server', error);
    }
    
    return new NetworkError(error.message, error);
  }
}

/**
 * Input validation utilities
 */
export class ValidationUtils {
  static validateRequired(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError(`${fieldName} is required`, fieldName, value);
    }
  }
  
  static validateString(value: any, fieldName: string, minLength?: number, maxLength?: number): void {
    this.validateRequired(value, fieldName);
    
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`, fieldName, value);
    }
    
    if (minLength !== undefined && value.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, fieldName, value);
    }
    
    if (maxLength !== undefined && value.length > maxLength) {
      throw new ValidationError(`${fieldName} must be no more than ${maxLength} characters`, fieldName, value);
    }
  }
  
  static validateNumber(value: any, fieldName: string, min?: number, max?: number): void {
    this.validateRequired(value, fieldName);
    
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value);
    }
    
    if (min !== undefined && value < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName, value);
    }
    
    if (max !== undefined && value > max) {
      throw new ValidationError(`${fieldName} must be no more than ${max}`, fieldName, value);
    }
  }
  
  static validateUrl(value: any, fieldName: string): void {
    this.validateString(value, fieldName);
    
    try {
      new URL(value);
    } catch {
      throw new ValidationError(`${fieldName} must be a valid URL`, fieldName, value);
    }
  }
  
  static validateEmail(value: any, fieldName: string): void {
    this.validateString(value, fieldName);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid email address`, fieldName, value);
    }
  }
  
  static validateMacAddress(value: any, fieldName: string): void {
    this.validateString(value, fieldName);
    
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid MAC address`, fieldName, value);
    }
  }
}