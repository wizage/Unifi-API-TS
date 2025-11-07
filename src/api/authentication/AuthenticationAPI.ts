/**
 * Authentication API module for UniFi Controller
 * 
 * Provides authentication-related methods including login, logout, and session management.
 * This module handles all authentication operations for the UniFi API client.
 * 
 * @example
 * ```typescript
 * const authAPI = new AuthenticationAPI(httpClient, sessionManager);
 * 
 * // Login to controller
 * await authAPI.login();
 * 
 * // Check authentication status
 * const isAuth = authAPI.isAuthenticated();
 * 
 * // Logout from controller
 * await authAPI.logout();
 * ```
 * 
 * @see {@link UniFiClient} - Main client that uses this authentication module
 * @see {@link SessionManager} - Session management implementation
 * @see {@link HTTPClient} - HTTP client used for requests
 * 
 * @since 1.0.0
 * @category Authentication
 */

import { HTTPClient } from '../../http';
import { SessionManager, SessionInfo } from '../../http';

export class AuthenticationAPI {
  private httpClient: HTTPClient;
  private sessionManager: SessionManager;

  /**
   * Creates a new Authentication API instance
   * 
   * @param httpClient - HTTP client instance for making requests
   * @param sessionManager - Session manager instance for handling authentication state
   */
  constructor(httpClient: HTTPClient, sessionManager: SessionManager) {
    this.httpClient = httpClient;
    this.sessionManager = sessionManager;
  }

  /**
   * Authenticates with the UniFi controller
   * 
   * Establishes a session with the UniFi controller using the provided credentials.
   * This method must be called before making any API requests that require authentication.
   * Supports both UniFi Network Controller and UniFi OS authentication endpoints.
   * 
   * @returns Promise that resolves to true when login is successful
   * @throws {AuthenticationError} When login credentials are invalid
   * @throws {NetworkError} When unable to connect to the controller
   * @throws {ConfigurationError} When client configuration is invalid
   * 
   * @example
   * ```typescript
   * try {
   *   const success = await authAPI.login();
   *   console.log('Successfully logged in:', success);
   * } catch (error) {
   *   if (error instanceof AuthenticationError) {
   *     console.error('Invalid credentials');
   *   } else {
   *     console.error('Login failed:', error.message);
   *   }
   * }
   * ```
   * 
   * @see {@link logout} to terminate the session
   * @see {@link isAuthenticated} to check authentication status
   * @see {@link getSessionInfo} to get detailed session information
   * 
   * @since 1.0.0
   * @group Authentication
   * @remarks PHP: login() -> return $this->is_logged_in;
   */
  async login(): Promise<boolean> {
    await this.sessionManager.login();
    return true;
  }

  /**
   * Logs out from the UniFi controller
   * 
   * Terminates the current session with the UniFi controller and clears all
   * authentication cookies. This method should be called when finished with the client.
   * Always succeeds locally even if the server logout request fails.
   * 
   * @returns Promise that resolves to true when logout is successful
   * 
   * @example
   * ```typescript
   * // Always logout when done
   * try {
   *   const success = await authAPI.logout();
   *   console.log('Successfully logged out:', success);
   * } catch (error) {
   *   console.warn('Logout failed, but session cleared locally');
   * }
   * ```
   * 
   * @see {@link login} to establish a new session
   * @see {@link isAuthenticated} to check authentication status
   * 
   * @since 1.0.0
   * @group Authentication
   * @remarks PHP: logout() -> return $this->is_logged_in;
   */
  async logout(): Promise<boolean> {
    try {
      await this.sessionManager.logout();
    } catch (error) {
      // Logout should always succeed locally even if server request fails
      // The SessionManager already handles this, but we add extra safety here
    }
    return true;
  }

  /**
   * Checks if the client is currently authenticated
   * 
   * Returns the current authentication status without making any network requests.
   * Note that this only reflects the local session state and doesn't verify
   * if the session is still valid on the server.
   * 
   * @returns true if the client has an active session, false otherwise
   * 
   * @example
   * ```typescript
   * if (!authAPI.isAuthenticated()) {
   *   await authAPI.login();
   * }
   * 
   * // Now safe to make API calls
   * const devices = await client.listDevices();
   * ```
   * 
   * @see {@link login} to establish authentication
   * @see {@link getSessionInfo} for detailed session information
   * 
   * @since 1.0.0
   * @group Authentication
   */
  isAuthenticated(): boolean {
    return this.sessionManager.isAuthenticated();
  }

