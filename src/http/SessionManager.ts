/**
 * Session Manager for UniFi API authentication and session handling
 * 
 * Manages authentication state, session lifecycle, and automatic re-authentication
 * for the UniFi API client. Handles login, logout, session validation, and
 * automatic session refresh when needed.
 * 
 * @example
 * ```typescript
 * const sessionManager = new SessionManager(httpClient, config);
 * 
 * // Login and ensure authentication
 * await sessionManager.login();
 * 
 * // Wrap API calls with automatic authentication
 * const result = await sessionManager.withAuth(async () => {
 *   return httpClient.get('/api/s/default/stat/device');
 * });
 * ```
 */

import { HTTPClient } from './HTTPClient';
import { UniFiClientConfig } from '../types/config';
import { 
  AuthenticationError, 
  SessionExpiredError, 
  ValidationUtils,
  ConfigurationError 
} from '../errors';

export interface LoginResponse {
  data: any[];
  meta: {
    msg: string;
    rc: string;
  };
}

export interface SessionInfo {
  isAuthenticated: boolean;
  loginTime?: Date;
  lastActivity?: Date;
  sessionDuration?: number;
  username?: string;
  site?: string;
}

export class SessionManager {
  private httpClient: HTTPClient;
  private config: UniFiClientConfig;
  private sessionInfo: SessionInfo = { isAuthenticated: false };
  private loginPromise?: Promise<void>;

