/**
 * Unit tests for HTTPClient
 * Tests request/response handling, error handling, and core functionality
 */

import { HTTPClient, HTTPClientConfig } from '../../src/http/HTTPClient';
import { NetworkError, APIError, TimeoutError } from '../../src/errors';
import axios from 'axios';
import { CookieJar } from 'tough-cookie';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios-cookiejar-support
jest.mock('axios-cookiejar-support', () => ({
  wrapper: jest.fn((instance) => instance)
}));

describe('HTTPClient', () => {
  let httpClient: HTTPClient;
  let mockAxiosInstance: any;
  let config: HTTPClientConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock axios instance
    mockAxiosInstance = {
      create: jest.fn(),
      request: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: { jar: null },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    config = {
      baseURL: 'https://test.local:8443',
      timeout: 30000,
      verifySsl: false,
      debug: false
    };

    httpClient = new HTTPClient(config);
  });

  describe('constructor', () => {
    it('should create HTTPClient with default config', () => {
      const client = new HTTPClient({ baseURL: 'https://test.local' });
      expect(client).toBeInstanceOf(HTTPClient);
    });

    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: config.baseURL,
        timeout: config.timeout,
        httpsAgent: { rejectUnauthorized: false },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'UniFi-API-TypeScript-Client/1.0.0'
        }
      });
    });

    it('should setup interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('request method', () => {
    it('should make successful request', async () => {
      const responseData = { data: [{ id: 1 }], meta: { rc: 'ok' } };
      mockAxiosInstance.request.mockResolvedValue({ data: responseData });

      const result = await httpClient.request({
        method: 'GET',
        url: '/test'
      });

      expect(result).toEqual(responseData);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/test'
      });
    });

    it('should handle request cancellation', async () => {
      const abortController = new AbortController();
      abortController.abort();

      await expect(httpClient.request({
        method: 'GET',
        url: '/test',
        signal: abortController.signal
      })).rejects.toThrow('Request was cancelled');
    });

    it('should retry on server errors', async () => {
      const error = new Error('Server Error');
      (error as any).response = { status: 500 };
      
      mockAxiosInstance.request
        .mockRejectedValueOnce(error)
        .mockResolvedValue({ data: { meta: { rc: 'ok' } } });

      const result = await httpClient.request({
        method: 'GET',
        url: '/test',
        retries: 1
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ meta: { rc: 'ok' } });
    });

    it('should not retry on client errors', async () => {
      const error = new APIError('Client Error', 400);
      mockAxiosInstance.request.mockRejectedValue(error);

      await expect(httpClient.request({
        method: 'GET',
        url: '/test',
        retries: 3
      })).rejects.toThrow(APIError);

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      mockAxiosInstance.request.mockResolvedValue({ 
        data: { data: [], meta: { rc: 'ok' } } 
      });
    });

    it('should make GET request', async () => {
      await httpClient.get('/test');
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/test'
      });
    });

    it('should make POST request with data', async () => {
      const data = { test: 'data' };
      await httpClient.post('/test', data);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/test',
        data
      });
    });

    it('should make PUT request', async () => {
      const data = { test: 'data' };
      await httpClient.put('/test', data);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/test',
        data
      });
    });

    it('should make DELETE request', async () => {
      await httpClient.delete('/test');
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/test'
      });
    });
  });

  describe('cookie management', () => {
    it('should get cookie jar', () => {
      const jar = httpClient.getCookieJar();
      expect(jar).toBeInstanceOf(CookieJar);
    });

    it('should set cookie jar', () => {
      const newJar = new CookieJar();
      httpClient.setCookieJar(newJar);
      
      expect(httpClient.getCookieJar()).toBe(newJar);
    });

    it('should clear cookies', () => {
      const jar = httpClient.getCookieJar();
      const removeAllSpy = jest.spyOn(jar, 'removeAllCookiesSync');
      
      httpClient.clearCookies();
      
      expect(removeAllSpy).toHaveBeenCalled();
    });
  });

  describe('configuration methods', () => {
    it('should set base URL', () => {
      const newUrl = 'https://new.test.local';
      httpClient.setBaseURL(newUrl);
      
      expect(mockAxiosInstance.defaults.baseURL).toBe(newUrl);
    });

    it('should set timeout', () => {
      const newTimeout = 60000;
      httpClient.setTimeout(newTimeout);
      
      expect(mockAxiosInstance.defaults.timeout).toBe(newTimeout);
    });
  });
});