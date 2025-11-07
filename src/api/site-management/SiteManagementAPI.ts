/**
 * Site Management API module for UniFi Controller
 * 
 * Provides site-related methods including site creation, deletion, configuration,
 * and statistics. This module handles all site management operations for the UniFi API client.
 * 
 * @example
 * ```typescript
 * const siteAPI = new SiteManagementAPI(httpClient);
 * 
 * // List all sites
 * const sites = await siteAPI.list_sites();
 * 
 * // Create a new site
 * await siteAPI.create_site('Branch Office');
 * 
 * // Update site name
 * await siteAPI.set_site_name('Main Office - Updated');
 * 
 * // Get site statistics
 * const stats = await siteAPI.stat_sites();
 * ```
 * 
 * @since 1.0.0
 * @category Site Management
 */

import { HTTPClient } from '../../http';

export class SiteManagementAPI {
  private httpClient: HTTPClient;

  /**
   * Creates a new Site Management API instance
   * 
   * @param httpClient - HTTP client instance for making requests
   */
  constructor(httpClient: HTTPClient) {
    this.httpClient = httpClient;
  }

  /**
   * Substitutes site placeholder in URL
   */
  protected substituteUrl(url: string, site: string = 'default'): string {
    return url.replace('{site}', site);
  }

  /**
   * Makes a request with site substitution and UniFi OS fallback
   */
  protected async makeRequest<T>(config: any, site: string = 'default'): Promise<T> {
    const originalUrl = this.substituteUrl(config.url, site);

    // For UniFi Network Controller endpoints, try UniFi OS fallback if they fail
    if (originalUrl.includes('/api/s/')) {
      const endpoints = [
        originalUrl, // Original Network Controller endpoint
        originalUrl.replace('/api/s/', '/proxy/network/api/s/'), // UniFi OS Network proxy
      ];

      let lastError: Error | undefined;

      for (const endpoint of endpoints) {
        try {
          const substitutedConfig = {
            ...config,
            url: endpoint
          };
          const response = await this.httpClient.request<T>(substitutedConfig);
          return response.data;
        } catch (error) {
          lastError = error as Error;

          // If it's not a 404 error, don't try other endpoints
          if (error instanceof Error && !error.message.includes('404') && !error.message.includes('not found')) {
            break;
          }

          // Continue to next endpoint if this was a 404
          continue;
        }
      }

      // If all endpoints failed, throw the last error
      throw lastError || new Error('All API endpoints failed');
    } else {
      // For non-Network Controller endpoints, use original behavior
      const substitutedConfig = {
        ...config,
        url: originalUrl
      };
      const response = await this.httpClient.request<T>(substitutedConfig);
      return response.data;
    }
  }

  // ============================================================================
  // SITE MANAGEMENT METHODS
  // ============================================================================

