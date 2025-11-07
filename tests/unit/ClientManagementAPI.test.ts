/**
 * Client Management API Unit Tests
 */

import { ClientManagementAPI } from '../../src/api/client-management/ClientManagementAPI';
import { HTTPClient } from '../../src/http/HTTPClient';

describe('ClientManagementAPI', () => {
  let clientAPI: ClientManagementAPI;
  let mockHttpClient: jest.Mocked<HTTPClient>;

  beforeEach(() => {
    // Create mock HTTP client
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
      request: jest.fn().mockResolvedValue({
        data: [],
        meta: { rc: 'ok' }
      }),
    } as any;

    clientAPI = new ClientManagementAPI(mockHttpClient);
  });

  describe('list_users', () => {
    it('should call HTTP client with correct parameters', async () => {
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

      mockHttpClient.request.mockResolvedValue({
        data: mockUsers,
        meta: { rc: 'ok' }
      });

      const result = await clientAPI.list_users();

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/list/user'
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('block_sta', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await clientAPI.block_sta('default', 'aa:bb:cc:dd:ee:ff');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/stamgr',
        data: {
          cmd: 'block-sta',
          mac: 'aa:bb:cc:dd:ee:ff'
        }
      });
      expect(result).toBe(true);
    });


  });

  describe('unblock_sta', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await clientAPI.unblock_sta('default', 'aa:bb:cc:dd:ee:ff');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/stamgr',
        data: {
          cmd: 'unblock-sta',
          mac: 'aa:bb:cc:dd:ee:ff'
        }
      });
      expect(result).toBe(true);
    });
  });

  describe('authorize_guest', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await clientAPI.authorize_guest('default', 'aa:bb:cc:dd:ee:ff', 60);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/stamgr',
        data: {
          cmd: 'authorize-guest',
          mac: 'aa:bb:cc:dd:ee:ff',
          minutes: 60
        }
      });
      expect(result).toBe(true);
    });

    it('should support bandwidth limits', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await clientAPI.authorize_guest('default', 'aa:bb:cc:dd:ee:ff', 60, 1000, 500);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/stamgr',
        data: {
          cmd: 'authorize-guest',
          mac: 'aa:bb:cc:dd:ee:ff',
          minutes: 60,
          up: 1000,
          down: 500
        }
      });
      expect(result).toBe(true);
    });
  });

  describe('unauthorize_guest', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await clientAPI.unauthorize_guest('default', 'aa:bb:cc:dd:ee:ff');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/stamgr',
        data: {
          cmd: 'unauthorize-guest',
          mac: 'aa:bb:cc:dd:ee:ff'
        }
      });
      expect(result).toBe(true);
    });
  });

  describe('reconnect_sta', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await clientAPI.reconnect_sta('default', 'aa:bb:cc:dd:ee:ff');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/stamgr',
        data: {
          cmd: 'kick-sta',
          mac: 'aa:bb:cc:dd:ee:ff'
        }
      });
      expect(result).toBe(true);
    });
  });
});