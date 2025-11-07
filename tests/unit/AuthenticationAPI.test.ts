/**
 * Authentication API Unit Tests
 */

import { AuthenticationAPI } from '../../src/api/authentication/AuthenticationAPI';
import { HTTPClient } from '../../src/http/HTTPClient';
import { SessionManager } from '../../src/http/SessionManager';
import { UniFiClientConfig } from '../../src/types/config';

describe('AuthenticationAPI', () => {
  let authAPI: AuthenticationAPI;
  let mockHttpClient: jest.Mocked<HTTPClient>;
  let mockSessionManager: jest.Mocked<SessionManager>;

  beforeEach(() => {
    // Create mock HTTP client
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
      clearCookies: jest.fn(),
      request: jest.fn(),
    } as any;

    // Create mock session manager
    mockSessionManager = {
      login: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: jest.fn(),
      getSessionInfo: jest.fn(),
      getUsername: jest.fn(),
      getSite: jest.fn(),
      ensureAuthenticated: jest.fn(),
      withAuth: jest.fn(),
    } as any;

    authAPI = new AuthenticationAPI(mockHttpClient, mockSessionManager);
  });

  describe('login', () => {
    it('should call session manager login and return true', async () => {
      mockSessionManager.login.mockResolvedValue();

      const result = await authAPI.login();

      expect(mockSessionManager.login).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should propagate login errors', async () => {
      const error = new Error('Login failed');
      mockSessionManager.login.mockRejectedValue(error);

      await expect(authAPI.login()).rejects.toThrow('Login failed');
    });
  });

  describe('logout', () => {
    it('should call session manager logout and return true', async () => {
      mockSessionManager.logout.mockResolvedValue();

      const result = await authAPI.logout();

      expect(mockSessionManager.logout).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should always return true even if logout fails', async () => {
      mockSessionManager.logout.mockRejectedValue(new Error('Logout failed'));

      const result = await authAPI.logout();

      expect(result).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('should return session manager authentication status', () => {
      mockSessionManager.isAuthenticated.mockReturnValue(true);

      const result = authAPI.isAuthenticated();

      expect(mockSessionManager.isAuthenticated).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should return false when not authenticated', () => {
      mockSessionManager.isAuthenticated.mockReturnValue(false);

      const result = authAPI.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getSessionInfo', () => {
    it('should return session information from session manager', () => {
      const sessionInfo = {
        isAuthenticated: true,
        loginTime: new Date(),
        username: 'testuser',
        site: 'default'
      };
      mockSessionManager.getSessionInfo.mockReturnValue(sessionInfo);

      const result = authAPI.getSessionInfo();

      expect(mockSessionManager.getSessionInfo).toHaveBeenCalledTimes(1);
      expect(result).toEqual(sessionInfo);
    });
  });

  describe('getUsername', () => {
    it('should return username from session manager', () => {
      mockSessionManager.getUsername.mockReturnValue('testuser');

      const result = authAPI.getUsername();

      expect(mockSessionManager.getUsername).toHaveBeenCalledTimes(1);
      expect(result).toBe('testuser');
    });

    it('should return undefined when not authenticated', () => {
      mockSessionManager.getUsername.mockReturnValue(undefined);

      const result = authAPI.getUsername();

      expect(result).toBeUndefined();
    });
  });

  describe('getSite', () => {
    it('should return site from session manager', () => {
      mockSessionManager.getSite.mockReturnValue('default');

      const result = authAPI.getSite();

      expect(mockSessionManager.getSite).toHaveBeenCalledTimes(1);
      expect(result).toBe('default');
    });
  });

  describe('ensureAuthenticated', () => {
    it('should call session manager ensureAuthenticated', async () => {
      mockSessionManager.ensureAuthenticated.mockResolvedValue();

      await authAPI.ensureAuthenticated();

      expect(mockSessionManager.ensureAuthenticated).toHaveBeenCalledTimes(1);
    });

    it('should propagate authentication errors', async () => {
      const error = new Error('Authentication failed');
      mockSessionManager.ensureAuthenticated.mockRejectedValue(error);

      await expect(authAPI.ensureAuthenticated()).rejects.toThrow('Authentication failed');
    });
  });

  describe('withAuth', () => {
    it('should call session manager withAuth with provided function', async () => {
      const mockApiCall = jest.fn().mockResolvedValue('test result');
      mockSessionManager.withAuth.mockImplementation((fn) => fn());

      const result = await authAPI.withAuth(mockApiCall);

      expect(mockSessionManager.withAuth).toHaveBeenCalledTimes(1);
      expect(mockSessionManager.withAuth).toHaveBeenCalledWith(mockApiCall);
      expect(result).toBe('test result');
    });
  });

  describe('getSessionManager', () => {
    it('should return the session manager instance', () => {
      const result = authAPI.getSessionManager();

      expect(result).toBe(mockSessionManager);
    });
  });

  describe('getHttpClient', () => {
    it('should return the HTTP client instance', () => {
      const result = authAPI.getHttpClient();

      expect(result).toBe(mockHttpClient);
    });
  });
});