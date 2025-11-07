/**
 * Network Management API Unit Tests
 */

import { NetworkManagementAPI } from '../../src/api/network-management/NetworkManagementAPI';
import { HTTPClient } from '../../src/http/HTTPClient';

describe('NetworkManagementAPI', () => {
  let networkAPI: NetworkManagementAPI;
  let mockHttpClient: jest.Mocked<HTTPClient>;

  beforeEach(() => {
    // Create mock HTTP client
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
      request: jest.fn(),
    } as any;

    networkAPI = new NetworkManagementAPI(mockHttpClient);
  });

  describe('list_networkconf', () => {
    it('should call HTTP client with correct parameters', async () => {
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

      mockHttpClient.request.mockResolvedValue({
        data: mockNetworks,
        meta: { rc: 'ok' }
      });

      const result = await networkAPI.list_networkconf();

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/rest/networkconf'
      });
      expect(result).toEqual(mockNetworks);
    });
  });

  describe('create_network', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const networkConfig = {
        name: 'Guest Network',
        purpose: 'guest' as const,
        ip_subnet: '192.168.100.1/24'
      };

      const result = await networkAPI.create_network(networkConfig);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/rest/networkconf',
        data: networkConfig
      });
      expect(result).toBe(true);
    });
  });

  describe('delete_network', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await networkAPI.delete_network('507f1f77bcf86cd799439015');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/api/s/default/rest/networkconf/507f1f77bcf86cd799439015'
      });
      expect(result).toBe(true);
    });
  });

  describe('list_portconf', () => {
    it('should call HTTP client with correct parameters', async () => {
      const mockPorts = [
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'Port 1',
          port_idx: 1,
          enabled: true
        }
      ];

      mockHttpClient.request.mockResolvedValue({
        data: mockPorts,
        meta: { rc: 'ok' }
      });

      const result = await networkAPI.list_portconf();

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/list/portconf'
      });
      expect(result).toEqual(mockPorts);
    });
  });

  describe('list_dns_records', () => {
    it('should call HTTP client with correct parameters', async () => {
      const mockRecords = [
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'example.com',
          type: 'A',
          value: '192.168.1.1'
        }
      ];

      mockHttpClient.request.mockResolvedValue({
        data: mockRecords,
        meta: { rc: 'ok' }
      });

      const result = await networkAPI.list_dns_records();

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/rest/dnsrecord'
      });
      expect(result).toEqual(mockRecords);
    });
  });
});