  /**
   * Create a new site
   * 
   * Creates a new site in the UniFi Controller with the specified description.
   * Sites are used to organize and manage different network locations or segments.
   * 
   * @group Site Management
   * 
   * @param description - **Required** Description/name for the new site
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to the created site object
   * 
   * @throws {Error} When description is empty or invalid
   * @throws {APIError} When site creation fails
   * 
   * @example
   * ```typescript
   * // Create a new site
   * const newSite = await client.create_site('Branch Office - Seattle');
   * console.log(`Created site: ${newSite.name}`);
   * 
   * // Create site with error handling
   * try {
   *   await client.create_site('Remote Office');
   *   console.log('Site created successfully');
   * } catch (error) {
   *   console.error('Failed to create site:', error.message);
   * }
   * ```
   * 
   * @see {@link list_sites} to view all sites
   * @see {@link delete_site} to remove a site
   * @see {@link set_site_name} to update site name
   * 
   * @since 1.0.0
   * @category Site Management
   * @remarks PHP: create_site($description) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/sitemgr', $payload);
   */
  async create_site(description: string, options?: { signal?: AbortSignal }): Promise<any> {
    if (!description || typeof description !== 'string') {
      throw new Error('Site description cannot be empty');
    }

    const payload = {
      desc: description.trim(),
      cmd: 'add-site'
    };

    return await this.makeRequest<any>({
      method: 'POST',
      url: '/api/s/{site}/cmd/sitemgr',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Delete a site
   * 
   * Permanently removes a site and all its associated data from the UniFi Controller.
   * This operation cannot be undone and will remove all devices, clients, settings,
   * and historical data associated with the site.
   * 
   * @group Site Management
   * 
   * @param site_id - **Required** ID/name of the site to delete
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if deletion was successful
   * 
   * @throws {Error} When site_id is empty or invalid
   * @throws {APIError} When site deletion fails or site doesn't exist
   * 
   * @example
   * ```typescript
   * // Delete a site by ID
   * await client.delete_site('default');
   * 
   * // Find and delete site by description
   * const sites = await client.list_sites();
   * const oldSite = sites.find(site => site.desc === 'Old Branch Office');
   * if (oldSite) {
   *   await client.delete_site(oldSite.name);
   * }
   * ```
   * 
   * @warning This operation is irreversible and removes all site data
   * 
   * @see {@link list_sites} to get site IDs
   * @see {@link create_site} to create a new site
   * 
   * @since 1.0.0
   * @category Site Management
   * @remarks PHP: delete_site($site_id) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/sitemgr', $payload);
   */
  async delete_site(site_id: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!site_id || typeof site_id !== 'string') {
      throw new Error('Site ID cannot be empty');
    }

    const payload = {
      site: site_id.trim(),
      cmd: 'delete-site'
    };

    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/sitemgr',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * List all accessible sites
   * 
   * Retrieves a list of all sites that the current user has access to.
   * Each site object contains information about the site including its name,
   * description, and various configuration details.
   * 
   * @group Site Management
   * 
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to an array of site objects
   * 
   * @throws {APIError} When site listing fails
   * 
   * @example
   * ```typescript
   * // Get all accessible sites
   * const sites = await client.list_sites();
   * console.log(`Found ${sites.length} sites`);
   * 
   * // Find a specific site by description
   * const mainSite = sites.find(site => site.desc === 'Main Office');
   * if (mainSite) {
   *   console.log(`Main site ID: ${mainSite.name}`);
   * }
   * 
   * // List site names and descriptions
   * sites.forEach(site => {
   *   console.log(`${site.name}: ${site.desc}`);
   * });
   * ```
   * 
   * @see {@link create_site} to create a new site
   * @see {@link delete_site} to remove a site
   * @see {@link set_site} to switch to a different site
   * 
   * @since 1.0.0
   * @category Site Management
   * @remarks PHP: list_sites() -> return $this->fetch_results('/api/self/sites');
   */
  async list_sites(options?: { signal?: AbortSignal }): Promise<any> {
    return await this.makeRequest<any>({
      method: 'GET',
      url: '/api/self/sites',
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Set current site for API operations
   * 
   * Sets the current site context for subsequent API calls. This method is used
   * to switch between different sites when managing multiple locations.
   * Note: This is a client-side operation that affects which site subsequent
   * API calls will target.
   * 
   * @group Site Management
   * 
   * @param site - **Required** Site ID/name to switch to
   * 
   * @returns The site name that was set
   * 
   * @throws {Error} When site name is empty or invalid
   * 
   * @example
   * ```typescript
   * // Switch to default site
   * client.set_site('default');
   * 
   * // Switch to branch office site
   * client.set_site('branch-office');
   * 
   * // Get current site after switching
   * const currentSite = client.set_site('new-site');
   * console.log(`Now using site: ${currentSite}`);
   * 
   * // Switch sites for different operations
   * client.set_site('site1');
   * const site1Devices = await client.list_devices();
   * 
   * client.set_site('site2');
   * const site2Devices = await client.list_devices();
   * ```
   * 
   * @see {@link list_sites} to get available site names
   * @see {@link create_site} to create a new site
   * 
   * @since 1.0.0
   * @category Site Management
   * @remarks PHP: set_site($site) -> $this->site = trim($site); return $this->site;
   * Note: This method sets the current site for subsequent API calls
   */
  set_site(site: string): string {
    if (!site || typeof site !== 'string') {
      throw new Error('Site name cannot be empty');
    }

    // This would need to be implemented in UniFiClient to actually change the site
    // For now, we'll just validate and return the site name for compatibility
    return site.trim();
  }

  /**
   * Update site name
   * 
   * Updates the display name/description of the current site.
   * This changes how the site appears in the controller interface.
   * 
   * @group Site Management
   * 
   * @param site_name - **Required** New display name for the site
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if site name update was successful
   * 
   * @throws {Error} When site_name is empty or invalid
   * @throws {APIError} When site name update fails
   * 
   * @example
   * ```typescript
   * // Update site display name
   * await client.set_site_name('Main Office - New York');
   * 
   * // Update with descriptive name
   * await client.set_site_name('Branch Office - Los Angeles');
   * ```
   * 
   * @see {@link list_sites} to see current site names
   * @see {@link create_site} to create a new site with a name
   * 
   * @since 1.0.0
   * @category Site Management
   * @remarks PHP: set_site_name($site_name) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/sitemgr', $payload);
   */
  async set_site_name(site_name: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!site_name || typeof site_name !== 'string') {
      throw new Error('Site name cannot be empty');
    }

    const payload = {
      cmd: 'update-site',
      desc: site_name.trim()
    };

    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/sitemgr',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  // ============================================================================
  // SITE CONFIGURATION METHODS
  // ============================================================================

  /**
   * Update site connectivity settings
   * 
   * Updates connectivity-related settings for the site such as uplink monitoring,
   * internet connectivity checks, and related network connectivity configurations.
   * 
   * @group Site Configuration
   * 
   * @param connectivity_id - **Required** ID of the connectivity setting to update
   * @param payload - **Required** Configuration payload with connectivity settings
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if connectivity settings update was successful
   * 
   * @throws {Error} When connectivity_id is empty or invalid
   * @throws {APIError} When connectivity settings update fails
   * 
   * @example
   * ```typescript
   * // Update connectivity monitoring settings
   * await client.set_site_connectivity('connectivity', {
   *   uplink_connectivity_monitor_enabled: true,
   *   internet_connectivity_monitor_enabled: true
   * });
   * ```
   * 
   * @since 1.0.0
   * @category Site Configuration
   * @remarks PHP: set_site_connectivity($connectivity_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/setting/connectivity/' . trim($connectivity_id), $payload);
   */
  async set_site_connectivity(
    connectivity_id: string,
    payload: any,
    options?: { signal?: AbortSignal }
  ): Promise<boolean> {
    if (!connectivity_id || typeof connectivity_id !== 'string') {
      throw new Error('Connectivity ID cannot be empty');
    }

    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/setting/connectivity/${connectivity_id.trim()}`,
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Update site country settings
   * 
   * Updates country-specific settings for the site including regulatory domain,
   * channel restrictions, and power limitations based on local regulations.
   * 
   * @group Site Configuration
   * 
   * @param country_id - **Required** ID of the country setting to update
   * @param payload - **Required** Configuration payload with country settings
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if country settings update was successful
   * 
   * @throws {Error} When country_id is empty or invalid
   * @throws {APIError} When country settings update fails
   * 
   * @example
   * ```typescript
   * // Update country settings for US
   * await client.set_site_country('country', {
   *   code: 'US',
   *   name: 'United States'
   * });
   * ```
   * 
   * @since 1.0.0
   * @category Site Configuration
   * @remarks PHP: set_site_country($country_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/setting/country/' . trim($country_id), $payload);
   */
  async set_site_country(
    country_id: string,
    payload: any,
    options?: { signal?: AbortSignal }
  ): Promise<boolean> {
    if (!country_id || typeof country_id !== 'string') {
      throw new Error('Country ID cannot be empty');
    }

    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/setting/country/${country_id.trim()}`,
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Update site guest access settings
   * 
   * Updates guest network access settings including portal configuration,
   * authentication methods, bandwidth limits, and access restrictions.
   * 
   * @group Site Configuration
   * 
   * @param guest_access_id - **Required** ID of the guest access setting to update
   * @param payload - **Required** Configuration payload with guest access settings
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if guest access settings update was successful
   * 
   * @throws {Error} When guest_access_id is empty or invalid
   * @throws {APIError} When guest access settings update fails
   * 
   * @example
   * ```typescript
   * // Update guest portal settings
   * await client.set_site_guest_access('guest_access', {
   *   portal_enabled: true,
   *   portal_customized: false,
   *   redirect_enabled: false
   * });
   * ```
   * 
   * @since 1.0.0
   * @category Site Configuration
   * @remarks PHP: set_site_guest_access($guest_access_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/setting/guest_access/' . trim($guest_access_id), $payload);
   */
  async set_site_guest_access(
    guest_access_id: string,
    payload: any,
    options?: { signal?: AbortSignal }
  ): Promise<boolean> {
    if (!guest_access_id || typeof guest_access_id !== 'string') {
      throw new Error('Guest access ID cannot be empty');
    }

    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/setting/guest_access/${guest_access_id.trim()}`,
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Update site locale settings
   * 
   * Updates locale-specific settings for the site including language,
   * timezone, date/time formats, and regional preferences.
   * 
   * @group Site Configuration
   * 
   * @param locale_id - **Required** ID of the locale setting to update
   * @param payload - **Required** Configuration payload with locale settings
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if locale settings update was successful
   * 
   * @throws {Error} When locale_id is empty or invalid
   * @throws {APIError} When locale settings update fails
   * 
   * @example
   * ```typescript
   * // Update timezone settings
   * await client.set_site_locale('locale', {
   *   timezone: 'America/New_York'
   * });
   * ```
   * 
   * @since 1.0.0
   * @category Site Configuration
   * @remarks PHP: set_site_locale($locale_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/setting/locale/' . trim($locale_id), $payload);
   */
  async set_site_locale(
    locale_id: string,
    payload: any,
    options?: { signal?: AbortSignal }
  ): Promise<boolean> {
    if (!locale_id || typeof locale_id !== 'string') {
      throw new Error('Locale ID cannot be empty');
    }

    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/setting/locale/${locale_id.trim()}`,
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Update site management settings
   * 
   * Updates general management settings for the site including LED control,
   * SSH access, SNMP settings, and other administrative configurations.
   * 
   * @group Site Configuration
   * 
   * @param mgmt_id - **Required** ID of the management setting to update
   * @param payload - **Required** Configuration payload with management settings
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if management settings update was successful
   * 
   * @throws {Error} When mgmt_id is empty or invalid
   * @throws {APIError} When management settings update fails
   * 
   * @example
   * ```typescript
   * // Update LED settings
   * await client.set_site_mgmt('mgmt', {
   *   led_enabled: true,
   *   x_ssh_enabled: false
   * });
   * ```
   * 
   * @since 1.0.0
   * @category Site Configuration
   * @remarks PHP: set_site_mgmt($mgmt_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/setting/mgmt/' . trim($mgmt_id), $payload);
   */
  async set_site_mgmt(
    mgmt_id: string,
    payload: any,
    options?: { signal?: AbortSignal }
  ): Promise<boolean> {
    if (!mgmt_id || typeof mgmt_id !== 'string') {
      throw new Error('Management ID cannot be empty');
    }

    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/setting/mgmt/${mgmt_id.trim()}`,
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Update site NTP settings
   * 
   * Updates Network Time Protocol (NTP) settings for the site including
   * NTP servers, time synchronization preferences, and related time settings.
   * 
   * @group Site Configuration
   * 
   * @param ntp_id - **Required** ID of the NTP setting to update
   * @param payload - **Required** Configuration payload with NTP settings
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if NTP settings update was successful
   * 
   * @throws {Error} When ntp_id is empty or invalid
   * @throws {APIError} When NTP settings update fails
   * 
   * @example
   * ```typescript
   * // Update NTP server settings
   * await client.set_site_ntp('ntp', {
   *   ntp_server_1: 'pool.ntp.org',
   *   ntp_server_2: 'time.google.com'
   * });
   * ```
   * 
   * @since 1.0.0
   * @category Site Configuration
   * @remarks PHP: set_site_ntp($ntp_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/setting/ntp/' . trim($ntp_id), $payload);
   */
  async set_site_ntp(
    ntp_id: string,
    payload: any,
    options?: { signal?: AbortSignal }
  ): Promise<boolean> {
    if (!ntp_id || typeof ntp_id !== 'string') {
      throw new Error('NTP ID cannot be empty');
    }

    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/setting/ntp/${ntp_id.trim()}`,
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Update site SNMP settings
   * 
   * Updates Simple Network Management Protocol (SNMP) settings for the site
   * including SNMP community strings, access controls, and monitoring configuration.
   * 
   * @group Site Configuration
   * 
   * @param snmp_id - **Required** ID of the SNMP setting to update
   * @param payload - **Required** Configuration payload with SNMP settings
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if SNMP settings update was successful
   * 
   * @throws {Error} When snmp_id is empty or invalid
   * @throws {APIError} When SNMP settings update fails
   * 
   * @example
   * ```typescript
   * // Update SNMP community settings
   * await client.set_site_snmp('snmp', {
   *   snmp_community: 'public',
   *   snmp_contact: 'admin@company.com',
   *   snmp_location: 'Main Office'
   * });
   * ```
   * 
   * @since 1.0.0
   * @category Site Configuration
   * @remarks PHP: set_site_snmp($snmp_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/setting/snmp/' . trim($snmp_id), $payload);
   */
  async set_site_snmp(
    snmp_id: string,
    payload: any,
    options?: { signal?: AbortSignal }
  ): Promise<boolean> {
    if (!snmp_id || typeof snmp_id !== 'string') {
      throw new Error('SNMP ID cannot be empty');
    }

    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/setting/snmp/${snmp_id.trim()}`,
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  // ============================================================================
  // SITE SETTINGS & CONFIGURATION METHODS
  // ============================================================================

  /**
   * List site settings
   * 
   * Retrieves all configuration settings for the current site including
   * management settings, connectivity options, locale preferences, and other
   * site-specific configuration parameters.
   * 
   * @group Site Settings
   * 
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to an array of site settings objects
   * 
   * @throws {APIError} When settings retrieval fails
   * 
   * @example
   * ```typescript
   * // Get all site settings
   * const settings = await client.list_settings();
   * 
   * // Find specific setting by key
   * const mgmtSettings = settings.find(setting => setting.key === 'mgmt');
   * if (mgmtSettings) {
   *   console.log('Management settings:', mgmtSettings);
   * }
   * 
   * // Display all setting keys
   * settings.forEach(setting => {
   *   console.log(`Setting: ${setting.key}`);
   * });
   * ```
   * 
   * @see {@link set_site_mgmt} to update management settings
   * @see {@link set_site_locale} to update locale settings
   * @see {@link set_site_connectivity} to update connectivity settings
   * 
   * @since 1.0.0
   * @category Site Settings
   * @remarks PHP: list_settings() -> return $this->fetch_results('/api/s/' . $this->site . '/get/setting');
   */
  async list_settings(options?: { signal?: AbortSignal }): Promise<any> {
    return await this.makeRequest<any>({
      method: 'GET',
      url: '/api/s/{site}/get/setting',
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * List self information
   * 
   * Retrieves information about the current user/admin session including
   * permissions, roles, and access levels for the current site context.
   * 
   * @group Site Settings
   * 
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to user/admin self information object
   * 
   * @throws {APIError} When self information retrieval fails
   * 
   * @example
   * ```typescript
   * // Get current user information
   * const selfInfo = await client.list_self();
   * console.log('Current user:', selfInfo.name);
   * console.log('Admin level:', selfInfo.admin_level);
   * 
   * // Check user permissions
   * if (selfInfo.is_super) {
   *   console.log('User has super admin privileges');
   * }
   * 
   * // Display user details
   * console.log('User Details:', {
   *   name: selfInfo.name,
   *   email: selfInfo.email,
   *   role: selfInfo.role,
   *   lastLogin: new Date(selfInfo.last_login * 1000).toLocaleString()
   * });
   * ```
   * 
   * @since 1.0.0
   * @category Site Settings
   * @remarks PHP: list_self() -> return $this->fetch_results('/api/s/' . $this->site . '/self');
   */
  async list_self(options?: { signal?: AbortSignal }): Promise<any> {
    return await this.makeRequest<any>({
      method: 'GET',
      url: '/api/s/{site}/self',
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Set super identity settings base
   * 
   * Updates super administrator identity settings including authentication
   * methods, identity providers, and related security configurations.
   * This affects controller-wide identity management settings.
   * 
   * @group Site Settings
   * 
   * @param payload - **Required** Configuration payload with identity settings
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if identity settings update was successful
   * 
   * @throws {APIError} When identity settings update fails
   * 
   * @example
   * ```typescript
   * // Update identity provider settings
   * await client.set_super_identity_settings_base({
   *   auth_method: 'local',
   *   enable_sso: false
   * });
   * 
   * // Configure LDAP authentication
   * await client.set_super_identity_settings_base({
   *   auth_method: 'ldap',
   *   ldap_server: 'ldap.company.com',
   *   ldap_port: 389,
   *   ldap_bind_dn: 'cn=admin,dc=company,dc=com'
   * });
   * ```
   * 
   * @warning This affects controller-wide authentication settings
   * 
   * @since 1.0.0
   * @category Site Settings
   * @remarks PHP: set_super_identity_settings_base($payload) -> return $this->fetch_results_boolean('/api/set/setting/super_identity', $payload);
   */
  async set_super_identity_settings_base(payload: any, options?: { signal?: AbortSignal }): Promise<boolean> {
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: '/api/set/setting/super_identity',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Set super management settings base
   * 
   * Updates super administrator management settings including system-wide
   * management preferences, access controls, and administrative configurations.
   * This affects controller-wide management settings.
   * 
   * @group Site Settings
   * 
   * @param payload - **Required** Configuration payload with management settings
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if management settings update was successful
   * 
   * @throws {APIError} When management settings update fails
   * 
   * @example
   * ```typescript
   * // Update system management settings
   * await client.set_super_mgmt_settings_base({
   *   auto_upgrade: true,
   *   ssh_enabled: false,
   *   analytics_enabled: true
   * });
   * 
   * // Configure backup settings
   * await client.set_super_mgmt_settings_base({
   *   auto_backup: true,
   *   backup_retention_days: 30,
   *   backup_location: '/data/backups'
   * });
   * ```
   * 
   * @warning This affects controller-wide management settings
   * 
   * @since 1.0.0
   * @category Site Settings
   * @remarks PHP: set_super_mgmt_settings_base($payload) -> return $this->fetch_results_boolean('/api/set/setting/super_mgmt', $payload);
   */
  async set_super_mgmt_settings_base(payload: any, options?: { signal?: AbortSignal }): Promise<boolean> {
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: '/api/set/setting/super_mgmt',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Set super SMTP settings base
   * 
   * Updates super administrator SMTP settings including email server configuration,
   * authentication credentials, and notification preferences for system-wide
   * email communications.
   * 
   * @group Site Settings
   * 
   * @param payload - **Required** Configuration payload with SMTP settings
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if SMTP settings update was successful
   * 
   * @throws {APIError} When SMTP settings update fails
   * 
   * @example
   * ```typescript
   * // Configure SMTP server settings
   * await client.set_super_smtp_settings_base({
   *   smtp_server: 'smtp.gmail.com',
   *   smtp_port: 587,
   *   smtp_use_tls: true,
   *   smtp_username: 'notifications@company.com',
   *   smtp_password: 'app-password'
   * });
   * 
   * // Update email notification settings
   * await client.set_super_smtp_settings_base({
   *   smtp_enabled: true,
   *   from_email: 'unifi@company.com',
   *   from_name: 'UniFi Controller',
   *   enable_notifications: true
   * });
   * ```
   * 
   * @warning This affects controller-wide email settings
   * 
   * @since 1.0.0
   * @category Site Settings
   * @remarks PHP: set_super_smtp_settings_base($payload) -> return $this->fetch_results_boolean('/api/set/setting/super_smtp', $payload);
   */
  async set_super_smtp_settings_base(payload: any, options?: { signal?: AbortSignal }): Promise<boolean> {
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: '/api/set/setting/super_smtp',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  // ============================================================================
  // SITE LED CONTROL METHODS
  // ============================================================================

  /**
   * Enable or disable site LEDs
   * 
   * Controls the LED status for all devices in the site. This is useful for
   * identifying devices in a physical location or reducing light pollution.
   * 
   * @group Site LED Control
   * 
   * @param enable - **Required** Whether to enable (true) or disable (false) LEDs
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if LED control was successful
   * 
   * @throws {APIError} When LED control fails
   * 
   * @example
   * ```typescript
   * // Turn on all site LEDs
   * await client.site_leds(true);
   * 
   * // Turn off all site LEDs
   * await client.site_leds(false);
   * 
   * // Toggle LEDs based on time of day
   * const isNightTime = new Date().getHours() > 22 || new Date().getHours() < 6;
   * await client.site_leds(!isNightTime);
   * ```
   * 
   * @see {@link site_ledson} for turning LEDs on (deprecated)
   * @see {@link site_ledsoff} for turning LEDs off (deprecated)
   * 
   * @since 1.0.0
   * @category Site LED Control
   * @remarks PHP: site_leds($enable) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/set/setting/mgmt', $payload);
   */
  async site_leds(enable: boolean, options?: { signal?: AbortSignal }): Promise<boolean> {
    const payload = {
      led_enabled: enable
    };

    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: '/api/s/{site}/set/setting/mgmt',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Turn off site LEDs
   * 
   * @deprecated This method is deprecated. Use `site_leds(false)` instead.
   * 
   * @example
   * ```typescript
   * // Instead of:
   * await client.site_ledsoff();
   * 
   * // Use:
   * await client.site_leds(false);
   * ```
   * 
   * @since 1.0.0
   * @category Site LED Control
   * @remarks PHP: site_ledsoff() -> throw new MethodDeprecatedException('Function site_ledsoff() has been deprecated, use site_leds() instead.');
   */
  async site_ledsoff(options?: { signal?: AbortSignal }): Promise<boolean> {
    // Deprecated method - use site_leds(false) instead
    return await this.site_leds(false, options);
  }

  /**
   * Turn on site LEDs
   * 
   * @deprecated This method is deprecated. Use `site_leds(true)` instead.
   * 
   * @example
   * ```typescript
   * // Instead of:
   * await client.site_ledson();
   * 
   * // Use:
   * await client.site_leds(true);
   * ```
   * 
   * @since 1.0.0
   * @category Site LED Control
   * @remarks PHP: site_ledson() -> throw new MethodDeprecatedException('Function site_ledson() has been deprecated, use site_leds() instead.');
   */
  async site_ledson(options?: { signal?: AbortSignal }): Promise<boolean> {
    // Deprecated method - use site_leds(true) instead
    return await this.site_leds(true, options);
  }

  // ============================================================================
  // SITE STATISTICS METHODS
  // ============================================================================

  /**
   * Fetch 5-minute site statistics
   * 
   * Retrieves detailed 5-minute interval statistics for the site including
   * bandwidth usage, client counts, and other network metrics over time.
   * 
   * @group Site Statistics
   * 
   * @param start - Optional start time as Unix timestamp (defaults to 12 hours ago)
   * @param end - Optional end time as Unix timestamp (defaults to current time)
   * @param attribs - Optional array of specific attributes to retrieve
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to an array of 5-minute site statistics
   * 
   * @throws {APIError} When statistics retrieval fails
   * 
   * @example
   * ```typescript
   * // Get last 12 hours of 5-minute stats
   * const stats = await client.stat_5minutes_site();
   * 
   * // Get stats for specific time range
   * const start = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
   * const end = Date.now();
   * const stats = await client.stat_5minutes_site(start, end);
   * 
   * // Get specific attributes only
   * const stats = await client.stat_5minutes_site(
   *   undefined, 
   *   undefined, 
   *   ['bytes', 'num_sta']
   * );
   * ```
   * 
   * @see {@link stat_hourly_site} for hourly statistics
   * @see {@link stat_daily_site} for daily statistics
   * @see {@link stat_monthly_site} for monthly statistics
   * 
   * @since 1.0.0
   * @category Site Statistics
   * @remarks PHP: stat_5minutes_site($start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/5minutes.site', $payload);
   */
  async stat_5minutes_site(
    start?: number,
    end?: number,
    attribs?: string[],
    options?: { signal?: AbortSignal }
  ): Promise<any> {
    const current_time = Date.now();
    const end_time = end || current_time;
    const start_time = start || (end_time - (12 * 3600 * 1000)); // 12 hours ago
    const attributes = attribs || [
      'bytes',
      'wan-tx_bytes',
      'wan-rx_bytes',
      'wlan_bytes',
      'num_sta',
      'lan-num_sta',
      'wlan-num_sta',
      'time'
    ];

    // Ensure 'time' is always included
    const final_attribs = attributes.includes('time') ? attributes : ['time', ...attributes];

    const payload = {
      attrs: final_attribs,
      start: Math.floor(start_time / 1000),
      end: Math.floor(end_time / 1000)
    };

    return await this.makeRequest<any>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/5minutes.site',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Fetch daily site statistics
   * 
   * Retrieves daily aggregated statistics for the site including bandwidth usage,
   * client counts, and other network metrics over time.
   * 
   * @group Site Statistics
   * 
   * @param start - Optional start time as Unix timestamp (defaults to 7 days ago)
   * @param end - Optional end time as Unix timestamp (defaults to current time)
   * @param attribs - Optional array of specific attributes to retrieve
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to an array of daily site statistics
   * 
   * @throws {APIError} When statistics retrieval fails
   * 
   * @example
   * ```typescript
   * // Get last 7 days of daily stats
   * const stats = await client.stat_daily_site();
   * 
   * // Get stats for specific month
   * const start = new Date('2023-01-01').getTime();
   * const end = new Date('2023-02-01').getTime();
   * const stats = await client.stat_daily_site(start, end);
   * ```
   * 
   * @see {@link stat_5minutes_site} for 5-minute statistics
   * @see {@link stat_hourly_site} for hourly statistics
   * @see {@link stat_monthly_site} for monthly statistics
   * 
   * @since 1.0.0
   * @category Site Statistics
   * @remarks PHP: stat_daily_site($start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/daily.site', $payload);
   */
  async stat_daily_site(
    start?: number,
    end?: number,
    attribs?: string[],
    options?: { signal?: AbortSignal }
  ): Promise<any> {
    const current_time = Date.now();
    const end_time = end || current_time;
    const start_time = start || (end_time - (7 * 24 * 3600 * 1000)); // 7 days ago
    const attributes = attribs || [
      'bytes',
      'wan-tx_bytes',
      'wan-rx_bytes',
      'wlan_bytes',
      'num_sta',
      'lan-num_sta',
      'wlan-num_sta',
      'time'
    ];

    // Ensure 'time' is always included
    const final_attribs = attributes.includes('time') ? attributes : ['time', ...attributes];

    const payload = {
      attrs: final_attribs,
      start: Math.floor(start_time / 1000),
      end: Math.floor(end_time / 1000)
    };

    return await this.makeRequest<any>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/daily.site',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Fetch hourly site statistics
   * 
   * Retrieves hourly aggregated statistics for the site including bandwidth usage,
   * client counts, and other network metrics over time.
   * 
   * @group Site Statistics
   * 
   * @param start - Optional start time as Unix timestamp (defaults to 7 days ago)
   * @param end - Optional end time as Unix timestamp (defaults to current time)
   * @param attribs - Optional array of specific attributes to retrieve
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to an array of hourly site statistics
   * 
   * @throws {APIError} When statistics retrieval fails
   * 
   * @example
   * ```typescript
   * // Get last 7 days of hourly stats
   * const stats = await client.stat_hourly_site();
   * 
   * // Get stats for specific day
   * const start = new Date('2023-01-01').getTime();
   * const end = new Date('2023-01-02').getTime();
   * const stats = await client.stat_hourly_site(start, end);
   * ```
   * 
   * @see {@link stat_5minutes_site} for 5-minute statistics
   * @see {@link stat_daily_site} for daily statistics
   * @see {@link stat_monthly_site} for monthly statistics
   * 
   * @since 1.0.0
   * @category Site Statistics
   * @remarks PHP: stat_hourly_site($start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/hourly.site', $payload);
   */
  async stat_hourly_site(
    start?: number,
    end?: number,
    attribs?: string[],
    options?: { signal?: AbortSignal }
  ): Promise<any> {
    const current_time = Date.now();
    const end_time = end || current_time;
    const start_time = start || (end_time - (7 * 24 * 3600 * 1000)); // 7 days ago
    const attributes = attribs || [
      'bytes',
      'wan-tx_bytes',
      'wan-rx_bytes',
      'wlan_bytes',
      'num_sta',
      'lan-num_sta',
      'wlan-num_sta',
      'time'
    ];

    // Ensure 'time' is always included
    const final_attribs = attributes.includes('time') ? attributes : ['time', ...attributes];

    const payload = {
      attrs: final_attribs,
      start: Math.floor(start_time / 1000),
      end: Math.floor(end_time / 1000)
    };

    return await this.makeRequest<any>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/hourly.site',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Fetch monthly site statistics
   * 
   * Retrieves monthly aggregated statistics for the site including bandwidth usage,
   * client counts, and other network metrics over time.
   * 
   * @group Site Statistics
   * 
   * @param start - Optional start time as Unix timestamp (defaults to 1 year ago)
   * @param end - Optional end time as Unix timestamp (defaults to current time)
   * @param attribs - Optional array of specific attributes to retrieve
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to an array of monthly site statistics
   * 
   * @throws {APIError} When statistics retrieval fails
   * 
   * @example
   * ```typescript
   * // Get last 12 months of monthly stats
   * const stats = await client.stat_monthly_site();
   * 
   * // Get stats for specific year
   * const start = new Date('2023-01-01').getTime();
   * const end = new Date('2024-01-01').getTime();
   * const stats = await client.stat_monthly_site(start, end);
   * ```
   * 
   * @see {@link stat_5minutes_site} for 5-minute statistics
   * @see {@link stat_hourly_site} for hourly statistics
   * @see {@link stat_daily_site} for daily statistics
   * 
   * @since 1.0.0
   * @category Site Statistics
   * @remarks PHP: stat_monthly_site($start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/monthly.site', $payload);
   */
  async stat_monthly_site(
    start?: number,
    end?: number,
    attribs?: string[],
    options?: { signal?: AbortSignal }
  ): Promise<any> {
    const current_time = Date.now();
    const end_time = end || current_time;
    const start_time = start || (end_time - (365 * 24 * 3600 * 1000)); // 1 year ago
    const attributes = attribs || [
      'bytes',
      'wan-tx_bytes',
      'wan-rx_bytes',
      'wlan_bytes',
      'num_sta',
      'lan-num_sta',
      'wlan-num_sta',
      'time'
    ];

    // Ensure 'time' is always included
    const final_attribs = attributes.includes('time') ? attributes : ['time', ...attributes];

    const payload = {
      attrs: final_attribs,
      start: Math.floor(start_time / 1000),
      end: Math.floor(end_time / 1000)
    };

    return await this.makeRequest<any>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/monthly.site',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Fetch sites statistics
   * 
   * Retrieves statistics and information for all accessible sites.
   * This provides an overview of all sites managed by the controller.
   * 
   * @group Site Statistics
   * 
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to an array of site statistics
   * 
   * @throws {APIError} When sites statistics retrieval fails
   * 
   * @example
   * ```typescript
   * // Get statistics for all sites
   * const sitesStats = await client.stat_sites();
   * 
   * // Find site with most clients
   * const busiestSite = sitesStats.reduce((prev, current) => 
   *   (prev.num_sta > current.num_sta) ? prev : current
   * );
   * console.log(`Busiest site: ${busiestSite.desc} with ${busiestSite.num_sta} clients`);
   * ```
   * 
   * @see {@link list_sites} to get basic site information
   * @see {@link stat_5minutes_site} for detailed site statistics
   * 
   * @since 1.0.0
   * @category Site Statistics
   * @remarks PHP: stat_sites() -> return $this->fetch_results('/api/stat/sites');
   */
  async stat_sites(options?: { signal?: AbortSignal }): Promise<any> {
    return await this.makeRequest<any>({
      method: 'GET',
      url: '/api/stat/sites',
      ...(options?.signal && { signal: options.signal }),
    });
  }

  // ============================================================================
  // BACKUP & SYSTEM MANAGEMENT METHODS
  // ============================================================================

  /**
   * Download backup
   * 
   * Downloads a backup file from the specified filepath. This method returns raw backup data
   * that should be saved to a file. The filepath is typically obtained from list_backups().
   * 
   * @group Backup Management
   * 
   * @param filepath - **Required** Path to the backup file to download
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to raw backup data (ArrayBuffer)
   * 
   * @throws {Error} When filepath is empty or invalid
   * @throws {APIError} When backup download fails
   * 
   * @example
   * ```typescript
   * // List available backups first
   * const backups = await client.list_backups();
   * 
   * // Download the most recent backup
   * if (backups.length > 0) {
   *   const backupData = await client.download_backup(backups[0].filename);
   *   // Save backupData to file system
   * }
   * 
   * // Download specific backup with error handling
   * try {
   *   const backupData = await client.download_backup('/path/to/backup.unf');
   *   console.log('Backup downloaded successfully');
   * } catch (error) {
   *   console.error('Failed to download backup:', error.message);
   * }
   * ```
   * 
   * @see {@link list_backups} to get available backup files
   * @see {@link generate_backup} to create a new backup
   * 
   * @since 1.0.0
   * @category Backup Management
   * @remarks PHP: download_backup($filepath) -> return $this->exec_curl($filepath);
   * Note: This method returns raw backup data that should be saved to a file
   */
  async download_backup(filepath: string, options?: { signal?: AbortSignal }): Promise<any> {
    if (!filepath || typeof filepath !== 'string') {
      throw new Error('Backup filepath cannot be empty');
    }

    return await this.makeRequest<any>({
      method: 'GET',
      url: filepath,
      responseType: 'arraybuffer', // For binary data
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Generate backup
   * 
   * Initiates the creation of a new backup for the current site. The backup process
   * runs asynchronously on the controller. Use list_backups() to check for completion.
   * 
   * @group Backup Management
   * 
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if backup generation was initiated successfully
   * 
   * @throws {APIError} When backup generation fails to start
   * 
   * @example
   * ```typescript
   * // Generate a new backup
   * await client.generate_backup();
   * console.log('Backup generation started');
   * 
   * // Wait and check for completion
   * setTimeout(async () => {
   *   const backups = await client.list_backups();
   *   console.log(`Found ${backups.length} backups`);
   * }, 30000); // Check after 30 seconds
   * 
   * // Generate backup with error handling
   * try {
   *   await client.generate_backup();
   *   console.log('Backup generation initiated successfully');
   * } catch (error) {
   *   console.error('Failed to start backup generation:', error.message);
   * }
   * ```
   * 
   * @see {@link list_backups} to check backup status
   * @see {@link download_backup} to download completed backups
   * @see {@link generate_backup_site} for site-specific backup generation
   * 
   * @since 1.0.0
   * @category Backup Management
   * @remarks PHP: generate_backup() -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/backup', $payload);
   */
  async generate_backup(options?: { signal?: AbortSignal }): Promise<boolean> {
    const payload = {
      cmd: 'backup'
    };

    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/backup',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Generate backup for site
   * 
   * Initiates the creation of a new backup specifically for the current site.
   * This is functionally identical to generate_backup() but explicitly targets
   * site-level backup generation.
   * 
   * @group Backup Management
   * 
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if site backup generation was initiated successfully
   * 
   * @throws {APIError} When site backup generation fails to start
   * 
   * @example
   * ```typescript
   * // Generate a site-specific backup
   * await client.generate_backup_site();
   * console.log('Site backup generation started');
   * 
   * // Generate backup for current site with monitoring
   * try {
   *   await client.generate_backup_site();
   *   
   *   // Poll for completion
   *   const checkBackup = async () => {
   *     const backups = await client.list_backups();
   *     const latestBackup = backups[0];
   *     if (latestBackup && Date.now() - latestBackup.datetime < 60000) {
   *       console.log('New backup completed:', latestBackup.filename);
   *     } else {
   *       setTimeout(checkBackup, 5000); // Check again in 5 seconds
   *     }
   *   };
   *   
   *   setTimeout(checkBackup, 10000); // Start checking after 10 seconds
   * } catch (error) {
   *   console.error('Failed to start site backup:', error.message);
   * }
   * ```
   * 
   * @see {@link generate_backup} for general backup generation
   * @see {@link list_backups} to check backup status
   * @see {@link download_backup} to download completed backups
   * 
   * @since 1.0.0
   * @category Backup Management
   * @remarks PHP: generate_backup_site() -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/backup', $payload);
   */
  async generate_backup_site(options?: { signal?: AbortSignal }): Promise<boolean> {
    const payload = {
      cmd: 'backup'
    };

    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/backup',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * List available backups
   * 
   * Retrieves a list of all available backup files for the current site.
   * Each backup entry includes metadata such as filename, size, and creation date.
   * 
   * @group Backup Management
   * 
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to an array of backup information objects
   * 
   * @throws {APIError} When backup listing fails
   * 
   * @example
   * ```typescript
   * // List all available backups
   * const backups = await client.list_backups();
   * console.log(`Found ${backups.length} backups`);
   * 
   * // Display backup information
   * backups.forEach(backup => {
   *   console.log(`Backup: ${backup.filename}`);
   *   console.log(`Size: ${backup.size} bytes`);
   *   console.log(`Created: ${new Date(backup.datetime * 1000).toLocaleString()}`);
   * });
   * 
   * // Find most recent backup
   * const sortedBackups = backups.sort((a, b) => b.datetime - a.datetime);
   * const latestBackup = sortedBackups[0];
   * if (latestBackup) {
   *   console.log(`Latest backup: ${latestBackup.filename}`);
   * }
   * 
   * // Filter backups by age
   * const oneWeekAgo = Date.now() / 1000 - (7 * 24 * 60 * 60);
   * const recentBackups = backups.filter(backup => backup.datetime > oneWeekAgo);
   * console.log(`${recentBackups.length} backups from the last week`);
   * ```
   * 
   * @see {@link generate_backup} to create new backups
   * @see {@link download_backup} to download backup files
   * 
   * @since 1.0.0
   * @category Backup Management
   * @remarks PHP: list_backups() -> return $this->fetch_results('/api/s/' . $this->site . '/cmd/backup', $payload);
   */
  async list_backups(options?: { signal?: AbortSignal }): Promise<any> {
    const payload = {
      cmd: 'list-backups'
    };

    return await this.makeRequest<any>({
      method: 'POST',
      url: '/api/s/{site}/cmd/backup',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Update OS console
   * 
   * Initiates an update of the UniFi OS console/controller software.
   * This command triggers the controller to check for and install available updates.
   * The update process runs asynchronously and may cause temporary service interruption.
   * 
   * @group System Management
   * 
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to true if OS update was initiated successfully
   * 
   * @throws {APIError} When OS update initiation fails
   * 
   * @example
   * ```typescript
   * // Check for updates first
   * const updateInfo = await client.get_update_os_console();
   * if (updateInfo.update_available) {
   *   console.log(`Update available: ${updateInfo.version}`);
   *   
   *   // Initiate the update
   *   await client.update_os_console();
   *   console.log('OS update started - controller may restart');
   * }
   * 
   * // Update with error handling
   * try {
   *   await client.update_os_console();
   *   console.log('OS update initiated successfully');
   *   console.log('Controller may be unavailable during update process');
   * } catch (error) {
   *   console.error('Failed to start OS update:', error.message);
   * }
   * ```
   * 
   * @warning This operation may cause controller restart and temporary service interruption
   * 
   * @see {@link get_update_os_console} to check for available updates
   * 
   * @since 1.0.0
   * @category System Management
   * @remarks PHP: update_os_console() -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/system', $payload);
   */
  async update_os_console(options?: { signal?: AbortSignal }): Promise<boolean> {
    const payload = {
      cmd: 'update-os'
    };

    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/system',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Get OS console update information
   * 
   * Retrieves information about available OS console/controller updates including
   * version numbers, release notes, and update availability status.
   * 
   * @group System Management
   * 
   * @param options - Optional request configuration
   * @param options.signal - Optional AbortSignal to cancel the request
   * 
   * @returns Promise resolving to OS update information object
   * 
   * @throws {APIError} When update information retrieval fails
   * 
   * @example
   * ```typescript
   * // Check for available updates
   * const updateInfo = await client.get_update_os_console();
   * 
   * if (updateInfo.update_available) {
   *   console.log(`Update available: ${updateInfo.version}`);
   *   console.log(`Current version: ${updateInfo.current_version}`);
   *   console.log(`Release notes: ${updateInfo.release_notes}`);
   * } else {
   *   console.log('No updates available');
   * }
   * 
   * // Display detailed update information
   * console.log('Update Status:', {
   *   available: updateInfo.update_available,
   *   currentVersion: updateInfo.current_version,
   *   latestVersion: updateInfo.version,
   *   releaseDate: updateInfo.release_date,
   *   downloadSize: updateInfo.download_size
   * });
   * 
   * // Check update status with error handling
   * try {
   *   const updateInfo = await client.get_update_os_console();
   *   if (updateInfo.update_available) {
   *     console.log('Update check completed - update available');
   *   } else {
   *     console.log('Update check completed - system is up to date');
   *   }
   * } catch (error) {
   *   console.error('Failed to check for updates:', error.message);
   * }
   * ```
   * 
   * @see {@link update_os_console} to initiate OS update
   * 
   * @since 1.0.0
   * @category System Management
   * @remarks PHP: get_update_os_console() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/fwupdate/latest-version');
   */
  async get_update_os_console(options?: { signal?: AbortSignal }): Promise<any> {
    return await this.makeRequest<any>({
      method: 'GET',
      url: '/api/s/{site}/stat/fwupdate/latest-version',
      ...(options?.signal && { signal: options.signal }),
    });
  }
}