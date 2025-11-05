/**
 * End-to-end tests for request cancellation functionality
 * Tests AbortController integration and proper cleanup
 */

import { UniFiClient } from '../../src/client/UniFiClient';
import { UniFiClientConfig } from '../../src/types/config';
import { MockUniFiController } from '../fixtures/mock-controller';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios-cookiejar-support
jest.mock('axios-cookiejar-support', () => ({
  wrapper: jest.fn((instance) => instance)
}));

describe.skip('Request Cancellation E2E Tests', () => {
  let client: UniFiClient;
  let mockController: MockUniFiController;
  let mockAxiosInstance: any;
  let config: UniFiClientConfig;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create mock controller with network delay
    mockController = new MockUniFiController({
      username: 'admin',
      password: 'password',
      site: 'default',
      simulateNetworkDelay: true
    });

    // Mock axios instance
    mockAxiosInstance = {
      create: jest.fn(),
      request: jest.fn().mockImplementation(async (config) => {
        // Check for cancellation before processing
        if (config.signal?.aborted) {
          throw new Error('Request was cancelled');
        }

        const response = await mockController.handleRequest(
          config.method?.toUpperCase() || 'GET',
          config.url || '',
          config.data,
          config.headers
        );

        // Check for cancellation after processing
        if (config.signal?.aborted) {
          throw new Error('Request was cancelled');
        }

        return { data: response };
      }),
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
    await client.login();
  });

  afterEach(() => {
    mockController.reset();
  });

  describe('Basic Cancellation', () => {
    it('should cancel request immediately', async () => {
      const abortController = new AbortController();
      abortController.abort();

      await expect(client.listDevices(undefined, { signal: abortController.signal }))
        .rejects.toThrow('Request was cancelled');
    });

    it('should cancel request during execution', async () => {
      const abortController = new AbortController();
      
      // Start request and cancel after a short delay
      const promise = client.listDevices(undefined, { signal: abortController.signal });
      
      setTimeout(() => {
        abortController.abort();
      }, 50);

      await expect(promise).rejects.toThrow();
    });

    it('should complete request if not cancelled', async () => {
      const abortController = new AbortController();
      
      const devices = await client.listDevices(undefined, { signal: abortController.signal });
      
      expect(devices).toBeDefined();
      expect(Array.isArray(devices)).toBe(true);
    });
  });

  describe('Multiple Request Cancellation', () => {
    it('should cancel multiple concurrent requests', async () => {
      const abortController = new AbortController();
      
      const promises = [
        client.listDevices(undefined, { signal: abortController.signal }),
        client.listUsers(undefined, { signal: abortController.signal }),
        client.listWlanconf(undefined, { signal: abortController.signal }),
        client.listNetworkconf(undefined, { signal: abortController.signal })
      ];

      // Cancel all requests
      setTimeout(() => {
        abortController.abort();
      }, 50);

      const results = await Promise.allSettled(promises);
      
      // All requests should be rejected
      results.forEach(result => {
        expect(result.status).toBe('rejected');
      });
    });

    it('should cancel some requests while others complete', async () => {
      const abortController1 = new AbortController();
      const abortController2 = new AbortController();
      
      const promises = [
        client.listDevices(undefined, { signal: abortController1.signal }),
        client.listUsers(undefined, { signal: abortController2.signal })
      ];

      // Cancel only the first request
      setTimeout(() => {
        abortController1.abort();
      }, 50);

      const results = await Promise.allSettled(promises);
      
      expect(results[0]?.status).toBe('rejected');
      expect(results[1]?.status).toBe('fulfilled');
    });
  });

  describe('Cancellation with Authentication', () => {
    it('should cancel login request', async () => {
      const newClient = new UniFiClient(config);
      const abortController = new AbortController();
      
      // Cancel immediately
      abortController.abort();

      // Mock the login request to check for cancellation
      mockAxiosInstance.request.mockImplementation(async (config: any) => {
        if (config.signal?.aborted) {
          throw new Error('Request was cancelled');
        }
        return { data: { data: [], meta: { rc: 'ok' } } };
      });

      await expect(newClient.login()).rejects.toThrow();
    });

    it('should handle cancellation during re-authentication', async () => {
      // Simulate session expiry
      mockController.simulateSessionExpiry();
      
      const abortController = new AbortController();
      
      // Start API call that will trigger re-authentication
      const promise = client.listDevices(undefined, { signal: abortController.signal });
      
      // Cancel during re-authentication
      setTimeout(() => {
        abortController.abort();
      }, 25);

      await expect(promise).rejects.toThrow();
    });
  });

  describe('Cancellation Edge Cases', () => {
    it('should handle cancellation after request completion', async () => {
      const abortController = new AbortController();
      
      const devices = await client.listDevices(undefined, { signal: abortController.signal });
      
      // Cancel after completion (should not affect result)
      abortController.abort();
      
      expect(devices).toBeDefined();
    });

    it('should handle multiple cancellations of same controller', async () => {
      const abortController = new AbortController();
      
      abortController.abort();
      abortController.abort(); // Second abort should be safe
      
      await expect(client.listDevices(undefined, { signal: abortController.signal }))
        .rejects.toThrow('Request was cancelled');
    });

    it('should handle cancellation without signal', async () => {
      // Request without signal should work normally
      const devices = await client.listDevices();
      expect(devices).toBeDefined();
    });
  });

  describe('Cancellation with Different API Methods', () => {
    it('should cancel device management operations', async () => {
      const abortController = new AbortController();
      abortController.abort();

      await expect(client.adoptDevice('00:11:22:33:44:55', { signal: abortController.signal }))
        .rejects.toThrow('Request was cancelled');

      await expect(client.restartDevice('00:11:22:33:44:55', undefined, { signal: abortController.signal }))
        .rejects.toThrow('Request was cancelled');
    });

    it('should cancel client management operations', async () => {
      const abortController = new AbortController();
      abortController.abort();

      await expect(client.blockSta('aa:bb:cc:dd:ee:ff', { signal: abortController.signal }))
        .rejects.toThrow('Request was cancelled');

      await expect(client.authorizeGuest('aa:bb:cc:dd:ee:ff', 60, undefined, undefined, undefined, undefined, { signal: abortController.signal }))
        .rejects.toThrow('Request was cancelled');
    });

    it('should cancel WLAN operations', async () => {
      const abortController = new AbortController();
      abortController.abort();

      await expect(client.createWlan(
        'TestNetwork',
        'password',
        'default-usergroup',
        'default-wlangroup',
        true,
        false,
        false,
        'wpapsk',
        'wpa2',
        'ccmp',
        { signal: abortController.signal }
      )).rejects.toThrow('Request was cancelled');
    });
  });

  describe('Cancellation Cleanup', () => {
    it('should not leave hanging promises after cancellation', async () => {
      const abortController = new AbortController();
      
      const promise = client.listDevices(undefined, { signal: abortController.signal });
      abortController.abort();

      try {
        await promise;
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Subsequent requests should work normally
      const devices = await client.listDevices();
      expect(devices).toBeDefined();
    });

    it('should maintain session state after cancellation', async () => {
      const abortController = new AbortController();
      
      const promise = client.listDevices(undefined, { signal: abortController.signal });
      abortController.abort();

      try {
        await promise;
      } catch (error) {
        // Expected
      }

      // Session should still be active
      expect(client.isAuthenticated()).toBe(true);
      
      // New requests should work
      const users = await client.listUsers();
      expect(users).toBeDefined();
    });
  });

  describe('Performance with Cancellation', () => {
    it('should handle rapid cancellation and retry', async () => {
      const results = [];
      
      for (let i = 0; i < 5; i++) {
        const abortController = new AbortController();
        
        try {
          if (i % 2 === 0) {
            // Cancel every other request
            setTimeout(() => abortController.abort(), 10);
          }
          
          const devices = await client.listDevices(undefined, { signal: abortController.signal });
          results.push(devices);
        } catch (error) {
          // Expected for cancelled requests
        }
      }
      
      // Some requests should have succeeded
      expect(results.length).toBeGreaterThan(0);
    });

    it('should not impact performance of non-cancelled requests', async () => {
      const startTime = Date.now();
      
      // Make requests without cancellation
      await Promise.all([
        client.listDevices(),
        client.listUsers(),
        client.listWlanconf()
      ]);
      
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time (accounting for mock delay)
      expect(duration).toBeLessThan(2000);
    });
  });
});