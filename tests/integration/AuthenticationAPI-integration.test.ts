/**
 * Authentication API Integration Tests
 */

import { UniFiClient } from '../../src/client/UniFiClient';
import { AuthenticationAPI } from '../../src/api/authentication/AuthenticationAPI';

describe('Authentication API Integration', () => {
  let client: UniFiClient;

  beforeEach(() => {
    client = new UniFiClient({
      baseUrl: 'https://unifi.example.com:8443',
      username: 'admin',
      password: 'password',
      site: 'default'
    });
  });

  describe('UniFiClient Authentication Integration', () => {
    it('should provide access to AuthenticationAPI', () => {
      const authAPI = client.getAuthenticationAPI();
      
      expect(authAPI).toBeInstanceOf(AuthenticationAPI);
    });

    it('should delegate login to AuthenticationAPI', async () => {
      const authAPI = client.getAuthenticationAPI();
      const loginSpy = jest.spyOn(authAPI, 'login').mockResolvedValue(true);

      const result = await client.login();

      expect(loginSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);

      loginSpy.mockRestore();
    });

    it('should delegate logout to AuthenticationAPI', async () => {
      const authAPI = client.getAuthenticationAPI();
      const logoutSpy = jest.spyOn(authAPI, 'logout').mockResolvedValue(true);

      const result = await client.logout();

      expect(logoutSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);

      logoutSpy.mockRestore();
    });

    it('should delegate isAuthenticated to AuthenticationAPI', () => {
      const authAPI = client.getAuthenticationAPI();
      const isAuthenticatedSpy = jest.spyOn(authAPI, 'isAuthenticated').mockReturnValue(true);

      const result = client.isAuthenticated();

      expect(isAuthenticatedSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);

      isAuthenticatedSpy.mockRestore();
    });

    it('should delegate getSessionInfo to AuthenticationAPI', () => {
      const sessionInfo = {
        isAuthenticated: true,
        loginTime: new Date(),
        username: 'admin',
        site: 'default'
      };
      
      const authAPI = client.getAuthenticationAPI();
      const getSessionInfoSpy = jest.spyOn(authAPI, 'getSessionInfo').mockReturnValue(sessionInfo);

      const result = client.getSessionInfo();

      expect(getSessionInfoSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(sessionInfo);

      getSessionInfoSpy.mockRestore();
    });

    it('should delegate getSite to AuthenticationAPI', () => {
      const authAPI = client.getAuthenticationAPI();
      const getSiteSpy = jest.spyOn(authAPI, 'getSite').mockReturnValue('default');

      const result = client.getSite();

      expect(getSiteSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe('default');

      getSiteSpy.mockRestore();
    });
  });

  describe('Authentication API Methods', () => {
    it('should provide all expected authentication methods', () => {
      const authAPI = client.getAuthenticationAPI();

      // Check that all expected methods exist
      expect(typeof authAPI.login).toBe('function');
      expect(typeof authAPI.logout).toBe('function');
      expect(typeof authAPI.isAuthenticated).toBe('function');
      expect(typeof authAPI.getSessionInfo).toBe('function');
      expect(typeof authAPI.getUsername).toBe('function');
      expect(typeof authAPI.getSite).toBe('function');
      expect(typeof authAPI.ensureAuthenticated).toBe('function');
      expect(typeof authAPI.withAuth).toBe('function');
      expect(typeof authAPI.getSessionManager).toBe('function');
      expect(typeof authAPI.getHttpClient).toBe('function');
    });

    it('should return the same SessionManager instance', () => {
      const authAPI = client.getAuthenticationAPI();
      const sessionManager1 = client.getSessionManager();
      const sessionManager2 = authAPI.getSessionManager();

      expect(sessionManager1).toBe(sessionManager2);
    });

    it('should return the same HTTPClient instance', () => {
      const authAPI = client.getAuthenticationAPI();
      const httpClient1 = client.getHttpClient();
      const httpClient2 = authAPI.getHttpClient();

      expect(httpClient1).toBe(httpClient2);
    });
  });
});