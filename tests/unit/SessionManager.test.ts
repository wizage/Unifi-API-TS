/**
 * Unit tests for SessionManager
 * Tests authentication flow, session management, and error handling
 */

import { SessionManager } from '../../src/http/SessionManager';
import { HTTPClient } from '../../src/http/HTTPClient';
import { UniFiClientConfig } from '../../src/types/config';
import { AuthenticationError, SessionExpiredError, ConfigurationError } from '../../src/errors';

// Mock HTTPClient
jest.mock('../../src/http/HTTPClient');
const MockedHTTPClient = HTTPClient as jest.MockedClass<typeof HTTPClient>;

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockHttpClient: jest.Mocked<HTTPClient>;
  let config: UniFiClientConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock HTTP client
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
      clearCookies: jest.fn(),
    } as any;

    MockedHTTPClient.mockImplementation(() => mockHttpClient);

    config = {
      baseUrl: 'https://test.local:8443',
      username: 'testuser',
      password: 'testpass',
      site: 'default'
    };

    sessionManager = new SessionManager(mockHttpClient, config);
  });

  describe('constructor', () => {
    it('should create SessionManager with valid config', () => {
      expect(sessionManager).toBeInstanceOf(SessionManager);
      expect(sessionManager.isAuthenticated()).toBe(false);
    });

    it('should throw ConfigurationError for invalid config', () => {
      const invalidConfig = { ...config, baseUrl: '' };
      
      expect(() => new SessionManager(mockHttpClient, invalidConfig))
        .toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError for missing username', () => {
      const invalidConfig = { ...config, username: '' };
      
      expect(() => new SessionManager(mockHttpClient, invalidConfig))
        .toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError for missing password', () => {
      const invalidConfig = { ...config, password: '' };
      
      expect(() => new SessionManager(mockHttpClient, invalidConfig))
        .toThrow(ConfigurationError);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginResponse = {
        data: [],
        meta: { rc: 'ok', msg: 'Login successful' }
      };
      
      mockHttpClient.post.mockResolvedValue(loginResponse);

      await sessionManager.login();

      expect(mockHttpClient.clearCookies).toHaveBeenCalled();
      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/login', {
        username: config.username,
        password: config.password,
        remember: false,
        strict: true
      });
      expect(sessionManager.isAuthenticated()).toBe(true);
    });

    it('should throw AuthenticationError on login failure', async () => {
      const loginResponse = {
        data: [],
        meta: { rc: 'error', msg: 'Invalid credentials' }
      };
      
      mockHttpClient.post.mockResolvedValue(loginResponse);

      await expect(sessionManager.login()).rejects.toThrow(AuthenticationError);
      expect(sessionManager.isAuthenticated()).toBe(false);
    });

    it('should handle network errors during login', async () => {
      const networkError = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(networkError);

      await expect(sessionManager.login()).rejects.toThrow(AuthenticationError);
      expect(sessionManager.isAuthenticated()).toBe(false);
    });

    it('should prevent concurrent login attempts', async () => {
      const loginResponse = {
        data: [],
        meta: { rc: 'ok', msg: 'Login successful' }
      };
      
      mockHttpClient.post.mockResolvedValue(loginResponse);

      // Start multiple login attempts
      const promise1 = sessionManager.login();
      const promise2 = sessionManager.login();
      const promise3 = sessionManager.login();

      await Promise.all([promise1, promise2, promise3]);

      // Should only call login once
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    beforeEach(async () => {
      // Login first
      mockHttpClient.post.mockResolvedValue({
        data: [],
        meta: { rc: 'ok', msg: 'Login successful' }
      });
      await sessionManager.login();
    });

    it('should logout successfully', async () => {
      mockHttpClient.post.mockResolvedValue({ data: [], meta: { rc: 'ok' } });

      await sessionManager.logout();

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/logout');
      expect(mockHttpClient.clearCookies).toHaveBeenCalled();
      expect(sessionManager.isAuthenticated()).toBe(false);
    });

    it('should clear session even if logout request fails', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Logout failed'));

      await sessionManager.logout();

      expect(mockHttpClient.clearCookies).toHaveBeenCalled();
      expect(sessionManager.isAuthenticated()).toBe(false);
    });

    it('should do nothing if not authenticated', async () => {
      // Logout first to clear authentication
      await sessionManager.logout();
      mockHttpClient.post.mockClear();

      await sessionManager.logout();

      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  describe('ensureAuthenticated', () => {
    it('should login if not authenticated', async () => {
      const loginResponse = {
        data: [],
        meta: { rc: 'ok', msg: 'Login successful' }
      };
      
      mockHttpClient.post.mockResolvedValue(loginResponse);

      await sessionManager.ensureAuthenticated();

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/login', expect.any(Object));
      expect(sessionManager.isAuthenticated()).toBe(true);
    });

    it('should update last activity when authenticated', async () => {
      // Login first
      mockHttpClient.post.mockResolvedValue({
        data: [],
        meta: { rc: 'ok', msg: 'Login successful' }
      });
      await sessionManager.login();

      const beforeActivity = sessionManager.getSessionInfo().lastActivity;
      
      // Wait a bit and call ensureAuthenticated
      await new Promise(resolve => setTimeout(resolve, 10));
      await sessionManager.ensureAuthenticated();

      const afterActivity = sessionManager.getSessionInfo().lastActivity;
      expect(afterActivity).not.toEqual(beforeActivity);
    });
  });

  describe('withAuth', () => {
    it('should execute API call with authentication', async () => {
      // Setup login
      mockHttpClient.post.mockResolvedValue({
        data: [],
        meta: { rc: 'ok', msg: 'Login successful' }
      });

      const apiCall = jest.fn().mockResolvedValue('success');

      const result = await sessionManager.withAuth(apiCall);

      expect(result).toBe('success');
      expect(apiCall).toHaveBeenCalled();
    });

    it('should re-authenticate on authentication error', async () => {
      // Setup initial login
      mockHttpClient.post.mockResolvedValue({
        data: [],
        meta: { rc: 'ok', msg: 'Login successful' }
      });
      await sessionManager.login();

      const apiCall = jest.fn()
        .mockRejectedValueOnce(new AuthenticationError('Session expired'))
        .mockResolvedValue('success');

      const result = await sessionManager.withAuth(apiCall);

      expect(result).toBe('success');
      expect(apiCall).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.post).toHaveBeenCalledTimes(2); // Initial login + re-auth
    });
  });

  describe('session info', () => {
    it('should return session info', () => {
      const sessionInfo = sessionManager.getSessionInfo();
      
      expect(sessionInfo).toHaveProperty('isAuthenticated', false);
      expect(sessionInfo.username).toBeUndefined();
      expect(sessionInfo.site).toBeUndefined();
    });

    it('should return username after login', async () => {
      mockHttpClient.post.mockResolvedValue({
        data: [],
        meta: { rc: 'ok', msg: 'Login successful' }
      });
      
      await sessionManager.login();
      
      expect(sessionManager.getUsername()).toBe(config.username);
    });

    it('should return site name', () => {
      expect(sessionManager.getSite()).toBe('default');
    });

    it('should return default site when not specified', () => {
      const configWithoutSite = { ...config };
      delete configWithoutSite.site;
      
      const sm = new SessionManager(mockHttpClient, configWithoutSite);
      expect(sm.getSite()).toBe('default');
    });
  });
});