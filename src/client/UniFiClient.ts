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

import { AuthenticationAPI } from '../api/authentication';
import { DeviceManagementAPI } from '../api/device-management';
import { ClientManagementAPI } from '../api/client-management';
import { NetworkManagementAPI } from '../api/network-management';
import { SiteManagementAPI } from '../api/site-management';
import { UserManagementAPI } from '../api/user-management';
import { SecurityAPI } from '../api/security';
import { StatisticsAPI } from '../api/statistics';

export class UniFiClient {
  private config: UniFiClientConfig;
  private httpClient: HTTPClient;
  private sessionManager: SessionManager;
  private authenticationAPI: AuthenticationAPI;
  private deviceManagementAPI: DeviceManagementAPI;
  private clientManagementAPI: ClientManagementAPI;
  private networkManagementAPI: NetworkManagementAPI;
  private siteManagementAPI: SiteManagementAPI;
  private userManagementAPI: UserManagementAPI;
  private securityAPI: SecurityAPI;
  private statisticsAPI: StatisticsAPI;



  // ============================================================================
  // MODULAR API METHODS
  // ============================================================================

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

    this.httpClient = new HTTPClient(httpConfig);

    // Set instance properties
    this.config = config;
    this.sessionManager = new SessionManager(this.httpClient, config);
    this.authenticationAPI = new AuthenticationAPI(this.httpClient, this.sessionManager);
    this.deviceManagementAPI = new DeviceManagementAPI(this.httpClient);
    this.clientManagementAPI = new ClientManagementAPI(this.httpClient);
    this.networkManagementAPI = new NetworkManagementAPI(this.httpClient);
    this.siteManagementAPI = new SiteManagementAPI(this.httpClient);
    this.userManagementAPI = new UserManagementAPI(this.httpClient);
    this.securityAPI = new SecurityAPI(this.httpClient);
    this.statisticsAPI = new StatisticsAPI(this.httpClient);
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
    return this.authenticationAPI.login();
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
    return this.authenticationAPI.logout();
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
    return this.authenticationAPI.isAuthenticated();
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
    return this.authenticationAPI.getSessionInfo();
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
    return this.authenticationAPI.getSite();
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
    return this.httpClient;
  }

  /**
   * Gets the authentication API instance
   * 
   * Provides access to the authentication API for advanced authentication
   * scenarios such as custom authentication flows or session monitoring.
   * 
   * @returns The authentication API instance
   * 
   * @example
   * ```typescript
   * const authAPI = client.getAuthenticationAPI();
   * 
   * // Check if session needs refresh
   * await authAPI.ensureAuthenticated();
   * ```
   */
  getAuthenticationAPI(): AuthenticationAPI {
    return this.authenticationAPI;
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

  /**
   * Gets the device management API instance
   * 
   * Provides access to the device management API for advanced device
   * management scenarios such as custom device operations or bulk operations.
   * 
   * @returns The device management API instance
   * 
   * @example
   * ```typescript
   * const deviceAPI = client.getDeviceManagementAPI();
   * 
   * // Use device management API directly
   * const devices = await deviceAPI.list_devices();
   * ```
   */
  getDeviceManagementAPI(): DeviceManagementAPI {
    return this.deviceManagementAPI;
  }

  /**
   * Gets the client management API instance
   * 
   * Provides access to the client management API for advanced client
   * management scenarios such as bulk client operations or guest management.
   * 
   * @returns The client management API instance
   * 
   * @example
   * ```typescript
   * const clientAPI = client.getClientManagementAPI();
   * 
   * // Use client management API directly
   * const clients = await clientAPI.list_users();
   * await clientAPI.block_sta('default', 'aa:bb:cc:dd:ee:ff');
   * ```
   */
  getClientManagementAPI(): ClientManagementAPI {
    return this.clientManagementAPI;
  }

  /**
   * Get the Network Management API instance
   * 
   * Provides access to network configuration operations including network creation,
   * VLAN management, routing configuration, DNS settings, and port forwarding.
   * 
   * @returns NetworkManagementAPI instance
   * 
   * @example
   * ```typescript
   * const networkAPI = client.getNetworkManagementAPI();
   * 
   * // Use network management API directly
   * const networks = await networkAPI.list_networkconf();
   * await networkAPI.create_network({
   *   name: 'Guest Network',
   *   purpose: 'guest',
   *   ip_subnet: '192.168.100.1/24'
   * });
   * ```
   */
  getNetworkManagementAPI(): NetworkManagementAPI {
    return this.networkManagementAPI;
  }

  /**
   * Get the Site Management API instance
   * 
   * Provides access to site management operations including site creation,
   * deletion, configuration, and statistics.
   * 
   * @returns Site Management API instance
   * 
   * @example
   * ```typescript
   * const siteAPI = client.getSiteManagementAPI();
   * 
   * // Use site management API directly
   * const sites = await siteAPI.list_sites();
   * await siteAPI.create_site('New Branch Office');
   * await siteAPI.set_site_name('Updated Office Name');
   * const stats = await siteAPI.stat_sites();
   * ```
   */
  getSiteManagementAPI(): SiteManagementAPI {
    return this.siteManagementAPI;
  }

  /**
   * Get the User Management API instance
   * 
   * Provides access to user, user group, and administrator management operations
   * including user creation, group management, and admin permissions.
   * 
   * @returns User Management API instance
   * 
   * @example
   * ```typescript
   * const userAPI = client.getUserManagementAPI();
   * 
   * // Use user management API directly
   * const users = await userAPI.list_users();
   * await userAPI.create_user('aa:bb:cc:dd:ee:ff', 'group_id', 'John Doe');
   * const groups = await userAPI.list_usergroups();
   * ```
   */
  getUserManagementAPI(): UserManagementAPI {
    return this.userManagementAPI;
  }

  /**
   * Get the Security API instance
   * 
   * Provides access to security-related operations including firewall management,
   * IPS/IDS settings, RADIUS authentication, and access controls.
   * 
   * @returns Security API instance
   * 
   * @example
   * ```typescript
   * const securityAPI = client.getSecurityAPI();
   * 
   * // Use security API directly
   * const firewallGroups = await securityAPI.list_firewallgroups();
   * await securityAPI.create_firewallgroup('BlockedIPs', 'address-group', ['192.168.1.100']);
   * const radiusAccounts = await securityAPI.list_radius_accounts();
   * ```
   */
  getSecurityAPI(): SecurityAPI {
    return this.securityAPI;
  }

  /**
   * Get the Statistics API instance
   * 
   * Provides access to statistics and monitoring operations including system health,
   * event monitoring, and various time-based statistics.
   * 
   * @returns Statistics API instance
   * 
   * @example
   * ```typescript
   * const statsAPI = client.getStatisticsAPI();
   * 
   * // Use statistics API directly
   * const sysInfo = await statsAPI.stat_sysinfo();
   * const events = await statsAPI.list_events();
   * const health = await statsAPI.list_health();
   * ```
   */
  getStatisticsAPI(): StatisticsAPI {
    return this.statisticsAPI;
  }

  // ============================================================================
  // CAMELCASE ALIASES FOR API METHODS
  // ============================================================================
  // These aliases provide camelCase versions of the underscore API methods
  // for better TypeScript/JavaScript developer experience

  // Core API methods
  async listUsers(clientMac?: string, options?: { signal?: AbortSignal }) { 
    // If first parameter is actually options object, handle it
    if (clientMac && typeof clientMac === 'object' && 'signal' in clientMac) {
      return this.clientManagementAPI.list_users(this.config.site || 'default', clientMac as { signal?: AbortSignal });
    }
    return this.clientManagementAPI.list_users(this.config.site || 'default', options); 
  }
  async listDevices(macs?: string | string[], options?: { signal?: AbortSignal }) { return this.deviceManagementAPI.list_devices(macs, options); }
  async statSysinfo(options?: { signal?: AbortSignal }) { return this.statisticsAPI.stat_sysinfo(this.config.site || 'default', options); }

  // Device management
  async adoptDevice(macs: string | string[], options?: { signal?: AbortSignal }) { 
    // Validate MAC addresses
    const mac_array = Array.isArray(macs) ? macs : [macs];
    for (const mac of mac_array) {
      if (!mac || typeof mac !== 'string' || mac.trim() === '') {
        throw new Error('Invalid MAC address');
      }
      // Basic MAC format validation
      const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
      if (!macRegex.test(mac)) {
        throw new Error('Invalid MAC address');
      }
    }
    return this.deviceManagementAPI.adopt_device(macs, options); 
  }
  async advancedAdoptDevice(mac: string, ip: string, username: string, password: string, url: string, port?: number, sshKeyVerify?: boolean, options?: { signal?: AbortSignal }) {
    return this.deviceManagementAPI.advanced_adopt_device(mac, ip, username, password, url, port, sshKeyVerify, options);
  }
  async blockSta(mac: string, options?: { signal?: AbortSignal }) { return this.clientManagementAPI.block_sta(this.config.site || 'default', mac, options); }
  async forceProvision(macs: string | string[], options?: { signal?: AbortSignal }) { return this.deviceManagementAPI.force_provision(macs, options); }
  async forgetSta(macs: string | string[], options?: { signal?: AbortSignal }) { return this.clientManagementAPI.forget_sta(this.config.site || 'default', macs, options); }

  // Guest management
  async authorizeGuest(mac: string, minutes: number, up?: number, down?: number, megabytes?: number, apMac?: string, options?: { signal?: AbortSignal }) {
    return this.clientManagementAPI.authorize_guest(this.config.site || 'default', mac, minutes, up, down, megabytes, apMac, options);
  }
  async extendGuestValidity(guestId: string, options?: { signal?: AbortSignal }) { return this.clientManagementAPI.extend_guest_validity(this.config.site || 'default', guestId, options); }

  // WLAN management
  async createWlan(name: string, xPassphrase: string, usergroupId: string, wlangroupId: string, enabled?: boolean, hideSsid?: boolean, isGuest?: boolean, security?: string, wpaMode?: string, wpaEnc?: string, vlanEnabled?: boolean, vlanId?: string, uapsdEnabled?: boolean, scheduleEnabled?: boolean, schedule?: any[], apGroupIds?: string[], additionalPayload?: any, options?: { signal?: AbortSignal }) {
    // Validate required parameters
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Parameter name must be a non-empty string');
    }
    return this.networkManagementAPI.create_wlan(name, xPassphrase, usergroupId, wlangroupId, enabled, hideSsid, isGuest, security, wpaMode, wpaEnc, vlanEnabled, vlanId, uapsdEnabled, scheduleEnabled, schedule, apGroupIds, additionalPayload, this.config.site || 'default', options);
  }
  async deleteWlan(wlanId: string, options?: { signal?: AbortSignal }) { return this.networkManagementAPI.delete_wlan(wlanId, this.config.site || 'default', options); }

  // Network management
  async createNetwork(payload: any, options?: { signal?: AbortSignal }) { return this.networkManagementAPI.create_network(payload, this.config.site || 'default', options); }
  async deleteNetwork(networkId: string, options?: { signal?: AbortSignal }) { return this.networkManagementAPI.delete_network(networkId, this.config.site || 'default', options); }
  async listNetworks(networkId?: string, options?: { signal?: AbortSignal }) { return this.networkManagementAPI.list_networkconf(networkId, this.config.site || 'default', options); }
  async updateNetworkSettings(networkId: string, payload: any, options?: { signal?: AbortSignal }) { return this.networkManagementAPI.set_networksettings_base(networkId, payload, this.config.site || 'default', options); }
  async listRouting(routeId?: string, options?: { signal?: AbortSignal }) { return this.networkManagementAPI.list_routing(routeId, this.config.site || 'default', options); }
  async listPortConfigurations(options?: { signal?: AbortSignal }) { return this.networkManagementAPI.list_portconf(this.config.site || 'default', options); }
  async listPortForwarding(options?: { signal?: AbortSignal }) { return this.networkManagementAPI.list_portforwarding(this.config.site || 'default', options); }
  async listPortForwardingStats(options?: { signal?: AbortSignal }) { return this.networkManagementAPI.list_portforward_stats(this.config.site || 'default', options); }
  async createDnsRecord(recordType: 'A' | 'AAAA' | 'MX' | 'TXT' | 'SRV' | 'NS', value: string, key: string, ttl?: number, enabled?: boolean, options?: { signal?: AbortSignal }) { 
    return this.networkManagementAPI.create_dns_record(recordType, value, key, ttl, enabled, this.config.site || 'default', options); 
  }
  async listDnsRecords(options?: { signal?: AbortSignal }) { return this.networkManagementAPI.list_dns_records(this.config.site || 'default', options); }
  async deleteDnsRecord(recordId: string, options?: { signal?: AbortSignal }) { return this.networkManagementAPI.delete_dns_record(recordId, this.config.site || 'default', options); }
  async createDynamicDns(payload: any, options?: { signal?: AbortSignal }) { return this.networkManagementAPI.create_dynamicdns(payload, this.config.site || 'default', options); }
  async listDynamicDns(options?: { signal?: AbortSignal }) { return this.networkManagementAPI.list_dynamicdns(this.config.site || 'default', options); }
  async updateDynamicDns(dynamicDnsId: string, payload: any, options?: { signal?: AbortSignal }) { return this.networkManagementAPI.set_dynamicdns(dynamicDnsId, payload, this.config.site || 'default', options); }

  // Site management
  async createSite(description: string, options?: { signal?: AbortSignal }) { 
    // Validate required parameters
    if (!description || typeof description !== 'string' || description.trim() === '') {
      throw new Error('Parameter description must be a non-empty string');
    }
    return this.siteManagementAPI.create_site(description, options); 
  }
  async deleteSite(siteId: string, options?: { signal?: AbortSignal }) { return this.siteManagementAPI.delete_site(siteId, options); }

  // Backup management
  async generateBackup(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.generate_backup(options); }
  async generateBackupSite(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.generate_backup_site(options); }
  async downloadBackup(filepath: string, options?: { signal?: AbortSignal }) { return this.siteManagementAPI.download_backup(filepath, options); }
  async listBackups(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.list_backups(options); }

  // System management
  async updateOsConsole(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.update_os_console(options); }
  async getUpdateOsConsole(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.get_update_os_console(options); }

  // Settings management
  async listSettings(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.list_settings(options); }
  async listSelf(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.list_self(options); }
  async setSuperIdentitySettingsBase(payload: any, options?: { signal?: AbortSignal }) { return this.siteManagementAPI.set_super_identity_settings_base(payload, options); }
  async setSuperMgmtSettingsBase(payload: any, options?: { signal?: AbortSignal }) { return this.siteManagementAPI.set_super_mgmt_settings_base(payload, options); }
  async setSuperSmtpSettingsBase(payload: any, options?: { signal?: AbortSignal }) { return this.siteManagementAPI.set_super_smtp_settings_base(payload, options); }

  // Backup & System management (underscore naming for backward compatibility)
  async download_backup(filepath: string, options?: { signal?: AbortSignal }) { return this.siteManagementAPI.download_backup(filepath, options); }
  async generate_backup(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.generate_backup(options); }
  async generate_backup_site(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.generate_backup_site(options); }
  async list_backups(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.list_backups(options); }
  async update_os_console(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.update_os_console(options); }
  async get_update_os_console(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.get_update_os_console(options); }

  // Settings management (underscore naming for backward compatibility)
  async list_settings(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.list_settings(options); }
  async list_self(options?: { signal?: AbortSignal }) { return this.siteManagementAPI.list_self(options); }
  async set_super_identity_settings_base(payload: any, options?: { signal?: AbortSignal }) { return this.siteManagementAPI.set_super_identity_settings_base(payload, options); }
  async set_super_mgmt_settings_base(payload: any, options?: { signal?: AbortSignal }) { return this.siteManagementAPI.set_super_mgmt_settings_base(payload, options); }
  async set_super_smtp_settings_base(payload: any, options?: { signal?: AbortSignal }) { return this.siteManagementAPI.set_super_smtp_settings_base(payload, options); }

  // Alarm management
  async archiveAlarm(alarmId?: string, options?: { signal?: AbortSignal }) { return this.statisticsAPI.archive_alarm(alarmId, this.config.site, options); }
  async countAlarms(archived?: boolean, options?: { signal?: AbortSignal }) { return this.statisticsAPI.count_alarms(archived, this.config.site, options); }

  // User management
  async createUser(mac: string, userGroupId: string, name?: string, note?: string, isGuest?: boolean, isWired?: boolean, options?: { signal?: AbortSignal }) {
    return this.userManagementAPI.create_user(this.config.site || 'default', mac, userGroupId, name, note, isGuest, isWired, options);
  }
  async createUsergroup(groupName: string, groupDn?: number, groupUp?: number, options?: { signal?: AbortSignal }) {
    return this.userManagementAPI.create_usergroup(this.config.site || 'default', groupName, groupDn || -1, groupUp || -1, options);
  }
  async deleteUsergroup(groupId: string, options?: { signal?: AbortSignal }) { return this.userManagementAPI.delete_usergroup(groupId, this.config.site || 'default', options); }

  // Voucher management
  async createVoucher(minutes: number, count?: number, quota?: number, note?: string, up?: number, down?: number, megabytes?: number, options?: { signal?: AbortSignal }) {
    return this.clientManagementAPI.create_voucher(minutes, count, quota, note, up, down, megabytes, this.config.site || 'default', options);
  }

  // Tag management
  async createTag(name: string, macs?: string[], options?: { signal?: AbortSignal }) { return this.clientManagementAPI.create_tag(name, macs, this.config.site || 'default', options); }
  async deleteTag(tagId: string, options?: { signal?: AbortSignal }) { return this.clientManagementAPI.delete_tag(tagId, this.config.site || 'default', options); }

  // Access point group management
  async createApgroup(groupName: string, deviceMacs?: string[], options?: { signal?: AbortSignal }) {
    return this.deviceManagementAPI.create_apgroup(groupName, deviceMacs, options);
  }
  async deleteApgroup(groupId: string, options?: { signal?: AbortSignal }) { 
    return this.deviceManagementAPI.delete_apgroup(groupId, options); 
  }
  async editApgroup(groupId: string, groupName: string, deviceMacs: string[], options?: { signal?: AbortSignal }) {
    return this.deviceManagementAPI.edit_apgroup(groupId, groupName, deviceMacs, options);
  }

  // AP Group methods (underscore naming for backward compatibility)
  async create_apgroup(groupName: string, deviceMacs: string[] = [], options?: { signal?: AbortSignal }) {
    return this.deviceManagementAPI.create_apgroup(groupName, deviceMacs, options);
  }
  async delete_apgroup(groupId: string, options?: { signal?: AbortSignal }) {
    return this.deviceManagementAPI.delete_apgroup(groupId, options);
  }
  async edit_apgroup(groupId: string, groupName: string, deviceMacs: string[], options?: { signal?: AbortSignal }) {
    return this.deviceManagementAPI.edit_apgroup(groupId, groupName, deviceMacs, options);
  }

  // Firewall group management
  async createFirewallgroup(groupName: string, groupType: 'address-group' | 'ipv6-address-group' | 'port-group', groupMembers?: string[], options?: { signal?: AbortSignal }) {
    return this.securityAPI.create_firewallgroup(groupName, groupType, groupMembers, this.config.site || 'default', options);
  }
  async deleteFirewallgroup(groupId: string, options?: { signal?: AbortSignal }) { return this.securityAPI.delete_firewallgroup(groupId, this.config.site || 'default', options); }
  async editFirewallgroup(groupId: string, siteId: string, groupName: string, groupType: 'address-group' | 'ipv6-address-group' | 'port-group', groupMembers?: string[], options?: { signal?: AbortSignal }) {
    return this.securityAPI.edit_firewallgroup(groupId, siteId, groupName, groupType, groupMembers, this.config.site || 'default', options);
  }

  // RADIUS account management
  async createRadiusAccount(name: string, xPassword: string, tunnelType?: number, tunnelMediumType?: number, vlan?: number, options?: { signal?: AbortSignal }) {
    return this.securityAPI.create_radius_account(name, xPassword, tunnelType, tunnelMediumType, vlan, this.config.site || 'default', options);
  }
  async deleteRadiusAccount(accountId: string, options?: { signal?: AbortSignal }) { return this.securityAPI.delete_radius_account(accountId, this.config.site || 'default', options); }



  // Dynamic DNS management
  async createDynamicdns(payload: any, options?: { signal?: AbortSignal }) { return this.networkManagementAPI.create_dynamicdns(payload, this.config.site || 'default', options); }

  // Hotspot operator management
  async createHotspotop(name: string, xPassword: string, note?: string, options?: { signal?: AbortSignal }) {
    return this.clientManagementAPI.create_hotspotop(name, xPassword, note, this.config.site || 'default', options);
  }

  // Device management
  async cancelMigrateDevice(macs: string | string[], options?: { signal?: AbortSignal }) { return this.deviceManagementAPI.cancel_migrate_device(macs, options); }
  async cancelRollingUpgrade(options?: { signal?: AbortSignal }) { return this.deviceManagementAPI.cancel_rolling_upgrade(options); }
  async checkControllerUpdate(options?: { signal?: AbortSignal }) { 
    return this.statisticsAPI.check_controller_update(this.config.site || 'default', options);
  }
  async checkFirmwareUpdate(options?: { signal?: AbortSignal }) { return this.deviceManagementAPI.check_firmware_update(options); }
  async deleteDevice(mac: string, options?: { signal?: AbortSignal }) { return this.deviceManagementAPI.delete_device(mac, options); }
  async disableAp(apId: string, disable: boolean, options?: { signal?: AbortSignal }) { return this.deviceManagementAPI.disable_ap(apId, disable, options); }
  async disableWlan(wlanId: string, disable: boolean, options?: { signal?: AbortSignal }) { 
    return this.networkManagementAPI.disable_wlan(wlanId, disable, this.config.site || 'default', options);
  }

  // Client management
  async editClientFixedip(clientId: string, useFixedip: boolean, networkId?: string, fixedIp?: string, options?: { signal?: AbortSignal }) {
    return this.clientManagementAPI.edit_client_fixedip(this.config.site, clientId, useFixedip, networkId, fixedIp, options);
  }
  async editClientName(clientId: string, name: string, options?: { signal?: AbortSignal }) {
    return this.clientManagementAPI.edit_client_name(this.config.site, clientId, name, options);
  }
  async editUsergroup(groupId: string, siteId: string, groupName: string, groupDn?: number, groupUp?: number, options?: { signal?: AbortSignal }) {
    return this.userManagementAPI.edit_usergroup(this.config.site || 'default', groupId, siteId, groupName, groupDn, groupUp, options);
  }

  // Admin management
  async assignExistingAdmin(adminId: string, readonly?: boolean, deviceAdopt?: boolean, deviceRestart?: boolean, options?: { signal?: AbortSignal }) {
    return this.userManagementAPI.assign_existing_admin(this.config.site || 'default', adminId, readonly || false, deviceAdopt || false, deviceRestart || false, options);
  }
  async deleteAdmin(adminId: string, options?: { signal?: AbortSignal }) { return this.userManagementAPI.delete_admin(this.config.site || 'default', adminId, options); }

  // Statistics and command methods
  async cmdStat(command: string, options?: { signal?: AbortSignal }) { return this.statisticsAPI.cmd_stat(command, this.config.site || 'default', options); }

  // Custom API request
  async customApiRequest(path: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', payload?: any, returnType?: 'array' | 'boolean', options?: { signal?: AbortSignal }) {
    // Make a direct HTTP request using the httpClient
    const requestConfig: any = {
      method: method || 'GET',
      url: path,
      data: payload
    };
    
    if (options?.signal) {
      requestConfig.signal = options.signal;
    }
    
    const response = await this.httpClient.request(requestConfig);
    
    if (returnType === 'boolean') {
      return response.data === true || (response.data && response.data.meta && response.data.meta.rc === 'ok');
    }
    
    return response.data;
  }

  // Getter methods (camelCase aliases)
  getClassVersion(): string { return '1.0.0'; }
  getConnectionTimeout(): number { return 30000; } // Default timeout
  getCookie(): string { return ''; } // Placeholder
  getCookies(): string { return ''; } // Placeholder
  getCookiesCreatedAt(): number { return Date.now(); } // Placeholder
  getCurlHttpVersion(): string { return '2.0'; }
  getCurlMethod(): string { return 'POST'; }
  getCurlRequestTimeout(): number { return 30000; } // Default timeout
  getCurlSslVerifyHost(): number { return 2; } // Default verify
  getCurlSslVerifyPeer(): boolean { return true; } // Default verify

  // ============================================================================
  // BATCH 6 METHODS (methods 76-90)
  // ============================================================================

  // List methods from batch 6
  async listAllAdmins(options?: { signal?: AbortSignal }) { return this.userManagementAPI.list_all_admins(options); }
  async listApgroups(options?: { signal?: AbortSignal }) { return this.deviceManagementAPI.list_apgroups(options); }
  async listAps(mac?: string, options?: { signal?: AbortSignal }) { return this.deviceManagementAPI.list_aps(mac, options); }
  async listClients(mac?: string, options?: { signal?: AbortSignal }) { return this.clientManagementAPI.list_clients(this.config.site, mac, options); }
  async listClientsHistory(historyhours?: number, start?: number, end?: number, mac?: string, options?: { signal?: AbortSignal }) {
    return this.clientManagementAPI.list_clients_history(this.config.site, historyhours, start, end, mac, options);
  }
  async listCountryCodes(options?: { signal?: AbortSignal }) { return this.networkManagementAPI.list_country_codes(this.config.site, options); }
  async listCurrentChannels(options?: { signal?: AbortSignal }) { return this.networkManagementAPI.list_current_channels(this.config.site, options); }
  async listDashboard(fiveMinutes?: boolean, options?: { signal?: AbortSignal }) { return this.statisticsAPI.list_dashboard(fiveMinutes, this.config.site, options); }
  async listDeviceNameMappings(options?: { signal?: AbortSignal }) { return this.deviceManagementAPI.list_device_name_mappings(options); }
  async listDeviceStates(options?: { signal?: AbortSignal }) { return this.deviceManagementAPI.list_device_states(options); }
  async listDevicesBasic(mac?: string, options?: { signal?: AbortSignal }) { return this.deviceManagementAPI.list_devices_basic(mac, options); }
  async listDpiStats(options?: { signal?: AbortSignal }) { return this.statisticsAPI.list_dpi_stats(this.config.site, options); }
  async listDpiStatsFiltered(type?: 'by_app' | 'by_cat', catFilter?: string, options?: { signal?: AbortSignal }) {
    return this.statisticsAPI.list_dpi_stats_filtered(type, catFilter, this.config.site, options);
  }

  // ============================================================================
  // BATCH 7 METHODS (methods 91-105)
  // ============================================================================

  async listDynamicdns(options?: { signal?: AbortSignal }) {
    return this.networkManagementAPI.list_dynamicdns(this.config.site, options);
  }

  async listExtension(options?: { signal?: AbortSignal }) {
    return this.statisticsAPI.list_extension(this.config.site, options);
  }

  async listFingerprintDevices(options?: { signal?: AbortSignal }) {
    return this.statisticsAPI.list_fingerprint_devices(this.config.site, options);
  }

  async listFirewallgroups(options?: { signal?: AbortSignal }) {
    return this.securityAPI.list_firewallgroups(this.config.site, options);
  }

  async listFirewallrules(options?: { signal?: AbortSignal }) {
    return this.securityAPI.list_firewallrules(this.config.site, options);
  }

  async listFirmware(type?: 'available' | 'cached', options?: { signal?: AbortSignal }) {
    return this.deviceManagementAPI.list_firmware(type, options);
  }

  async listGuests(within?: number, options?: { signal?: AbortSignal }) {
    return this.clientManagementAPI.list_guests(this.config.site, within, options);
  }

  async listHealth(options?: { signal?: AbortSignal }) {
    return this.statisticsAPI.list_health(this.config.site, options);
  }

  async listHotspotop(options?: { signal?: AbortSignal }) {
    return this.clientManagementAPI.list_hotspotop(this.config.site, options);
  }

  async listKnownRogueaps(options?: { signal?: AbortSignal }) {
    return this.statisticsAPI.list_known_rogueaps(this.config.site, options);
  }

  async listModels(options?: { signal?: AbortSignal }) {
    return this.deviceManagementAPI.list_models(options);
  }

  async listPortconf(options?: { signal?: AbortSignal }) {
    return this.networkManagementAPI.list_portconf(this.config.site, options);
  }

  async listPortforwardStats(options?: { signal?: AbortSignal }) {
    return this.networkManagementAPI.list_portforward_stats(this.config.site, options);
  }

  // ============================================================================
  // PLACEHOLDER METHODS FOR FUTURE BATCHES
  // ============================================================================
  // These methods are expected by tests but will be implemented in future batches
  // For now, they throw "not implemented" errors

  async listWlanconf(wlan_id?: string, options?: { signal?: AbortSignal }): Promise<any[]> {
    // Handle the case where first parameter might be options object
    if (wlan_id && typeof wlan_id === 'object' && 'signal' in wlan_id) {
      return this.networkManagementAPI.list_wlanconf(this.config.site, wlan_id as { signal?: AbortSignal });
    }
    return this.networkManagementAPI.list_wlanconf(this.config.site, options);
  }

  async listNetworkconf(network_id?: string, options?: { signal?: AbortSignal }): Promise<any[]> {
    // Handle the case where first parameter might be options object
    if (network_id && typeof network_id === 'object' && 'signal' in network_id) {
      return this.networkManagementAPI.list_networkconf(undefined, this.config.site, network_id as { signal?: AbortSignal });
    }
    return this.networkManagementAPI.list_networkconf(network_id, this.config.site, options);
  }

  async listSites(options?: { signal?: AbortSignal }): Promise<any[]> {
    return this.siteManagementAPI.list_sites(options);
  }

  async listEvents(historyhours?: number, start?: number, end?: number, limit?: number, options?: { signal?: AbortSignal }): Promise<any[]> {
    return this.statisticsAPI.list_events(historyhours, start, end, limit, this.config.site, options);
  }

  async listAlarms(payload?: any, options?: { signal?: AbortSignal }): Promise<any[]> {
    return this.statisticsAPI.list_alarms(payload, this.config.site, options);
  }

  // ============================================================================
  // BATCH 9: PHP API METHODS (methods 121-135) - Now implemented
  // ============================================================================

  async migrateDevice(macs: string | string[], inform_url: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.deviceManagementAPI.migrate_device(macs, inform_url, options);
  }

  async moveDevice(mac: string, site_id: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.networkManagementAPI.move_device(mac, site_id, this.config.site || 'default', options);
  }

  async powerCycleSwitchPort(mac: string, port_idx: number, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.deviceManagementAPI.power_cycle_switch_port(mac, port_idx, options);
  }

  async rebootCloudkey(options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.deviceManagementAPI.reboot_cloudkey(options);
  }

  async reconnectSta(mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.clientManagementAPI.reconnect_sta(this.config.site, mac, options);
  }

  async renameAp(ap_id: string, ap_name: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.deviceManagementAPI.rename_ap(ap_id, ap_name, options);
  }

  async restartAp(options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.deviceManagementAPI.restart_ap(options);
  }

  async restartDevice(macs: string | string[], reboot_type: 'soft' | 'hard' = 'soft', options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.deviceManagementAPI.restart_device(macs, reboot_type, options);
  }

  async revokeAdmin(admin_id: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.userManagementAPI.revoke_admin(this.config.site || 'default', admin_id, options);
  }

  async revokeVoucher(voucher_id: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.clientManagementAPI.revoke_voucher(voucher_id, this.config.site, options);
  }

  async setApRadiosettings(ap_id: string, radio: string, channel: number, ht: number, tx_power_mode: string, tx_power: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.deviceManagementAPI.set_ap_radiosettings(ap_id, radio, channel, ht, tx_power_mode, tx_power, options);
  }

  async setApWlangroup(type_id: 'ng' | 'na', device_id: string, group_id: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.deviceManagementAPI.set_ap_wlangroup(type_id, device_id, group_id, options);
  }

  setConnectionTimeout(timeout: number): boolean {
    this.httpClient.setTimeout(timeout);
    return true;
  }

  setCookies(_cookies_value: string): void {
    // This method is not yet implemented in SessionManager
    // For now, this is a placeholder
  }

  setCurlHttpVersion(_http_version: number): boolean {
    // HTTP version is handled by the underlying HTTP client
    return true;
  }

  async unauthorizeGuest(mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.clientManagementAPI.unauthorize_guest(this.config.site, mac, options);
  }

  // User/Admin Management methods (underscore naming for backward compatibility)
  async delete_admin(admin_id: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.userManagementAPI.delete_admin(this.config.site || 'default', admin_id, options);
  }

  async edit_usergroup(
    group_id: string,
    site_id: string,
    group_name: string,
    group_dn: number = -1,
    group_up: number = -1,
    options?: { signal?: AbortSignal }
  ): Promise<any> {
    return this.userManagementAPI.edit_usergroup(this.config.site || 'default', group_id, site_id, group_name, group_dn, group_up, options);
  }

  // Core API methods (underscore naming for backward compatibility)
  async list_devices(macs?: string | string[], options?: { signal?: AbortSignal }) { 
    return this.deviceManagementAPI.list_devices(macs, options); 
  }
  
  async adopt_device(macs: string | string[], options?: { signal?: AbortSignal }) { 
    return this.deviceManagementAPI.adopt_device(macs, options); 
  }
  
  async restart_device(macs: string | string[], reboot_type: 'soft' | 'hard' = 'soft', options?: { signal?: AbortSignal }) { 
    return this.deviceManagementAPI.restart_device(macs, reboot_type, options); 
  }
  
  async list_users(client_mac?: string, options?: { signal?: AbortSignal }) { 
    return this.clientManagementAPI.list_users(this.config.site, options); 
  }
  
  async block_sta(mac: string, options?: { signal?: AbortSignal }) { 
    return this.clientManagementAPI.block_sta(this.config.site, mac, options); 
  }
  
  async authorize_guest(mac: string, minutes: number, up?: number, down?: number, megabytes?: number, apMac?: string, options?: { signal?: AbortSignal }) {
    return this.clientManagementAPI.authorize_guest(this.config.site, mac, minutes, up, down, megabytes, apMac, options);
  }
  
  async list_wlanconf(wlan_id?: string, options?: { signal?: AbortSignal }) { 
    return this.networkManagementAPI.list_wlanconf(this.config.site, options); 
  }
  
  async create_wlan(name: string, x_passphrase: string, usergroup_id: string, wlangroup_id: string, enabled?: boolean, hide_ssid?: boolean, is_guest?: boolean, security?: string, wpa_mode?: string, wpa_enc?: string, vlan_enabled?: boolean, vlan_id?: string, uapsd_enabled?: boolean, schedule_enabled?: boolean, schedule?: any[], ap_group_ids?: string[], additional_payload?: any, options?: { signal?: AbortSignal }) {
    return this.networkManagementAPI.create_wlan(name, x_passphrase, usergroup_id, wlangroup_id, enabled, hide_ssid, is_guest, security, wpa_mode, wpa_enc, vlan_enabled, vlan_id, uapsd_enabled, schedule_enabled, schedule, ap_group_ids, additional_payload, this.config.site, options);
  }

  // Additional underscore methods for backward compatibility
  async list_sites(options?: { signal?: AbortSignal }): Promise<any[]> {
    return this.siteManagementAPI.list_sites(options);
  }

  async create_site(description: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.siteManagementAPI.create_site(description, options);
  }

  async list_networkconf(network_id?: string, options?: { signal?: AbortSignal }): Promise<any[]> {
    return this.networkManagementAPI.list_networkconf(network_id, this.config.site || 'default', options);
  }

  async create_network(payload: any, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.networkManagementAPI.create_network(payload, this.config.site || 'default', options);
  }

  async stat_sysinfo(options?: { signal?: AbortSignal }): Promise<any> {
    return this.statisticsAPI.stat_sysinfo(this.config.site || 'default', options);
  }

  async list_events(historyhours?: number, start?: number, end?: number, limit?: number, options?: { signal?: AbortSignal }): Promise<any[]> {
    return this.statisticsAPI.list_events(historyhours, start, end, limit, this.config.site || 'default', options);
  }

  async list_alarms(payload?: any, options?: { signal?: AbortSignal }): Promise<any[]> {
    return this.statisticsAPI.list_alarms(payload, this.config.site || 'default', options);
  }

  async reconnect_sta(mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.clientManagementAPI.reconnect_sta(this.config.site || 'default', mac, options);
  }

  async unauthorize_guest(mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return this.clientManagementAPI.unauthorize_guest(this.config.site || 'default', mac, options);
  }
}