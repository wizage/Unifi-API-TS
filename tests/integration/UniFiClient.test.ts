/**
 * Integration tests for UniFiClient API methods
 * Tests complete authentication and API call flows with mocked responses
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

describe('UniFiClient Integration Tests', () => {
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

  describe('Authentication Flow', () => {
    it('should complete full login flow', async () => {
      // Mock successful login
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
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
          data: true,
          meta: { rc: 'error', msg: 'Invalid credentials' }
        }
      });

      await expect(client.login()).rejects.toThrow(AuthenticationError);
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should complete logout flow', async () => {
      // Login first
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok', msg: 'Login successful' }
        }
      });
      await client.login();

      // Mock logout
      mockAxiosInstance.request.mockResolvedValue({
        data: { data: true, meta: { rc: 'ok' } }
      });

      const result = await client.logout();
      
      expect(result).toBe(true);
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('Device Management API', () => {
    beforeEach(async () => {
      // Setup authenticated client
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok', msg: 'Login successful' }
        }
      });
      await client.login();
    });

    it('should list devices successfully', async () => {
      const mockDevices = [
        {
          _id: '507f1f77bcf86cd799439011',
          mac: '00:11:22:33:44:55',
          model: 'U6-Lite',
          name: 'Living Room AP',
          type: 'uap',
          state: 1,
          adopted: true,
          ip: '192.168.1.100'
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
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/stat/device'
      });
    });

    it('should adopt device successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok' }
        }
      });

      const result = await client.adoptDevice('00:11:22:33:44:55');
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/devmgr',
        data: {
          cmd: 'adopt',
          macs: ['00:11:22:33:44:55']
        }
      });
    });

    it('should restart device successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok' }
        }
      });

      const result = await client.restartDevice('00:11:22:33:44:55');
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/devmgr',
        data: {
          cmd: 'restart',
          macs: ['00:11:22:33:44:55'],
          reboot_type: 'soft'
        }
      });
    });
  });

  describe('Client Management API', () => {
    beforeEach(async () => {
      // Setup authenticated client
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok', msg: 'Login successful' }
        }
      });
      await client.login();
    });

    it('should list users successfully', async () => {
      const mockUsers = [
        {
          _id: '507f1f77bcf86cd799439012',
          mac: 'aa:bb:cc:dd:ee:ff',
          ip: '192.168.1.50',
          hostname: 'laptop',
          is_guest: false,
          first_seen: 1640995200,
          last_seen: 1640995800
        }
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: mockUsers,
          meta: { rc: 'ok' }
        }
      });

      const users = await client.listUsers();
      
      expect(users).toEqual(mockUsers);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/stat/user'
      });
    });

    it('should block client successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok' }
        }
      });

      const result = await client.blockSta('aa:bb:cc:dd:ee:ff');
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/stamgr',
        data: {
          cmd: 'block-sta',
          mac: 'aa:bb:cc:dd:ee:ff'
        }
      });
    });

    it('should authorize guest successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok' }
        }
      });

      const result = await client.authorizeGuest('aa:bb:cc:dd:ee:ff', 60);
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/stamgr',
        data: {
          cmd: 'authorize-guest',
          mac: 'aa:bb:cc:dd:ee:ff',
          minutes: 60
        }
      });
    });
  });

  describe('WLAN Management API', () => {
    beforeEach(async () => {
      // Setup authenticated client
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok', msg: 'Login successful' }
        }
      });
      await client.login();
    });

    it('should list WLAN configurations successfully', async () => {
      const mockWlans = [
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'MyNetwork',
          enabled: true,
          security: 'wpapsk',
          wpa_enc: 'ccmp',
          wpa_mode: 'wpa2',
          x_passphrase: 'password123'
        }
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: mockWlans,
          meta: { rc: 'ok' }
        }
      });

      const wlans = await client.listWlanconf();
      
      expect(wlans).toEqual(mockWlans);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/rest/wlanconf'
      });
    });

    it('should create WLAN successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok' }
        }
      });

      // Use actual API signature for createWlan
      const result = await client.createWlan(
        'NewNetwork',
        'newpassword',
        'default-usergroup',
        'default-wlangroup',
        true
      );
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/rest/wlanconf',
        data: {
          name: 'NewNetwork',
          x_passphrase: 'newpassword',
          usergroup_id: 'default-usergroup',
          wlangroup_id: 'default-wlangroup',
          enabled: true,
          hide_ssid: false,
          is_guest: false,
          security: 'wpapsk',
          wpa_mode: 'wpa2',
          wpa_enc: 'ccmp'
        }
      });
    });
  });

  describe('Error Scenarios', () => {
    beforeEach(async () => {
      // Setup authenticated client
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok', msg: 'Login successful' }
        }
      });
      await client.login();
    });

    it('should handle API errors', async () => {
      const apiError = new APIError('Bad Request', 400, { error: 'Invalid parameter' });
      mockAxiosInstance.request.mockRejectedValue(apiError);

      await expect(client.listDevices()).rejects.toThrow(APIError);
    });

    it('should handle network errors', async () => {
      const networkError = new NetworkError('Connection failed');
      mockAxiosInstance.request.mockRejectedValue(networkError);

      await expect(client.listDevices()).rejects.toThrow(NetworkError);
    });

    it.skip('should re-authenticate on session expiry', async () => {
      // First call fails with auth error
      const authError = { response: { status: 401 }, message: 'Session expired' };
      mockAxiosInstance.request
        .mockRejectedValueOnce(authError)
        .mockResolvedValueOnce({
          data: {
            data: true,
            meta: { rc: 'ok', msg: 'Login successful' }
          }
        })
        .mockResolvedValueOnce({
          data: {
            data: [],
            meta: { rc: 'ok' }
          }
        });

      const result = await client.listDevices();
      
      expect(result).toEqual([]);
      // Should have made 3 calls: failed API call, re-login, successful API call
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3);
    });
  });

  describe('Request Cancellation', () => {
    beforeEach(async () => {
      // Setup authenticated client
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
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
          data: { data: true, meta: { rc: 'ok' } }
        });
      });

      // Cancel the request
      abortController.abort();

      await expect(client.listDevices(undefined, { signal: abortController.signal }))
        .rejects.toThrow('Request was cancelled');
    });
  });
});