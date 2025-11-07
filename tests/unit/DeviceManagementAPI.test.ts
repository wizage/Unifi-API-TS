/**
 * Device Management API Unit Tests
 */

import { DeviceManagementAPI } from '../../src/api/device-management/DeviceManagementAPI';
import { HTTPClient } from '../../src/http/HTTPClient';

describe('DeviceManagementAPI', () => {
  let deviceAPI: DeviceManagementAPI;
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

    deviceAPI = new DeviceManagementAPI(mockHttpClient);
  });

  describe('list_devices', () => {
    it('should call HTTP client with correct parameters', async () => {
      const mockDevices = [
        {
          _id: '507f1f77bcf86cd799439011',
          mac: '00:11:22:33:44:55',
          model: 'U6-Lite',
          name: 'Living Room AP',
          type: 'uap',
          state: 1,
          adopted: true
        }
      ];

      mockHttpClient.request.mockResolvedValue({
        data: mockDevices,
        meta: { rc: 'ok' }
      });

      const result = await deviceAPI.list_devices();

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/stat/device'
      });
      expect(result).toEqual(mockDevices);
    });

    it('should handle device MAC parameter', async () => {
      const mockDevice = {
        _id: '507f1f77bcf86cd799439011',
        mac: '00:11:22:33:44:55',
        model: 'U6-Lite'
      };

      mockHttpClient.request.mockResolvedValue({
        data: [mockDevice],
        meta: { rc: 'ok' }
      });

      const result = await deviceAPI.list_devices('00:11:22:33:44:55');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/stat/device',
        data: {
          macs: ['00:11:22:33:44:55']
        }
      });
      expect(result).toEqual([mockDevice]);
    });
  });

  describe('adopt_device', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await deviceAPI.adopt_device('00:11:22:33:44:55');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/devmgr',
        data: {
          cmd: 'adopt',
          macs: ['00:11:22:33:44:55']
        }
      });
      expect(result).toBe(true);
    });


  });

  describe('restart_device', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await deviceAPI.restart_device('00:11:22:33:44:55');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/devmgr',
        data: {
          cmd: 'restart',
          macs: ['00:11:22:33:44:55'],
          reboot_type: 'soft'
        }
      });
      expect(result).toBe(true);
    });

    it('should support hard reboot type', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await deviceAPI.restart_device('00:11:22:33:44:55', 'hard');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/devmgr',
        data: {
          cmd: 'restart',
          macs: ['00:11:22:33:44:55'],
          reboot_type: 'hard'
        }
      });
      expect(result).toBe(true);
    });
  });


});