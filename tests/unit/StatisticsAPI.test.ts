/**
 * Statistics API Unit Tests
 */

import { StatisticsAPI } from '../../src/api/statistics/StatisticsAPI';
import { HTTPClient } from '../../src/http/HTTPClient';

describe('StatisticsAPI', () => {
  let statsAPI: StatisticsAPI;
  let mockHttpClient: jest.Mocked<HTTPClient>;

  beforeEach(() => {
    // Create mock HTTP client
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
      request: jest.fn(),
    } as any;

    statsAPI = new StatisticsAPI(mockHttpClient);
  });

  describe('stat_sysinfo', () => {
    it('should call HTTP client with correct parameters', async () => {
      const mockSysInfo = [
        {
          hostname: 'UniFi-Dream-Machine',
          version: '1.12.22',
          uptime: 86400,
          mem: '16384',
          cpu: '4'
        }
      ];

      mockHttpClient.request.mockResolvedValue({
        data: mockSysInfo,
        meta: { rc: 'ok' }
      });

      const result = await statsAPI.stat_sysinfo();

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/stat/sysinfo'
      });
      expect(result).toEqual(mockSysInfo);
    });
  });

  describe('list_events', () => {
    it('should call HTTP client with correct parameters', async () => {
      const mockEvents = [
        {
          _id: '507f1f77bcf86cd799439016',
          key: 'EVT_AP_Connected',
          datetime: '2024-01-01T12:00:00Z',
          msg: 'Access Point connected',
          ap: '00:11:22:33:44:55'
        }
      ];

      mockHttpClient.request.mockResolvedValue({
        data: mockEvents,
        meta: { rc: 'ok' }
      });

      const result = await statsAPI.list_events();

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/stat/event',
        data: {
          within: 720,
          _limit: 3000
        }
      });
      expect(result).toEqual(mockEvents);
    });

    it('should support custom parameters', async () => {
      const mockEvents: any[] = [];

      mockHttpClient.request.mockResolvedValue({
        data: mockEvents,
        meta: { rc: 'ok' }
      });

      const result = await statsAPI.list_events(24, 1640995200, 1640995800, 100);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/stat/event',
        data: {
          within: 24,
          _limit: 100,
          start: 1640995200,
          end: 1640995800
        }
      });
      expect(result).toEqual(mockEvents);
    });
  });

  describe('list_alarms', () => {
    it('should call HTTP client with correct parameters', async () => {
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

      mockHttpClient.request.mockResolvedValue({
        data: mockAlarms,
        meta: { rc: 'ok' }
      });

      const result = await statsAPI.list_alarms();

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/list/alarm'
      });
      expect(result).toEqual(mockAlarms);
    });
  });

  describe('check_controller_update', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await statsAPI.check_controller_update();

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/stat/fwupdate/latest-version'
      });
      expect(result).toBe(true);
    });
  });

  describe('list_health', () => {
    it('should call HTTP client with correct parameters', async () => {
      const mockHealth = [
        {
          subsystem: 'wlan',
          status: 'ok',
          num_user: 5,
          num_guest: 2,
          num_iot: 3
        }
      ];

      mockHttpClient.request.mockResolvedValue({
        data: mockHealth,
        meta: { rc: 'ok' }
      });

      const result = await statsAPI.list_health();

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/stat/health'
      });
      expect(result).toEqual(mockHealth);
    });
  });
});