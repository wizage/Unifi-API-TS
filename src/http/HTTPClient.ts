/**
 * HTTP Client with session management for UniFi API
 * 
 * Provides a robust HTTP client with automatic cookie management, error handling,
 * retry logic, and request/response interceptors for the UniFi API.
 * 
 * @example
 * ```typescript
 * const httpClient = new HTTPClient({
 *   baseURL: 'https://unifi.example.com:8443',
 *   timeout: 30000,
 *   verifySsl: false,
 *   debug: true
 * });
 * 
 * const response = await httpClient.get('/api/self');
 * ```
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { CookieJar } from 'tough-cookie';

// Import axios-cookiejar-support
const axiosCookieJarSupport = require('axios-cookiejar-support');
const { wrapper } = axiosCookieJarSupport;
import { RequestOptions } from '../types/config';
import { APIResponse } from '../types/api';
import { APIError, ErrorFactory, TimeoutError } from '../errors';

export interface HTTPClientConfig {
  baseURL: string;
  timeout?: number | undefined;
  verifySsl?: boolean | undefined;
  debug?: boolean | undefined;
}

export interface RequestConfig extends AxiosRequestConfig {
  retries?: number;
  signal?: AbortSignal;
}

export class HTTPClient {
  private client: AxiosInstance;
  private cookieJar: CookieJar;
  private debug: boolean;

  /**
   * Creates a new HTTP client instance
   * 
   * @param config - HTTP client configuration
   * @param config.baseURL - Base URL for all requests
   * @param config.timeout - Request timeout in milliseconds (default: 30000)
   * @param config.verifySsl - Whether to verify SSL certificates (default: true)
   * @param config.debug - Enable debug logging (default: false)
   */
  constructor(config: HTTPClientConfig) {
    this.cookieJar = new CookieJar();
    this.debug = config.debug || false;
    
    // Create axios instance with cookie support
    this.client = wrapper(axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      httpsAgent: config.verifySsl === false ? {
        rejectUnauthorized: false
      } : undefined,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'UniFi-API-TypeScript-Client/1.0.0'
      }
    }));

    // Set cookie jar after creation
    (this.client.defaults as any).jar = this.cookieJar;

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        if (this.debug) {
          console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`);
          if (config.data) {
            console.log('[HTTP] Request data:', config.data);
          }
        }
        return config;
      },
      (error) => {
        if (this.debug) {
          console.error('[HTTP] Request error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and debugging
    this.client.interceptors.response.use(
      (response) => {
        if (this.debug) {
          console.log(`[HTTP] ${response.status} ${response.config.url}`);
          console.log('[HTTP] Response data:', response.data);
        }
        return response;
      },
      (error: AxiosError) => {
        if (this.debug) {
          console.error('[HTTP] Response error:', error.message);
          if (error.response) {
            console.error('[HTTP] Error response:', error.response.data);
          }
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new TimeoutError('Request timeout');
    }

    // Handle network errors
    if (!error.response) {
      return ErrorFactory.fromNetworkError(error);
    }

    // Handle HTTP errors with response
    const status = error.response.status;
    const data = error.response.data;
    let message = error.message;

    // Try to extract a more meaningful message from the response
    if (data && typeof data === 'object') {
      const responseData = data as any;
      if (responseData.meta && responseData.meta.msg) {
        message = responseData.meta.msg;
      } else if (responseData.message) {
        message = responseData.message;
      } else if (responseData.error) {
        message = responseData.error;
      }
    }

    return ErrorFactory.fromHttpStatus(status, message, data);
  }

  /**
   * Makes an HTTP request with retry logic and error handling
   * 
   * @template T - Expected response data type
   * @param config - Request configuration
   * @param config.retries - Number of retry attempts (default: 0)
   * @param config.signal - AbortSignal for request cancellation
   * @returns Promise resolving to API response
   * @throws {NetworkError} When network connectivity fails
   * @throws {APIError} When API returns an error response
   * @throws {TimeoutError} When request times out
   * 
   * @example
   * ```typescript
   * const response = await httpClient.request<Device[]>({
   *   method: 'GET',
   *   url: '/api/s/default/stat/device',
   *   retries: 3
   * });
   * ```
   */
  async request<T = any>(config: RequestConfig): Promise<APIResponse<T>> {
    const maxRetries = config.retries || 0;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check if request was cancelled before making the request
        if (config.signal?.aborted) {
          throw new Error('Request was cancelled');
        }

        const response: AxiosResponse<APIResponse<T>> = await this.client.request({
          ...config,
          ...(config.signal && { signal: config.signal })
        });
        
        // Check for UniFi API errors in the response
        if (response.data && response.data.meta && response.data.meta.rc === 'error') {
          throw new APIError(response.data.meta.msg || 'API Error', 400, response.data);
        }
        
        return response.data;
      } catch (error) {
        lastError = error as Error;
        
        // Handle cancellation errors
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('cancelled'))) {
          throw new Error('Request was cancelled');
        }
        
        // Don't retry on authentication errors or client errors (4xx)
        if (error instanceof APIError && error.statusCode && error.statusCode < 500) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Don't retry if request was cancelled
        if (config.signal?.aborted) {
          throw new Error('Request was cancelled');
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Makes a GET request
   * 
   * @template T - Expected response data type
   * @param url - Request URL
   * @param options - Request options including signal for cancellation
   * @returns Promise resolving to API response
   * 
   * @example
   * ```typescript
   * const devices = await httpClient.get<Device[]>('/api/s/default/stat/device');
   * ```
   */
  async get<T = any>(url: string, options?: RequestOptions & { signal?: AbortSignal }): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      ...options
    });
  }

  /**
   * Makes a POST request
   * 
   * @template T - Expected response data type
   * @param url - Request URL
   * @param data - Request body data
   * @param options - Request options including signal for cancellation
   * @returns Promise resolving to API response
   * 
   * @example
   * ```typescript
   * const result = await httpClient.post('/api/s/default/cmd/stamgr', {
   *   cmd: 'authorize-guest',
   *   mac: '00:11:22:33:44:55'
   * });
   * ```
   */
  async post<T = any>(url: string, data?: any, options?: RequestOptions & { signal?: AbortSignal }): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...options
    });
  }

  /**
   * Makes a PUT request
   * 
   * @template T - Expected response data type
   * @param url - Request URL
   * @param data - Request body data
   * @param options - Request options including signal for cancellation
   * @returns Promise resolving to API response
   */
  async put<T = any>(url: string, data?: any, options?: RequestOptions & { signal?: AbortSignal }): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...options
    });
  }

  /**
   * Makes a DELETE request
   * 
   * @template T - Expected response data type
   * @param url - Request URL
   * @param options - Request options including signal for cancellation
   * @returns Promise resolving to API response
   */
  async delete<T = any>(url: string, options?: RequestOptions & { signal?: AbortSignal }): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...options
    });
  }

  /**
   * Updates the base URL for all requests
   * 
   * @param url - New base URL
   */
  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }

  /**
   * Updates the request timeout
   * 
   * @param timeout - Timeout in milliseconds
   */
  setTimeout(timeout: number): void {
    this.client.defaults.timeout = timeout;
  }

  /**
   * Gets the current cookie jar instance
   * 
   * @returns The cookie jar containing session cookies
   */
  getCookieJar(): CookieJar {
    return this.cookieJar;
  }

  /**
   * Sets a new cookie jar instance
   * 
   * @param jar - Cookie jar to use for session management
   */
  setCookieJar(jar: CookieJar): void {
    this.cookieJar = jar;
    (this.client.defaults as any).jar = jar;
  }

  /**
   * Clears all cookies from the cookie jar
   * 
   * This effectively logs out the client by removing session cookies.
   */
  clearCookies(): void {
    this.cookieJar.removeAllCookiesSync();
  }
}