/**
 * Site Management API Unit Tests
 */

import { SiteManagementAPI } from '../../src/api/site-management/SiteManagementAPI';
import { HTTPClient } from '../../src/http/HTTPClient';

describe('SiteManagementAPI', () => {
  let siteAPI: SiteManagementAPI;
  let mockHttpClient: jest.Mocked<HTTPClient>;

  beforeEach(() => {
    // Create mock HTTP client
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
      request: jest.fn(),
    } as any;

    siteAPI = new SiteManagementAPI(mockHttpClient);
  });

  describe('list_sites', () => {
    it('should call HTTP client with correct parameters', async () => {
      const mockSites = [
        {
          _id: '507f1f77bcf86cd799439014',
          name: 'default',
          desc: 'Default Site',
          role: 'admin'
        }
      ];

      mockHttpClient.request.mockResolvedValue({
        data: mockSites,
        meta: { rc: 'ok' }
      });

      const result = await siteAPI.list_sites();

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/self/sites'
      });
      expect(result).toEqual(mockSites);
    });
  });

  describe('create_site', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await siteAPI.create_site('New Site Description');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/sitemgr',
        data: {
          cmd: 'add-site',
          desc: 'New Site Description'
        }
      });
      expect(result).toBe(true);
    });
  });

  describe('delete_site', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await siteAPI.delete_site('test-site');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/sitemgr',
        data: {
          cmd: 'delete-site',
          site: 'test-site'
        }
      });
      expect(result).toBe(true);
    });
  });

  describe('set_site_name', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const result = await siteAPI.set_site_name('New Site Name');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/cmd/sitemgr',
        data: {
          cmd: 'update-site',
          desc: 'New Site Name'
        }
      });
      expect(result).toBe(true);
    });
  });

  describe('set_site_country', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const payload = { code: 'US', name: 'United States' };
      const result = await siteAPI.set_site_country('country', payload);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/api/s/default/rest/setting/country/country',
        data: payload
      });
      expect(result).toBe(true);
    });
  });

  describe('set_site_locale', () => {
    it('should call HTTP client with correct parameters', async () => {
      mockHttpClient.request.mockResolvedValue({
        data: true,
        meta: { rc: 'ok' }
      });

      const payload = { locale: 'en_US' };
      const result = await siteAPI.set_site_locale('locale', payload);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/api/s/default/rest/setting/locale/locale',
        data: payload
      });
      expect(result).toBe(true);
    });
  });
});