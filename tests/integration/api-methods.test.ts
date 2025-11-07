/**
 * Integration tests for specific API methods
 * Tests various API endpoints with realistic mock responses
 */

import { UniFiClient } from '../../src/client/UniFiClient';
import { UniFiClientConfig } from '../../src/types/config';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios-cookiejar-support
jest.mock('axios-cookiejar-support', () => ({
  wrapper: jest.fn((instance) => instance)
}));

describe('API Methods Integration Tests', () => {
  let client: UniFiClient;
  let mockAxiosInstance: any;
  let config: UniFiClientConfig;

  beforeEach(async () => {
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

    // Setup authenticated client
    mockAxiosInstance.request.mockResolvedValue({
      data: {
        data: true,
        meta: { rc: 'ok', msg: 'Login successful' }
      }
    });
    await client.login();
  });

  describe('Site Management', () => {
    it('should list sites successfully', async () => {
      const mockSites = [
        {
          _id: '507f1f77bcf86cd799439014',
          name: 'default',
          desc: 'Default Site',
          role: 'admin'
        }
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: mockSites,
          meta: { rc: 'ok' }
        }
      });

      const sites = await client.list_sites();
      
      expect(sites).toEqual(mockSites);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/self/sites'
      });
    });

    it('should create site successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok' }
        }
      });

      const result = await client.create_site('New Site Description');
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/sitemgr',
        data: {
          cmd: 'add-site',
          desc: 'New Site Description'
        }
      });
    });
  });

  describe('Network Management', () => {
    it('should list network configurations', async () => {
      const mockNetworks = [
        {
          _id: '507f1f77bcf86cd799439015',
          name: 'LAN',
          purpose: 'corporate',
          ip_subnet: '192.168.1.1/24',
          networkgroup: 'LAN',
          enabled: true
        }
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: mockNetworks,
          meta: { rc: 'ok' }
        }
      });

      const networks = await client.list_networkconf();
      
      expect(networks).toEqual(mockNetworks);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/rest/networkconf'
      });
    });

    it('should create network successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok' }
        }
      });

      const networkConfig = {
        name: 'Guest Network',
        purpose: 'guest' as const,
        ip_subnet: '192.168.100.1/24'
      };

      const result = await client.create_network(networkConfig);
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/rest/networkconf',
        data: networkConfig
      });
    });
  });

  describe('System Information', () => {
    it('should get system info successfully', async () => {
      const mockSysInfo = {
        hostname: 'UniFi-Dream-Machine',
        version: '1.12.22',
        uptime: 86400,
        mem: '16384',
        cpu: '4'
      };

      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: [mockSysInfo],
          meta: { rc: 'ok' }
        }
      });

      const sysInfo = await client.stat_sysinfo();
      
      expect(sysInfo).toEqual([mockSysInfo]);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/stat/sysinfo'
      });
    });
  });

  describe('Events and Alarms', () => {
    it('should list events successfully', async () => {
      const mockEvents = [
        {
          _id: '507f1f77bcf86cd799439016',
          key: 'EVT_AP_Connected',
          datetime: '2024-01-01T12:00:00Z',
          msg: 'Access Point connected',
          ap: '00:11:22:33:44:55'
        }
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: mockEvents,
          meta: { rc: 'ok' }
        }
      });

      const events = await client.list_events();
      
      expect(events).toEqual(mockEvents);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/api/s/default/stat/event',
          data: expect.objectContaining({
            within: 720,
            _limit: 3000
          })
        })
      );
    });

    it('should list alarms successfully', async () => {
      const mockAlarms = [
        {
          _id: '507f1f77bcf86cd799439017',
          key: 'EVT_AP_Disconnected',
          datetime: '2024-01-01T11:00:00Z',
          msg: 'Access Point disconnected',
          ap: '00:11:22:33:44:55',
          archived: false
        }
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: mockAlarms,
          meta: { rc: 'ok' }
        }
      });

      const alarms = await client.list_alarms();
      
      expect(alarms).toEqual(mockAlarms);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/list/alarm'
      });
    });
  });

  describe('Advanced Client Operations', () => {
    it('should reconnect client successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok' }
        }
      });

      const result = await client.reconnect_sta('aa:bb:cc:dd:ee:ff');
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/stamgr',
        data: {
          cmd: 'kick-sta',
          mac: 'aa:bb:cc:dd:ee:ff'
        }
      });
    });

    it('should unauthorize guest successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'ok' }
        }
      });

      const result = await client.unauthorize_guest('aa:bb:cc:dd:ee:ff');
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/stamgr',
        data: {
          cmd: 'unauthorize-guest',
          mac: 'aa:bb:cc:dd:ee:ff'
        }
      });
    });
  });

  describe('Parameter Validation', () => {
    it('should validate MAC address format', async () => {
      await expect(client.adoptDevice('invalid-mac'))
        .rejects.toThrow('Invalid MAC address');
    });

    it('should validate required parameters', async () => {
      await expect(client.createWlan('', '', '', ''))
        .rejects.toThrow('Parameter name must be a non-empty string');
    });

    it('should validate string parameters', async () => {
      await expect(client.createSite(''))
        .rejects.toThrow('Parameter description must be a non-empty string');
    });
  });

  describe('Response Handling', () => {
    it('should handle empty data arrays', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: [],
          meta: { rc: 'ok' }
        }
      });

      const devices = await client.list_devices();
      expect(devices).toEqual([]);
    });

    it('should handle single item responses', async () => {
      const mockDevice = {
        _id: '507f1f77bcf86cd799439011',
        mac: '00:11:22:33:44:55',
        model: 'U6-Lite'
      };

      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: [mockDevice],
          meta: { rc: 'ok' }
        }
      });

      const devices = await client.list_devices('00:11:22:33:44:55');
      expect(devices[0]).toEqual(mockDevice);
    });

    it('should handle API error responses', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          data: true,
          meta: { rc: 'error', msg: 'Device not found' }
        }
      });

      await expect(client.list_devices('00:11:22:33:44:55'))
        .rejects.toThrow('Device not found');
    });
  });
});