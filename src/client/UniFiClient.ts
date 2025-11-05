/**
 * Main UniFi API Client
 * 
 * A comprehensive TypeScript client for the UniFi Controller API, providing access to all
 * UniFi network management functionality. This client handles authentication, session management,
 * and provides strongly-typed methods for interacting with UniFi controllers.
 * 
 * @example
 * ```typescript
 * import { UniFiClient } from 'unifi-api-ts';
 * 
 * const client = new UniFiClient({
 *   baseUrl: 'https://unifi.example.com:8443',
 *   username: 'admin',
 *   password: 'password',
 *   site: 'default'
 * });
 * 
 * // Login and get devices
 * await client.login();
 * const devices = await client.listDevices();
 * console.log(`Found ${devices.length} devices`);
 * ```
 * 
 * @since 1.0.0
 */

import { UniFiClientConfig } from '../types/config';
import { HTTPClient, HTTPClientConfig, SessionManager } from '../http';
import { ConfigurationError } from '../errors';
import { GeneratedAPIMethods } from '../generated';

export class UniFiClient extends GeneratedAPIMethods {
  private config: UniFiClientConfig;
  private sessionManager: SessionManager;

  /**
   * Override makeRequest to use configured site
   * @protected
   */
  protected async makeRequest<T>(config: any, site?: string): Promise<T> {
    const siteToUse = site || this.config.site || 'default';
    return super.makeRequest<T>(config, siteToUse);
  }

  /**
   * Creates a new UniFi API client instance
   * 
   * @param config - Configuration object for the UniFi client
   * @param config.baseUrl - Base URL of the UniFi controller (e.g., 'https://unifi.example.com:8443')
   * @param config.username - Username for authentication
   * @param config.password - Password for authentication
   * @param config.site - Site name (defaults to 'default')
   * @param config.timeout - Request timeout in milliseconds (defaults to 30000)
   * @param config.verifySsl - Whether to verify SSL certificates (defaults to true)
   * @param config.debug - Enable debug logging (defaults to false)
   * 
   * @throws {ConfigurationError} When required configuration parameters are missing or invalid
   * 
   * @example
   * ```typescript
   * const client = new UniFiClient({
   *   baseUrl: 'https://192.168.1.1:8443',
   *   username: 'admin',
   *   password: 'mypassword',
   *   site: 'default',
   *   timeout: 10000,
   *   verifySsl: false
   * });
   * ```
   */
  constructor(config: UniFiClientConfig) {
    // Validate config first
    UniFiClient.validateConfig(config);

    // Initialize HTTP client
    const httpConfig: HTTPClientConfig = {
      baseURL: config.baseUrl
    };

    if (config.timeout !== undefined) {
      httpConfig.timeout = config.timeout;
    }

    if (config.verifySsl !== undefined) {
      httpConfig.verifySsl = config.verifySsl;
    }

    if (config.debug !== undefined) {
      httpConfig.debug = config.debug;
    }

    const httpClient = new HTTPClient(httpConfig);

    // Call parent constructor with HTTP client
    super(httpClient);

    // Now set instance properties
    this.config = config;
    this.sessionManager = new SessionManager(httpClient, config);
  }

  /**
   * Validates the client configuration
   * 
   * @private
   * @param config - Configuration to validate
   * @throws {ConfigurationError} When configuration is invalid
   */
  private static validateConfig(config: UniFiClientConfig): void {
    if (!config) {
      throw new ConfigurationError('Configuration is required');
    }

    if (!config.baseUrl) {
      throw new ConfigurationError('baseUrl is required');
    }

    if (!config.username) {
      throw new ConfigurationError('username is required');
    }

    if (!config.password) {
      throw new ConfigurationError('password is required');
    }
  }

  /**
   * Authenticates with the UniFi controller
   * 
   * Establishes a session with the UniFi controller using the provided credentials.
   * This method must be called before making any API requests that require authentication.
   * 
   * @returns Promise that resolves to true when login is successful
   * @throws {AuthenticationError} When login credentials are invalid
   * @throws {NetworkError} When unable to connect to the controller
   * @throws {ConfigurationError} When client configuration is invalid
   * 
   * @example
   * ```typescript
   * try {
   *   await client.login();
   *   console.log('Successfully logged in');
   * } catch (error) {
   *   if (error instanceof AuthenticationError) {
   *     console.error('Invalid credentials');
   *   } else {
   *     console.error('Login failed:', error.message);
   *   }
   * }
   * ```
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
   * 
   * @returns Promise that resolves to true when logout is successful
   * 
   * @example
   * ```typescript
   * // Always logout when done
   * try {
   *   await client.logout();
   *   console.log('Successfully logged out');
   * } catch (error) {
   *   console.warn('Logout failed, but session cleared locally');
   * }
   * ```
   */
  async logout(): Promise<boolean> {
    await this.sessionManager.logout();
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
   * if (!client.isAuthenticated()) {
   *   await client.login();
   * }
   * 
   * // Now safe to make API calls
   * const devices = await client.listDevices();
   * ```
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
   * const sessionInfo = client.getSessionInfo();
   * console.log(`Logged in as: ${sessionInfo.username}`);
   * console.log(`Site: ${sessionInfo.site}`);
   * console.log(`Session active: ${sessionInfo.isAuthenticated}`);
   * ```
   */
  getSessionInfo() {
    return this.sessionManager.getSessionInfo();
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
   * const site = client.getSite();
   * console.log(`Working with site: ${site}`);
   * ```
   */
  getSite(): string {
    return this.sessionManager.getSite();
  }

  /**
   * Gets the underlying HTTP client instance
   * 
   * Provides access to the internal HTTP client for advanced usage scenarios
   * such as custom request configuration or direct API calls.
   * 
   * @returns The HTTP client instance
   * 
   * @example
   * ```typescript
   * const httpClient = client.getHttpClient();
   * 
   * // Make a custom API call
   * const response = await httpClient.get('/api/s/default/stat/health');
   * ```
   */
  getHttpClient(): HTTPClient {
    return (this as any).httpClient;
  }

  /**
   * Gets the session manager instance
   * 
   * Provides access to the internal session manager for advanced session
   * management scenarios such as custom authentication flows or session monitoring.
   * 
   * @returns The session manager instance
   * 
   * @example
   * ```typescript
   * const sessionManager = client.getSessionManager();
   * 
   * // Check if session needs refresh
   * await sessionManager.ensureAuthenticated();
   * ```
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  // API methods will be generated and added here by the conversion script
}