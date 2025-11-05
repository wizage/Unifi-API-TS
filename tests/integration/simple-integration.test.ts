/**
 * Simplified integration tests for UniFi Client
 * Tests core functionality without complex mocking
 */

import { UniFiClient } from '../../src/client/UniFiClient';
import { UniFiClientConfig } from '../../src/types/config';
import { AuthenticationError, NetworkError, APIError } from '../../src/errors';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios-cookiejar-support
jest.mock('axios-cookiejar-support', () => ({
  wrapper: jest.fn((instance) => instance)
}));

describe('UniFi Client Simple Integration Tests', () => {
  let client: UniFiClient;
  let mockAxiosInstance: any;
  let config: UniFiClientConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios instance
    mockAxiosInstance = {
      create: jest.fn(),
      request: jest.fn(),
      defaults: { jar: null },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    config = {
      baseUrl: 'https://test.local:8443',
      username: 'admin',
      password: 'password',
      site: 'default'
    };

    client = new UniFiClient(config);
  });

  describe('Authentication Integration', () => {
    it('should handle complete login flow', async () => {
      // Mock successful login
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: [],
          meta: { rc: 'ok', msg: 'Login successful' }
        }
      });

      const result = await client.login();
      
      expect(result).toBe(true);
      expect(client.isAuthenticated()).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/login',
        data: {
          username: 'admin',
          password: 'password',
          remember: false,
          strict: true
        }
      });
    });

    it('should handle login failure', async () => {
      // Mock failed login
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: [],
          meta: { rc: 'error', msg: 'Invalid credentials' }
        }
      });

      await expect(client.login()).rejects.toThrow(AuthenticationError);
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should handle logout', async () => {
      // Login first
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: [],
          meta: { rc: 'ok', msg: 'Login successful' }
        }
      });
      await client.login();

      // Mock logout
      mockAxiosInstance.request.mockResolvedValue({
        data: { data: [], meta: { rc: 'ok' } }
      });

      const result = await client.logout();
      
      expect(result).toBe(true);
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('API Method Integration', () => {
    beforeEach(async () => {
      // Setup authenticated client
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: [],
          meta: { rc: 'ok', msg: 'Login successful' }
        }
      });
      await client.login();
    });

    it('should make API calls after authentication', async () => {
      const mockDevices = [
        {
          _id: '507f1f77bcf86cd799439011',
          mac: '00:11:22:33:44:55',
          model: 'U6-Lite',
          name: 'Living Room AP'
        }
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: mockDevices,
          meta: { rc: 'ok' }
        }
      });

      const devices = await client.listDevices();
      
      expect(devices).toEqual(mockDevices);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('/stat/device')
        })
      );
    });

    it('should handle API errors', async () => {
      const apiError = new APIError('Bad Request', 400);
      mockAxiosInstance.request.mockRejectedValue(apiError);

      await expect(client.listDevices()).rejects.toThrow(APIError);
    });

    it('should handle network errors', async () => {
      const networkError = new NetworkError('Connection failed');
      mockAxiosInstance.request.mockRejectedValue(networkError);

      await expect(client.listDevices()).rejects.toThrow(NetworkError);
    });
  });

  describe('Request Cancellation Integration', () => {
    beforeEach(async () => {
      // Setup authenticated client
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: [],
          meta: { rc: 'ok', msg: 'Login successful' }
        }
      });
      await client.login();
    });

    it('should support request cancellation', async () => {
      const abortController = new AbortController();
      
      mockAxiosInstance.request.mockImplementation((config: any) => {
        if (config.signal?.aborted) {
          throw new Error('Request was cancelled');
        }
        return Promise.resolve({
          data: { data: [], meta: { rc: 'ok' } }
        });
      });

      // Cancel the request
      abortController.abort();

      await expect(client.listDevices(undefined, { signal: abortController.signal }))
        .rejects.toThrow('Request was cancelled');
    });
  });

  describe('Session Management Integration', () => {
    it('should maintain session state', async () => {
      // Login
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: [],
          meta: { rc: 'ok', msg: 'Login successful' }
        }
      });
      await client.login();

      const sessionInfo = client.getSessionInfo();
      expect(sessionInfo.isAuthenticated).toBe(true);
      expect(sessionInfo.username).toBe('admin');
      expect(sessionInfo.site).toBe('default');
    });

    it('should handle multiple API calls in sequence', async () => {
      // Initial login
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: [],
          meta: { rc: 'ok', msg: 'Login successful' }
        }
      });
      await client.login();

      // Mock successful API responses
      mockAxiosInstance.request
        .mockResolvedValueOnce({
          data: { data: [{ id: 1 }], meta: { rc: 'ok' } }
        })
        .mockResolvedValueOnce({
          data: { data: [{ id: 2 }], meta: { rc: 'ok' } }
        });

      const result1 = await client.listDevices();
      const result2 = await client.listUsers();
      
      expect(result1).toEqual([{ id: 1 }]);
      expect(result2).toEqual([{ id: 2 }]);
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3); // login + 2 API calls
    });
  });

  describe('Configuration Integration', () => {
    it('should validate configuration on creation', () => {
      expect(() => new UniFiClient({
        baseUrl: '',
        username: 'admin',
        password: 'password'
      })).toThrow('baseUrl is required');

      expect(() => new UniFiClient({
        baseUrl: 'https://test.local',
        username: '',
        password: 'password'
      })).toThrow('username is required');

      expect(() => new UniFiClient({
        baseUrl: 'https://test.local',
        username: 'admin',
        password: ''
      })).toThrow('password is required');
    });

    it('should use default site when not specified', () => {
      const clientWithoutSite = new UniFiClient({
        baseUrl: 'https://test.local',
        username: 'admin',
        password: 'password'
      });

      expect(clientWithoutSite.getSite()).toBe('default');
    });
  });
});