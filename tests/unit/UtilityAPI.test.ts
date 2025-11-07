/**
 * Unit tests for UtilityAPI
 */

import { UtilityAPI } from '../../src/api/utility/UtilityAPI';
import { HTTPClient } from '../../src/http/HTTPClient';

// Mock HTTPClient
jest.mock('../../src/http/HTTPClient');

describe('UtilityAPI', () => {
  let utilityAPI: UtilityAPI;
  let mockHttpClient: jest.Mocked<HTTPClient>;

  beforeEach(() => {
    mockHttpClient = new HTTPClient({} as any) as jest.Mocked<HTTPClient>;
    utilityAPI = new UtilityAPI(mockHttpClient);
    jest.clearAllMocks();
  });

  describe('custom_api_request', () => {
    it('should make custom GET request successfully', async () => {
      const mockResponse = { data: { result: 'success' } };
      mockHttpClient.request.mockResolvedValue(mockResponse);

      const result = await utilityAPI.custom_api_request('/custom/endpoint', 'GET');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/custom/endpoint',
        data: undefined
      });
      expect(result).toEqual({ result: 'success' });
    });

    it('should make custom POST request with data successfully', async () => {
      const mockResponse = { data: { result: 'created' } };
      const requestData = { name: 'test' };
      mockHttpClient.request.mockResolvedValue(mockResponse);

      const result = await utilityAPI.custom_api_request('/custom/endpoint', 'POST', requestData);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/custom/endpoint',
        data: requestData
      });
      expect(result).toEqual({ result: 'created' });
    });
  });
});