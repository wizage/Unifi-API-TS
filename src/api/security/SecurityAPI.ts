/**
 * Security API module for UniFi Controller
 * 
 * This module contains all security-related API methods including:
 * - Firewall groups and rules management
 * - IPS/IDS settings
 * - RADIUS authentication
 * - Access control and MAC filtering
 * - SNMP security settings
 * - Guest access controls
 * 
 * @since 1.0.0
 * @category Security
 */

import { HTTPClient } from '../../http/HTTPClient';

export class SecurityAPI {
    constructor(private httpClient: HTTPClient) {}

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
    // FIREWALL MANAGEMENT
    // ============================================================================

    /**
     * Create firewall group
     * 
     * Creates a new firewall group for organizing IP addresses or ports.
     * Firewall groups simplify rule management by grouping related addresses or ports.
     * 
     * @group Security
     * 
     * @param group_name - **Required** Name for the firewall group
     * @param group_type - **Required** Type of group: 'address-group', 'ipv6-address-group', or 'port-group'
     * @param group_members - Optional array of group members (IP addresses or ports)
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to the created firewall group object
     * 
     * @throws {Error} When group_name or group_type validation fails
     * @throws {APIError} When firewall group creation fails
     * 
     * @example
     * ```typescript
     * // Create address group for internal servers
     * const serverGroup = await securityAPI.create_firewallgroup(
     *   'Internal Servers',
     *   'address-group',
     *   ['192.168.1.10', '192.168.1.11', '192.168.1.12']
     * );
     * 
     * // Create port group for web services
     * await securityAPI.create_firewallgroup(
     *   'Web Ports',
     *   'port-group',
     *   ['80', '443', '8080', '8443']
     * );
     * 
     * // Create IPv6 address group
     * await securityAPI.create_firewallgroup(
     *   'IPv6 Servers',
     *   'ipv6-address-group',
     *   ['2001:db8::1', '2001:db8::2']
     * );
     * 
     * // Create empty group (add members later)
     * await securityAPI.create_firewallgroup('DMZ Hosts', 'address-group');
     * ```
     * 
     * @see {@link list_firewallgroups} to list existing firewall groups
     * @see {@link delete_firewallgroup} to remove a firewall group
     * @see {@link edit_firewallgroup} to modify firewall group members
     * 
     * PHP: create_firewallgroup($group_name, $group_type, $group_members = [])
     */
    async create_firewallgroup(
        group_name: string,
        group_type: 'address-group' | 'ipv6-address-group' | 'port-group',
        group_members: string[] = [],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload = {
            name: group_name,
            group_type,
            group_members
        };

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/rest/firewallgroup',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List firewall groups
     * 
     * Retrieves all firewall groups configured in the UniFi Controller.
     * Firewall groups are used to organize IP addresses or ports for use in firewall rules.
     * 
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of firewall group objects
     * 
     * @throws {APIError} When firewall groups retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all firewall groups
     * const groups = await securityAPI.list_firewallgroups();
     * console.log(`Found ${groups.length} firewall groups`);
     * 
     * // Filter by group type
     * const addressGroups = groups.filter(group => group.group_type === 'address-group');
     * const portGroups = groups.filter(group => group.group_type === 'port-group');
     * 
     * // Find specific group by name
     * const serverGroup = groups.find(group => group.name === 'Internal Servers');
     * ```
     * 
     * @see {@link create_firewallgroup} to create new firewall groups
     * @see {@link delete_firewallgroup} to remove firewall groups
     * @see {@link list_firewallrules} to see how groups are used in rules
     * 
     * PHP: list_firewallgroups() -> return $this->fetch_results('/api/s/' . $this->site . '/list/firewallgroup');
     */
    async list_firewallgroups(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/list/firewallgroup',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List firewall rules
     * 
     * Retrieves all firewall rules configured in the UniFi Controller.
     * Includes information about rule actions, sources, destinations, and protocols.
     * 
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of firewall rule objects
     * 
     * @throws {APIError} When firewall rules retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all firewall rules
     * const rules = await securityAPI.list_firewallrules();
     * console.log(`Found ${rules.length} firewall rules`);
     * 
     * // Filter rules by action
     * const blockRules = rules.filter(rule => rule.action === 'drop');
     * const allowRules = rules.filter(rule => rule.action === 'accept');
     * 
     * // Find rules for specific protocol
     * const httpRules = rules.filter(rule => 
     *   rule.dst_port === '80' || rule.dst_port === '443'
     * );
     * 
     * // List enabled rules only
     * const activeRules = rules.filter(rule => rule.enabled);
     * ```
     * 
     * @see {@link create_firewallrule} to create new firewall rules
     * @see {@link delete_firewallrule} to remove firewall rules
     * @see {@link list_firewallgroups} to list firewall groups used in rules
     * 
     * PHP: list_firewallrules() -> return $this->fetch_results('/api/s/' . $this->site . '/list/firewallrule');
     */
    async list_firewallrules(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/list/firewallrule',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Delete firewall group
     * 
     * Deletes a firewall group from the UniFi Controller.
     * Firewall rules using this group will need to be updated before deletion.
     * 
     * @param group_id - **Required** Firewall group ID to delete
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if firewall group deletion was successful
     * 
     * @throws {Error} When group_id is invalid
     * @throws {APIError} When firewall group deletion fails or group is in use
     * 
     * @example
     * ```typescript
     * // Delete firewall group by ID
     * await securityAPI.delete_firewallgroup('507f1f77bcf86cd799439011');
     * 
     * // Find and delete firewall group by name
     * const groups = await securityAPI.list_firewallgroups();
     * const oldGroup = groups.find(group => group.name === 'Old Servers');
     * if (oldGroup) {
     *   await securityAPI.delete_firewallgroup(oldGroup._id);
     * }
     * ```
     * 
     * @warning Ensure no firewall rules reference this group before deletion
     * 
     * @see {@link list_firewallgroups} to get firewall group IDs
     * @see {@link list_firewallrules} to check if group is used in rules
     * @see {@link create_firewallgroup} to create a new firewall group
     * 
     * PHP: delete_firewallgroup($group_id) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/firewallgroup/' . trim($group_id));
     */
    async delete_firewallgroup(group_id: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        if (!group_id || typeof group_id !== 'string') {
            throw new Error('Group ID cannot be empty');
        }

        return await this.makeRequest<boolean>({
            method: 'DELETE',
            url: `/api/s/{site}/rest/firewallgroup/${group_id.trim()}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Edit firewall group
     * 
     * Updates an existing firewall group with new members or settings.
     * 
     * @param group_id - **Required** Firewall group ID to edit
     * @param site_id - **Required** Site ID where the group exists
     * @param group_name - **Required** Updated name for the firewall group
     * @param group_type - **Required** Type of group: 'address-group', 'ipv6-address-group', or 'port-group'
     * @param group_members - Optional array of group members (IP addresses or ports)
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if firewall group update was successful
     * 
     * @throws {Error} When required parameters are invalid
     * @throws {APIError} When firewall group update fails
     * 
     * @example
     * ```typescript
     * // Update firewall group members
     * await securityAPI.edit_firewallgroup(
     *   '507f1f77bcf86cd799439011',
     *   '507f1f77bcf86cd799439012',
     *   'Updated Server Group',
     *   'address-group',
     *   ['192.168.1.10', '192.168.1.11', '192.168.1.20']
     * );
     * 
     * // Add new members to existing group
     * const groups = await securityAPI.list_firewallgroups();
     * const serverGroup = groups.find(g => g.name === 'Web Servers');
     * if (serverGroup) {
     *   const updatedMembers = [...serverGroup.group_members, '192.168.1.30'];
     *   await securityAPI.edit_firewallgroup(
     *     serverGroup._id,
     *     serverGroup.site_id,
     *     serverGroup.name,
     *     serverGroup.group_type,
     *     updatedMembers
     *   );
     * }
     * ```
     * 
     * @see {@link list_firewallgroups} to get group information
     * @see {@link create_firewallgroup} to create new firewall groups
     * @see {@link delete_firewallgroup} to remove firewall groups
     * 
     * PHP: edit_firewallgroup($group_id, $site_id, $group_name, $group_type, $group_members = [])
     */
    async edit_firewallgroup(
        group_id: string,
        site_id: string,
        group_name: string,
        group_type: 'address-group' | 'ipv6-address-group' | 'port-group',
        group_members: string[] = [],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!group_id || typeof group_id !== 'string') {
            throw new Error('Group ID cannot be empty');
        }
        if (!site_id || typeof site_id !== 'string') {
            throw new Error('Site ID cannot be empty');
        }
        if (!group_name || typeof group_name !== 'string') {
            throw new Error('Group name cannot be empty');
        }

        const payload = {
            _id: group_id.trim(),
            site_id: site_id.trim(),
            name: group_name,
            group_type,
            group_members
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/rest/firewallgroup/${group_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // RADIUS AUTHENTICATION
    // ============================================================================

    /**
     * Create RADIUS account
     * 
     * Creates a new RADIUS user account for network authentication.
     * RADIUS accounts are used for enterprise wireless authentication.
     * 
     * @param name - **Required** Username for the RADIUS account
     * @param x_password - **Required** Password for the RADIUS account
     * @param tunnel_type - Optional tunnel type for VLAN assignment
     * @param tunnel_medium_type - Optional tunnel medium type
     * @param vlan - Optional VLAN ID to assign to this user
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to the created RADIUS account object
     * 
     * @throws {Error} When name or password validation fails
     * @throws {APIError} When RADIUS account creation fails
     * 
     * @example
     * ```typescript
     * // Create basic RADIUS account
     * await securityAPI.create_radius_account('john.doe', 'securePassword123');
     * 
     * // Create RADIUS account with VLAN assignment
     * await securityAPI.create_radius_account(
     *   'guest.user',
     *   'guestPass456',
     *   13,  // VLAN tunnel type
     *   6,   // IEEE 802 tunnel medium
     *   100  // VLAN ID
     * );
     * ```
     * 
     * @see {@link list_radius_accounts} to list existing RADIUS accounts
     * @see {@link delete_radius_account} to remove RADIUS accounts
     * @see {@link set_radius_account_base} to update RADIUS account settings
     * 
     * PHP: create_radius_account($name, $x_password, $tunnel_type = null, $tunnel_medium_type = null, $vlan = null)
     */
    async create_radius_account(
        name: string,
        x_password: string,
        tunnel_type?: number,
        tunnel_medium_type?: number,
        vlan?: number,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        if (!name || typeof name !== 'string') {
            throw new Error('RADIUS account name cannot be empty');
        }
        if (!x_password || typeof x_password !== 'string') {
            throw new Error('RADIUS account password cannot be empty');
        }

        const payload: any = {
            name: name.trim(),
            x_password: x_password.trim()
        };

        if (tunnel_type !== undefined) payload.tunnel_type = tunnel_type;
        if (tunnel_medium_type !== undefined) payload.tunnel_medium_type = tunnel_medium_type;
        if (vlan !== undefined) payload.vlan = vlan;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/rest/account',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List RADIUS accounts
     * 
     * Retrieves all RADIUS user accounts configured in the UniFi Controller.
     * 
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of RADIUS account objects
     * 
     * @throws {APIError} When RADIUS accounts retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all RADIUS accounts
     * const accounts = await securityAPI.list_radius_accounts();
     * console.log(`Found ${accounts.length} RADIUS accounts`);
     * 
     * // Find accounts with VLAN assignments
     * const vlanAccounts = accounts.filter(account => account.vlan);
     * 
     * // Find specific account by name
     * const userAccount = accounts.find(account => account.name === 'john.doe');
     * ```
     * 
     * @see {@link create_radius_account} to create new RADIUS accounts
     * @see {@link delete_radius_account} to remove RADIUS accounts
     * @see {@link list_radius_profiles} to list RADIUS server profiles
     * 
     * PHP: list_radius_accounts() -> return $this->fetch_results('/api/s/' . $this->site . '/rest/account');
     */
    async list_radius_accounts(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/rest/account',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List RADIUS profiles
     * 
     * Retrieves all RADIUS server profiles configured in the UniFi Controller.
     * RADIUS profiles define the authentication servers used for enterprise security.
     * 
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of RADIUS profile objects
     * 
     * @throws {APIError} When RADIUS profiles retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all RADIUS profiles
     * const profiles = await securityAPI.list_radius_profiles();
     * console.log(`Found ${profiles.length} RADIUS profiles`);
     * 
     * // Find active profiles
     * const activeProfiles = profiles.filter(profile => profile.enabled);
     * 
     * // Find profiles by authentication type
     * const eapProfiles = profiles.filter(profile => profile.auth_type === 'eap');
     * ```
     * 
     * @see {@link create_radius_profile} to create new RADIUS profiles
     * @see {@link list_radius_accounts} to list RADIUS user accounts
     * 
     * PHP: list_radius_profiles() -> return $this->fetch_results('/api/s/' . $this->site . '/rest/radiusprofile');
     */
    async list_radius_profiles(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/rest/radiusprofile',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Delete RADIUS account
     * 
     * Removes a RADIUS user account from the UniFi Controller.
     * 
     * @param account_id - **Required** RADIUS account ID to delete
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if RADIUS account deletion was successful
     * 
     * @throws {Error} When account_id is invalid
     * @throws {APIError} When RADIUS account deletion fails
     * 
     * @example
     * ```typescript
     * // Delete RADIUS account by ID
     * await securityAPI.delete_radius_account('507f1f77bcf86cd799439011');
     * 
     * // Find and delete RADIUS account by name
     * const accounts = await securityAPI.list_radius_accounts();
     * const oldAccount = accounts.find(account => account.name === 'old.user');
     * if (oldAccount) {
     *   await securityAPI.delete_radius_account(oldAccount._id);
     * }
     * ```
     * 
     * @see {@link list_radius_accounts} to get RADIUS account IDs
     * @see {@link create_radius_account} to create new RADIUS accounts
     * 
     * PHP: delete_radius_account($account_id) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/account/' . trim($account_id));
     */
    async delete_radius_account(account_id: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        if (!account_id || typeof account_id !== 'string') {
            throw new Error('Account ID cannot be empty');
        }

        return await this.makeRequest<boolean>({
            method: 'DELETE',
            url: `/api/s/{site}/rest/account/${account_id.trim()}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Update RADIUS account, base
     * 
     * Updates an existing RADIUS account with new settings.
     * 
     * @param account_id - **Required** RADIUS account ID to update
     * @param payload - **Required** Update payload with new account settings
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if RADIUS account update was successful
     * 
     * @throws {Error} When account_id is invalid
     * @throws {APIError} When RADIUS account update fails
     * 
     * @example
     * ```typescript
     * // Update RADIUS account password
     * await securityAPI.set_radius_account_base('507f1f77bcf86cd799439011', {
     *   x_password: 'newSecurePassword123'
     * });
     * 
     * // Update RADIUS account with VLAN assignment
     * await securityAPI.set_radius_account_base('507f1f77bcf86cd799439011', {
     *   name: 'updated.user',
     *   vlan: 200,
     *   tunnel_type: 13,
     *   tunnel_medium_type: 6
     * });
     * ```
     * 
     * @see {@link list_radius_accounts} to get account information
     * @see {@link create_radius_account} to create new RADIUS accounts
     * @see {@link delete_radius_account} to remove RADIUS accounts
     * 
     * PHP: set_radius_account_base($account_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/account/' . trim($account_id), $payload);
     */
    async set_radius_account_base(
        account_id: string,
        payload: any,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!account_id || typeof account_id !== 'string') {
            throw new Error('Account ID cannot be empty');
        }

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/rest/account/${account_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // IPS/IDS SECURITY SETTINGS
    // ============================================================================

    /**
     * Update IPS/IDS settings, base
     * 
     * Updates Intrusion Prevention System (IPS) and Intrusion Detection System (IDS) settings.
     * These settings control network threat detection and prevention capabilities.
     * 
     * @param payload - **Required** IPS/IDS configuration payload
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if IPS/IDS settings update was successful
     * 
     * @throws {APIError} When IPS/IDS settings update fails
     * 
     * @example
     * ```typescript
     * // Enable IPS with basic settings
     * await securityAPI.set_ips_settings_base({
     *   enabled: true,
     *   mode: 'detection',
     *   suppress_alerts: false
     * });
     * 
     * // Configure IPS with custom rules
     * await securityAPI.set_ips_settings_base({
     *   enabled: true,
     *   mode: 'prevention',
     *   suppress_alerts: true,
     *   categories: ['malware', 'botnet', 'exploit'],
     *   sensitivity: 'medium'
     * });
     * 
     * // Disable IPS/IDS
     * await securityAPI.set_ips_settings_base({
     *   enabled: false
     * });
     * ```
     * 
     * @warning IPS/IDS settings affect network performance and security. Test thoroughly before deployment.
     * 
     * @see {@link list_settings} to view current IPS/IDS settings
     * 
     * PHP: set_ips_settings_base($payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/set/setting/ips', $payload);
     */
    async set_ips_settings_base(payload: any, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: '/api/s/{site}/set/setting/ips',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // ACCESS CONTROL AND MAC FILTERING
    // ============================================================================

    /**
     * Set WLAN MAC filter
     * 
     * Configures MAC address filtering for a wireless network (WLAN).
     * MAC filtering provides an additional layer of access control by allowing or denying
     * specific devices based on their MAC addresses.
     * 
     * @param wlan_id - **Required** WLAN ID to configure MAC filtering for
     * @param mac_filter_policy - **Required** Filter policy: 'allow' (whitelist) or 'deny' (blacklist)
     * @param mac_filter_enabled - **Required** Whether MAC filtering is enabled
     * @param macs - **Required** Array of MAC addresses to filter
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if MAC filter configuration was successful
     * 
     * @throws {Error} When required parameters are invalid
     * @throws {APIError} When MAC filter configuration fails
     * 
     * @example
     * ```typescript
     * // Allow only specific devices (whitelist)
     * await securityAPI.set_wlan_mac_filter(
     *   '507f1f77bcf86cd799439011',
     *   'allow',
     *   true,
     *   ['aa:bb:cc:dd:ee:ff', '11:22:33:44:55:66']
     * );
     * 
     * // Block specific devices (blacklist)
     * await securityAPI.set_wlan_mac_filter(
     *   '507f1f77bcf86cd799439011',
     *   'deny',
     *   true,
     *   ['ff:ee:dd:cc:bb:aa', '66:55:44:33:22:11']
     * );
     * 
     * // Disable MAC filtering
     * await securityAPI.set_wlan_mac_filter(
     *   '507f1f77bcf86cd799439011',
     *   'allow',
     *   false,
     *   []
     * );
     * ```
     * 
     * @warning MAC filtering can be bypassed by MAC address spoofing. Use in combination with other security measures.
     * 
     * @see {@link list_wlanconf} to get WLAN IDs
     * @see {@link create_wlan} to create new WLANs with security settings
     * 
     * PHP: set_wlan_mac_filter($wlan_id, $mac_filter_policy, $mac_filter_enabled, $macs) -> return $this->set_wlansettings_base($wlan_id, $payload);
     */
    async set_wlan_mac_filter(
        wlan_id: string,
        mac_filter_policy: 'allow' | 'deny',
        mac_filter_enabled: boolean,
        macs: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!wlan_id || typeof wlan_id !== 'string') {
            throw new Error('WLAN ID cannot be empty');
        }
        if (!Array.isArray(macs)) {
            throw new Error('MACs must be an array');
        }

        const payload = {
            mac_filter_policy,
            mac_filter_enabled,
            mac_filter_list: macs.map(mac => mac.toLowerCase())
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/rest/wlanconf/${wlan_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // GUEST ACCESS CONTROLS
    // ============================================================================

    /**
     * Update guest login settings
     * 
     * Configures guest portal settings for wireless networks.
     * Controls how guests authenticate and access the network.
     * 
     * @param portal_enabled - **Required** Whether guest portal is enabled
     * @param portal_customized - **Required** Whether to use custom portal design
     * @param redirect_enabled - **Required** Whether to redirect after authentication
     * @param redirect_url - **Required** URL to redirect guests after authentication
     * @param x_password - **Required** Guest portal password (if required)
     * @param expire_number - **Required** Session expiration number
     * @param expire_unit - **Required** Session expiration unit (minutes/hours/days)
     * @param section_id - **Required** Guest access section ID
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if guest login settings update was successful
     * 
     * @throws {Error} When required parameters are invalid
     * @throws {APIError} When guest login settings update fails
     * 
     * @example
     * ```typescript
     * // Configure guest portal with password
     * await securityAPI.set_guestlogin_settings(
     *   true,    // portal enabled
     *   false,   // use default portal design
     *   true,    // redirect after auth
     *   'https://company.com/welcome',
     *   'guest123',  // portal password
     *   4,       // expire after 4
     *   3600,    // hours (3600 seconds = 1 hour)
     *   '507f1f77bcf86cd799439011'
     * );
     * 
     * // Simple guest access without password
     * await securityAPI.set_guestlogin_settings(
     *   true,    // portal enabled
     *   false,   // default design
     *   false,   // no redirect
     *   '',      // no redirect URL
     *   '',      // no password required
     *   24,      // expire after 24
     *   3600,    // hours
     *   '507f1f77bcf86cd799439011'
     * );
     * ```
     * 
     * @see {@link set_guestlogin_settings_base} for advanced guest settings
     * @see {@link authorize_guest} to manually authorize guest devices
     * @see {@link list_guests} to view current guest sessions
     * 
     * PHP: set_guestlogin_settings($portal_enabled, $portal_customized, $redirect_enabled, $redirect_url, $x_password, $expire_number, $expire_unit, $section_id)
     */
    async set_guestlogin_settings(
        portal_enabled: boolean,
        portal_customized: boolean,
        redirect_enabled: boolean,
        redirect_url: string,
        x_password: string,
        expire_number: number,
        expire_unit: number,
        section_id: string,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!section_id || typeof section_id !== 'string') {
            throw new Error('Section ID cannot be empty');
        }

        const payload = {
            portal_enabled,
            portal_customized,
            redirect_enabled,
            redirect_url,
            x_password,
            expire_number,
            expire_unit,
            _id: section_id
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/set/setting/guest_access/${section_id}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Update guest login settings, base
     * 
     * Advanced method for updating guest access settings with custom payload.
     * Provides more flexibility than the standard guest login settings method.
     * 
     * @param payload - **Required** Guest access configuration payload
     * @param section_id - Optional section ID for specific guest access configuration
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if guest login settings update was successful
     * 
     * @throws {APIError} When guest login settings update fails
     * 
     * @example
     * ```typescript
     * // Advanced guest portal configuration
     * await securityAPI.set_guestlogin_settings_base({
     *   portal_enabled: true,
     *   portal_customized: true,
     *   portal_use_hostname: false,
     *   redirect_enabled: true,
     *   redirect_url: 'https://company.com/guest-welcome',
     *   redirect_to_https: true,
     *   auth_cache: true,
     *   expire_enabled: true,
     *   expire_number: 8,
     *   expire_unit: 3600,
     *   template_engine: 'angular'
     * }, '507f1f77bcf86cd799439011');
     * 
     * // Update global guest settings
     * await securityAPI.set_guestlogin_settings_base({
     *   portal_enabled: false,
     *   auth_cache: false
     * });
     * ```
     * 
     * @see {@link set_guestlogin_settings} for standard guest portal configuration
     * @see {@link set_site_guest_access} for site-specific guest access settings
     * 
     * PHP: set_guestlogin_settings_base($payload, $section_id = '') -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/set/setting/guest_access' . $section_id, $payload);
     */
    async set_guestlogin_settings_base(
        payload: any,
        section_id: string = '',
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const section_suffix = section_id ? `/${section_id}` : '';

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/set/setting/guest_access${section_suffix}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Update site guest access settings
     * 
     * Updates guest access settings for a specific site configuration.
     * 
     * @param guest_access_id - **Required** Guest access configuration ID
     * @param payload - **Required** Guest access settings payload
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if site guest access settings update was successful
     * 
     * @throws {Error} When guest_access_id is invalid
     * @throws {APIError} When site guest access settings update fails
     * 
     * @example
     * ```typescript
     * // Update site-specific guest access
     * await securityAPI.set_site_guest_access('507f1f77bcf86cd799439011', {
     *   portal_enabled: true,
     *   portal_customized: false,
     *   auth_cache: true,
     *   expire_number: 24,
     *   expire_unit: 3600
     * });
     * ```
     * 
     * @see {@link set_guestlogin_settings} for standard guest portal configuration
     * @see {@link set_guestlogin_settings_base} for advanced guest settings
     * 
     * PHP: set_site_guest_access($guest_access_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/setting/guest_access/' . trim($guest_access_id), $payload);
     */
    async set_site_guest_access(
        guest_access_id: string,
        payload: any,
        site: string = 'default',
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
        }, site);
    }

    // ============================================================================
    // SNMP SECURITY SETTINGS
    // ============================================================================

    /**
     * Update site SNMP settings
     * 
     * Configures SNMP (Simple Network Management Protocol) settings for network monitoring.
     * SNMP settings control how network devices can be monitored and managed remotely.
     * 
     * @param snmp_id - **Required** SNMP configuration ID
     * @param payload - **Required** SNMP configuration payload
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if SNMP settings update was successful
     * 
     * @throws {Error} When snmp_id is invalid
     * @throws {APIError} When SNMP settings update fails
     * 
     * @example
     * ```typescript
     * // Enable SNMP v2c with community string
     * await securityAPI.set_site_snmp('507f1f77bcf86cd799439011', {
     *   enabled: true,
     *   version: 'v2c',
     *   community: 'public',
     *   contact: 'admin@company.com',
     *   location: 'Server Room A'
     * });
     * 
     * // Configure SNMP v3 with authentication
     * await securityAPI.set_site_snmp('507f1f77bcf86cd799439011', {
     *   enabled: true,
     *   version: 'v3',
     *   username: 'snmpuser',
     *   auth_protocol: 'SHA',
     *   auth_password: 'authPassword123',
     *   priv_protocol: 'AES',
     *   priv_password: 'privPassword456'
     * });
     * 
     * // Disable SNMP
     * await securityAPI.set_site_snmp('507f1f77bcf86cd799439011', {
     *   enabled: false
     * });
     * ```
     * 
     * @warning SNMP v1 and v2c use plain-text community strings. Use SNMP v3 for secure environments.
     * 
     * @see {@link list_settings} to view current SNMP settings
     * 
     * PHP: set_site_snmp($snmp_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/setting/snmp/' . trim($snmp_id), $payload);
     */
    async set_site_snmp(
        snmp_id: string,
        payload: any,
        site: string = 'default',
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
        }, site);
    }
}