  /**
   * Creates a new session manager instance
   * 
   * @param httpClient - HTTP client instance for making requests
   * @param config - UniFi client configuration containing credentials and settings
   * @throws {ConfigurationError} When configuration is invalid
   */
  constructor(httpClient: HTTPClient, config: UniFiClientConfig) {
    this.httpClient = httpClient;
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    try {
      ValidationUtils.validateUrl(this.config.baseUrl, 'baseUrl');
      ValidationUtils.validateString(this.config.username, 'username', 1);
      ValidationUtils.validateString(this.config.password, 'password', 1);
      
      if (this.config.site) {
        ValidationUtils.validateString(this.config.site, 'site', 1);
      }
      
      if (this.config.timeout) {
        ValidationUtils.validateNumber(this.config.timeout, 'timeout', 1000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ConfigurationError(`Invalid configuration: ${errorMessage}`);
    }
  }

  /**
   * Authenticates with the UniFi controller
   * 
   * Performs login with the configured credentials and establishes a session.
   * Prevents multiple concurrent login attempts and handles authentication errors.
   * 
   * @throws {AuthenticationError} When login credentials are invalid or login fails
   * @throws {NetworkError} When unable to connect to the controller
   * 
   * @example
   * ```typescript
   * try {
   *   await sessionManager.login();
   *   console.log('Login successful');
   * } catch (error) {
   *   if (error instanceof AuthenticationError) {
   *     console.error('Invalid credentials');
   *   }
   * }
   * ```
   */
  async login(): Promise<void> {
    // Prevent multiple concurrent login attempts
    if (this.loginPromise) {
      return this.loginPromise;
    }

    this.loginPromise = this.performLogin();
    
    try {
      await this.loginPromise;
    } finally {
      this.loginPromise = undefined as any;
    }
  }

  private async performLogin(): Promise<void> {
    try {
      // Clear any existing cookies
      this.httpClient.clearCookies();

      const loginData = {
        username: this.config.username,
        password: this.config.password,
        remember: false,
        strict: true
      };

      const response = await this.httpClient.post<LoginResponse>('/api/login', loginData);

      // Check if login was successful
      if (response.meta?.rc !== 'ok') {
        throw new AuthenticationError(
          response.meta?.msg || 'Login failed',
          response
        );
      }

      // Update session info
      this.sessionInfo = {
        isAuthenticated: true,
        loginTime: new Date(),
        lastActivity: new Date(),
        username: this.config.username,
        site: this.config.site || 'default'
      };

    } catch (error) {
      this.sessionInfo = { isAuthenticated: false };
      
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AuthenticationError(
        `Login failed: ${errorMessage}`,
        error
      );
    }
  }

  /**
   * Logs out from the UniFi controller
   * 
   * Terminates the current session and clears all authentication state.
   * Always succeeds locally even if the server request fails.
   * 
   * @example
   * ```typescript
   * await sessionManager.logout();
   * console.log('Logged out successfully');
   * ```
   */
  async logout(): Promise<void> {
    if (!this.sessionInfo.isAuthenticated) {
      return;
    }

    try {
      await this.httpClient.post('/api/logout');
    } catch (error) {
      // Log the error but don't throw - logout should always succeed locally
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('Logout request failed:', errorMessage);
    } finally {
      // Always clear local session state
      this.sessionInfo = { isAuthenticated: false };
      this.httpClient.clearCookies();
    }
  }

  /**
   * Ensures the client is authenticated
   * 
   * Checks current authentication status and performs login or session refresh
   * as needed. This method is called automatically by API methods.
   * 
   * @throws {AuthenticationError} When authentication fails
   * @throws {SessionExpiredError} When session has expired and refresh fails
   */
  async ensureAuthenticated(): Promise<void> {
    if (!this.sessionInfo.isAuthenticated) {
      await this.login();
      return;
    }

    // Check if session might be expired (basic heuristic)
    if (this.isSessionLikelyExpired()) {
      try {
        await this.refreshSession();
      } catch (error) {
        // If refresh fails, try a full login
        await this.login();
      }
    }

    // Update last activity
    this.sessionInfo.lastActivity = new Date();
  }

  private isSessionLikelyExpired(): boolean {
    if (!this.sessionInfo.loginTime || !this.sessionInfo.lastActivity) {
      return true;
    }

    const now = new Date();
    const timeSinceLogin = now.getTime() - this.sessionInfo.loginTime.getTime();
    const timeSinceActivity = now.getTime() - this.sessionInfo.lastActivity.getTime();

    // Consider session expired if:
    // - More than 24 hours since login, OR
    // - More than 2 hours since last activity
    const maxSessionTime = 24 * 60 * 60 * 1000; // 24 hours
    const maxInactiveTime = 2 * 60 * 60 * 1000; // 2 hours

    return timeSinceLogin > maxSessionTime || timeSinceActivity > maxInactiveTime;
  }

  private async refreshSession(): Promise<void> {
    try {
      // Try to make a simple API call to check if session is still valid
      const site = this.config.site || 'default';
      await this.httpClient.get(`/api/s/${site}/self`);
      
      // If successful, update last activity
      this.sessionInfo.lastActivity = new Date();
    } catch (error) {
      // If the call fails with authentication error, session is expired
      if (error instanceof AuthenticationError) {
        this.sessionInfo = { isAuthenticated: false };
        throw new SessionExpiredError('Session has expired');
      }
      
      // For other errors, re-throw
      throw error;
    }
  }

  /**
   * Gets current session information
   * 
   * @returns Copy of current session information including authentication status,
   *          login time, last activity, username, and site
   */
  getSessionInfo(): SessionInfo {
    return { ...this.sessionInfo };
  }

  /**
   * Checks if currently authenticated
   * 
   * @returns true if session is active, false otherwise
   */
  isAuthenticated(): boolean {
    return this.sessionInfo.isAuthenticated;
  }

  /**
   * Gets the authenticated username
   * 
   * @returns Username if authenticated, undefined otherwise
   */
  getUsername(): string | undefined {
    return this.sessionInfo.username;
  }

  /**
   * Gets the configured site name
   * 
   * @returns Site name (defaults to 'default')
   */
  getSite(): string {
    return this.config.site || 'default';
  }

  /**
   * Wraps an API call with automatic authentication
   * 
   * Ensures authentication before executing the API call and handles
   * re-authentication if the session expires during the call.
   * 
   * @template T - Return type of the API call
   * @param apiCall - Function that makes the API call
   * @returns Promise resolving to the API call result
   * @throws {AuthenticationError} When authentication fails
   * 
   * @example
   * ```typescript
   * const devices = await sessionManager.withAuth(async () => {
   *   return httpClient.get('/api/s/default/stat/device');
   * });
   * ```
   */
  async withAuth<T>(apiCall: () => Promise<T>): Promise<T> {
    await this.ensureAuthenticated();
    
    try {
      return await apiCall();
    } catch (error) {
      // If we get an authentication error, try to re-authenticate once
      if (error instanceof AuthenticationError) {
        this.sessionInfo = { isAuthenticated: false };
        await this.ensureAuthenticated();
        return await apiCall();
      }
      
      throw error;
    }
  }
}