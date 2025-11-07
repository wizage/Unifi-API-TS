/**
 * End-to-end tests for UniFi Client lifecycle
 * Tests complete workflows with mock controller
 */

import { UniFiClient } from '../../src/client/UniFiClient';
import { UniFiClientConfig } from '../../src/types/config';
import { MockUniFiController } from '../fixtures/mock-controller';
import { AuthenticationError, NetworkError } from '../../src/errors';
import axios from 'axios';

// Mock axios to use our mock controller
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios-cookiejar-support
jest.mock('axios-cookiejar-support', () => ({
  wrapper: jest.fn((instance) => instance)
}));

describe('UniFi Client E2E Tests', () => {
  let client: UniFiClient;
  let mockController: MockUniFiController;
  let mockAxiosInstance: any;
  let config: UniFiClientConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock controller
    mockController = new MockUniFiController({
      username: 'admin',
      password: 'password',
      site: 'default'
    });

    // Mock axios instance that delegates to our mock controller
    mockAxiosInstance = {
      create: jest.fn(),
      request: jest.fn().mockImplementation(async (config) => {
        const response = await mockController.handleRequest(
          config.method?.toUpperCase() || 'GET',
          config.url || '',
          config.data,
          config.headers
        );
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
  });

  afterEach(() => {
    mockController.reset();
  });

  describe('Complete Authentication Workflow', () => {
    it('should complete full login-logout cycle', async () => {
      // Initial state
      expect(client.isAuthenticated()).toBe(false);
      expect(mockController.isSessionActive()).toBe(false);

      // Login
      const loginResult = await client.login();
      expect(loginResult).toBe(true);
      expect(client.isAuthenticated()).toBe(true);
      expect(mockController.isSessionActive()).toBe(true);

      // Logout
      const logoutResult = await client.logout();
      expect(logoutResult).toBe(true);
      expect(client.isAuthenticated()).toBe(false);
      expect(mockController.isSessionActive()).toBe(false);
    });

    it('should handle authentication failure', async () => {
      const invalidClient = new UniFiClient({
        ...config,
        password: 'wrongpassword'
      });

      await expect(invalidClient.login()).rejects.toThrow(AuthenticationError);
      expect(invalidClient.isAuthenticated()).toBe(false);
    });

    it.skip('should handle session expiry and re-authentication', async () => {
      // Login successfully
      await client.login();
      expect(client.isAuthenticated()).toBe(true);

      // Simulate session expiry
      mockController.simulateSessionExpiry();

      // First API call should trigger re-authentication
      const devices = await client.listDevices();
      expect(devices).toBeDefined();
      expect(mockController.isSessionActive()).toBe(true);
    });
  });

  describe('Device Management Workflow', () => {
    beforeEach(async () => {
      await client.login();
    });

    it('should complete device discovery and management', async () => {
      // List devices
      const devices = await client.listDevices();
      expect(devices).toHaveLength(2);
      expect(devices[0]).toHaveProperty('mac');
      expect(devices[0]).toHaveProperty('model');

      // Adopt a device
      const adoptResult = await client.adoptDevice('00:11:22:33:44:55');
      expect(adoptResult).toBe(true);

      // Restart a device
      const restartResult = await client.restartDevice('00:11:22:33:44:55');
      expect(restartResult).toBe(true);
    });

    it('should handle device operation errors', async () => {
      await expect(client.adoptDevice('invalid-mac'))
        .rejects.toThrow('Invalid MAC address');
    });
  });

  describe('Client Management Workflow', () => {
    beforeEach(async () => {
      await client.login();
    });

    it('should complete client management operations', async () => {
      // List connected clients
      const clients = await client.listUsers();
      expect(clients).toHaveLength(2);
      expect(clients[0]).toHaveProperty('mac');
      expect(clients[0]).toHaveProperty('ip');

      // Block a client
      const blockResult = await client.blockSta('bb:cc:dd:ee:ff:00');
      expect(blockResult).toBe(true);

      // Authorize guest
      const authResult = await client.authorizeGuest('cc:dd:ee:ff:00:11', 60);
      expect(authResult).toBe(true);

      // Reconnect client
      const reconnectResult = await client.reconnectSta('bb:cc:dd:ee:ff:00');
      expect(reconnectResult).toBe(true);
    });
  });

  describe('Network Configuration Workflow', () => {
    beforeEach(async () => {
      await client.login();
    });

    it('should manage WLAN configurations', async () => {
      // List WLANs
      const wlans = await client.listWlanconf();
      expect(wlans).toHaveLength(2);
      expect(wlans[0]).toHaveProperty('name');
      expect(wlans[0]).toHaveProperty('security');

      // Create new WLAN
      const createResult = await client.createWlan(
        'TestNetwork',
        'testpassword',
        'default-usergroup',
        'default-wlangroup',
        true
      );
      expect(createResult).toBe(true);
    });

    it('should manage network configurations', async () => {
      // List networks
      const networks = await client.listNetworkconf();
      expect(networks).toHaveLength(2);
      expect(networks[0]).toHaveProperty('name');
      expect(networks[0]).toHaveProperty('ip_subnet');

      // Create new network
      const createResult = await client.createNetwork({
        name: 'TestNetwork',
        purpose: 'corporate' as const,
        ip_subnet: '192.168.200.1/24'
      });
      expect(createResult).toBe(true);
    });
  });

  describe('System Monitoring Workflow', () => {
    beforeEach(async () => {
      await client.login();
    });

    it('should retrieve system information', async () => {
      const sysInfo = await client.statSysinfo();
      expect(Array.isArray(sysInfo)).toBe(true);
      expect(sysInfo.length).toBeGreaterThan(0);
      expect(sysInfo[0]).toHaveProperty('hostname');
      expect(sysInfo[0]).toHaveProperty('version');
      expect(sysInfo[0]).toHaveProperty('uptime');
    });

    it('should retrieve events and alarms', async () => {
      // Get events
      const events = await client.listEvents();
      expect(events).toHaveLength(2);
      expect(events[0]).toHaveProperty('key');
      expect(events[0]).toHaveProperty('datetime');

      // Get alarms
      const alarms = await client.listAlarms();
      expect(alarms).toHaveLength(1);
      expect(alarms[0]).toHaveProperty('key');
      expect(alarms[0]).toHaveProperty('archived');
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await client.login();
    });

    it('should handle network errors gracefully', async () => {
      // Enable error simulation
      mockController.enableErrorSimulation(true);
      mockController.setErrorRate(1.0); // 100% error rate

      await expect(client.listDevices()).rejects.toThrow('Simulated network error');

      // Disable errors and retry
      mockController.enableErrorSimulation(false);
      const devices = await client.listDevices();
      expect(devices).toBeDefined();
    });

    it('should handle API errors with proper error types', async () => {
      await expect(client.adoptDevice('invalid-mac'))
        .rejects.toThrow('Invalid MAC address');
    });
  });

  describe('Performance and Reliability', () => {
    beforeEach(async () => {
      await client.login();
    });

    it('should handle multiple concurrent requests', async () => {
      const promises = [
        client.listDevices(),
        client.listUsers(),
        client.listWlanconf(),
        client.listNetworkconf(),
        client.statSysinfo()
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should maintain session across multiple requests', async () => {
      // Make multiple requests
      await client.listDevices();
      await client.listUsers();
      await client.listWlanconf();
      
      // Session should still be active
      expect(client.isAuthenticated()).toBe(true);
      expect(mockController.isSessionActive()).toBe(true);
    });

    it.skip('should handle request cancellation', async () => {
      const abortController = new AbortController();
      
      // Start a request and immediately cancel it
      const promise = client.listDevices(undefined, { signal: abortController.signal });
      abortController.abort();

      // The request should be cancelled
      await expect(promise).rejects.toThrow();
    });
  });

  describe('Site Management', () => {
    beforeEach(async () => {
      await client.login();
    });

    it('should manage sites', async () => {
      // List sites
      const sites = await client.listSites();
      expect(sites).toHaveLength(1);
      expect(sites[0]).toHaveProperty('name', 'default');

      // Create site
      const createResult = await client.createSite('New Site');
      expect(createResult).toBe(true);
    });
  });

  describe('Request Metrics', () => {
    beforeEach(async () => {
      await client.login();
    });

    it('should track request count', async () => {
      const initialCount = mockController.getRequestCount();
      
      await client.listDevices();
      await client.listUsers();
      
      const finalCount = mockController.getRequestCount();
      expect(finalCount).toBeGreaterThan(initialCount);
    });
  });
});