  /**
   * Retrieves current session information
   * 
   * Returns detailed information about the current session including
   * authentication status, login time, last activity, and user details.
   * 
   * @returns Session information object
   * @returns sessionInfo.isAuthenticated - Whether the session is active
   * @returns sessionInfo.loginTime - When the session was established
   * @returns sessionInfo.lastActivity - Last API activity timestamp
   * @returns sessionInfo.username - Authenticated username
   * @returns sessionInfo.site - Current site context
   * 
   * @example
   * ```typescript
   * const sessionInfo = authAPI.getSessionInfo();
   * console.log(`Logged in as: ${sessionInfo.username}`);
   * console.log(`Site: ${sessionInfo.site}`);
   * console.log(`Session active: ${sessionInfo.isAuthenticated}`);
   * 
   * if (sessionInfo.loginTime) {
   *   const duration = Date.now() - sessionInfo.loginTime.getTime();
   *   console.log(`Session duration: ${Math.round(duration / 1000)}s`);
   * }
   * ```
   * 
   * @see {@link isAuthenticated} for simple authentication check
   * @see {@link getUsername} to get just the username
   * @see {@link getSite} to get just the site name
   * 
   * @since 1.0.0
   * @group Authentication
   */
  getSessionInfo(): SessionInfo {
    return this.sessionManager.getSessionInfo();
  }

  /**
   * Gets the authenticated username
   * 
   * Returns the username of the currently authenticated user.
   * Returns undefined if not authenticated.
   * 
   * @returns Username if authenticated, undefined otherwise
   * 
   * @example
   * ```typescript
   * const username = authAPI.getUsername();
   * if (username) {
   *   console.log(`Authenticated as: ${username}`);
   * } else {
   *   console.log('Not authenticated');
   * }
   * ```
   * 
   * @see {@link getSessionInfo} for complete session information
   * @see {@link isAuthenticated} to check authentication status
   * 
   * @since 1.0.0
   * @group Authentication
   */
  getUsername(): string | undefined {
    return this.sessionManager.getUsername();
  }

  /**
   * Gets the configured site name
   * 
   * Returns the site name that this client instance is configured to work with.
   * All API operations will be performed in the context of this site.
   * 
   * @returns The site name (defaults to 'default' if not specified in config)
   * 
   * @example
   * ```typescript
   * const site = authAPI.getSite();
   * console.log(`Working with site: ${site}`);
   * ```
   * 
   * @see {@link getSessionInfo} for complete session information
   * 
   * @since 1.0.0
   * @group Authentication
   */
  getSite(): string {
    return this.sessionManager.getSite();
  }

  /**
   * Ensures the client is authenticated
   * 
   * Checks current authentication status and performs login or session refresh
   * as needed. This method is called automatically by API methods but can be
   * called manually to ensure authentication before making multiple API calls.
   * 
   * @throws {AuthenticationError} When authentication fails
   * @throws {SessionExpiredError} When session has expired and refresh fails
   * 
   * @example
   * ```typescript
   * // Ensure authentication before making multiple API calls
   * await authAPI.ensureAuthenticated();
   * 
   * // Now safe to make multiple API calls without re-authentication overhead
   * const devices = await client.listDevices();
   * const clients = await client.listUsers();
   * const sites = await client.listSites();
   * ```
   * 
   * @see {@link login} for explicit login
   * @see {@link isAuthenticated} to check current status
   * 
   * @since 1.0.0
   * @group Authentication
   */
  async ensureAuthenticated(): Promise<void> {
    await this.sessionManager.ensureAuthenticated();
  }

  /**
   * Wraps an API call with automatic authentication
   * 
   * Ensures authentication before executing the API call and handles
   * re-authentication if the session expires during the call. This is useful
   * for making custom API calls that need authentication handling.
   * 
   * @template T - Return type of the API call
   * @param apiCall - Function that makes the API call
   * @returns Promise resolving to the API call result
   * @throws {AuthenticationError} When authentication fails
   * 
   * @example
   * ```typescript
   * // Make a custom authenticated API call
   * const customData = await authAPI.withAuth(async () => {
   *   return httpClient.get('/api/s/default/stat/health');
   * });
   * 
   * // The authentication is handled automatically
   * console.log('Health data:', customData);
   * ```
   * 
   * @see {@link ensureAuthenticated} for manual authentication check
   * 
   * @since 1.0.0
   * @group Authentication
   */
  async withAuth<T>(apiCall: () => Promise<T>): Promise<T> {
    return this.sessionManager.withAuth(apiCall);
  }

  /**
   * Gets the underlying session manager instance
   * 
   * Provides access to the internal session manager for advanced session
   * management scenarios. Use with caution as this exposes internal implementation.
   * 
   * @returns The session manager instance
   * 
   * @example
   * ```typescript
   * const sessionManager = authAPI.getSessionManager();
   * 
   * // Advanced usage - check if session needs refresh
   * await sessionManager.ensureAuthenticated();
   * ```
   * 
   * @since 1.0.0
   * @group Authentication
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Gets the underlying HTTP client instance
   * 
   * Provides access to the internal HTTP client for advanced usage scenarios
   * such as custom request configuration or direct API calls. Use with caution
   * as this exposes internal implementation.
   * 
   * @returns The HTTP client instance
   * 
   * @example
   * ```typescript
   * const httpClient = authAPI.getHttpClient();
   * 
   * // Make a custom API call (authentication not handled automatically)
   * const response = await httpClient.get('/api/s/default/stat/health');
   * ```
   * 
   * @see {@link withAuth} for authenticated custom API calls
   * 
   * @since 1.0.0
   * @group Authentication
   */
  getHttpClient(): HTTPClient {
    return this.httpClient;
  }
}