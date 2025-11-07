/**
 * Unit tests for SecurityAPI
 */

import { SecurityAPI } from '../../src/api/security/SecurityAPI';
import { HTTPClient } from '../../src/http/HTTPClient';

// Mock HTTPClient
jest.mock('../../src/http/HTTPClient');

describe('SecurityAPI', () => {
  let securityAPI: SecurityAPI;
  let mockHttpClient: jest.Mocked<HTTPClient>;

  beforeEach(() => {
    mockHttpClient = new HTTPClient({} as any) as jest.Mocked<HTTPClient>;
    securityAPI = new SecurityAPI(mockHttpClient);
    jest.clearAllMocks();
  });

  describe('create_firewallgroup', () => {
    it('should create firewall group successfully', async () => {
      const mockResponse = { data: [{ _id: 'group123' }] };
      mockHttpClient.request.mockResolvedValue(mockResponse);

      const result = await securityAPI.create_firewallgroup('test-group', 'address-group', []);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/s/default/rest/firewallgroup',
        data: {
          name: 'test-group',
          group_type: 'address-group',
          group_members: []
        }
      });
      expect(result).toEqual([{ _id: 'group123' }]);
    });
  });

  describe('list_firewallgroups', () => {
    it('should list firewall groups successfully', async () => {
      const mockGroups = [
        { _id: 'group1', name: 'Group 1' },
        { _id: 'group2', name: 'Group 2' }
      ];
      mockHttpClient.request.mockResolvedValue({ data: mockGroups });

      const result = await securityAPI.list_firewallgroups();

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/s/default/list/firewallgroup'
      });
      expect(result).toEqual(mockGroups);
    });
  });

  describe('delete_firewallgroup', () => {
    it('should delete firewall group successfully', async () => {
      const mockResponse = { data: [{}] };
      mockHttpClient.request.mockResolvedValue(mockResponse);

      const result = await securityAPI.delete_firewallgroup('group123');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/api/s/default/rest/firewallgroup/group123'
      });
      expect(result).toEqual([{}]);
    });
  });
});