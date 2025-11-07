/**
 * Network Management API
 * 
 * Handles network configuration, VLAN management, routing, and DNS operations
 * for UniFi Controller networks. This module provides comprehensive network
 * management functionality including network creation, configuration, and monitoring.
 * 
 * @since 1.0.0
 * @category Network Management
 */

import { HTTPClient } from '../../http/HTTPClient';

export class NetworkManagementAPI {
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
    // NETWORK CONFIGURATION METHODS
    // ============================================================================

    /**
     * Create network
     * 
     * Creates a new network configuration in the UniFi Controller.
     * Networks define IP subnets, VLAN settings, and routing policies.
     * 
     * @group Network Management
     * 
     * @param payload - **Required** Network configuration object
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to the created network configuration
     * 
     * @throws {Error} When payload validation fails
     * @throws {APIError} When network creation fails
     * 
     * @example
     * ```typescript
     * // Create a basic network
     * const network = await client.create_network({
     *   name: 'Guest Network',
     *   purpose: 'guest',
     *   ip_subnet: '192.168.100.1/24',
     *   networkgroup: 'LAN',
     *   vlan_enabled: true,
     *   vlan: 100
     * });
     * 
     * // Create VLAN network with DHCP
     * await client.create_network({
     *   name: 'IoT Network',
     *   purpose: 'vlan-only',
     *   ip_subnet: '10.0.50.1/24',
     *   vlan_enabled: true,
     *   vlan: 50,
     *   dhcpd_enabled: true,
     *   dhcpd_start: '10.0.50.10',
     *   dhcpd_stop: '10.0.50.200'
     * });
     * ```
     * 
     * @see {@link list_networkconf} to list existing networks
     * @see {@link delete_network} to remove a network
     * @see {@link set_networksettings_base} to modify network settings
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: create_network($payload)
     */
    async create_network(payload: any, site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/rest/networkconf',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List network configurations
     * 
     * Retrieves network configurations from the UniFi Controller.
     * Can optionally filter by specific network ID.
     * 
     * @group Network Management
     * 
     * @param network_id - Optional network configuration ID to filter by
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to network configuration(s)
     * 
     * @throws {APIError} When network retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all network configurations
     * const networks = await client.list_networkconf();
     * console.log(`Found ${networks.length} networks`);
     * 
     * // Get specific network by ID
     * const network = await client.list_networkconf('507f1f77bcf86cd799439011');
     * console.log(`Network: ${network.name} (${network.ip_subnet})`);
     * 
     * // Find networks by purpose
     * const allNetworks = await client.list_networkconf();
     * const guestNetworks = allNetworks.filter(net => net.purpose === 'guest');
     * const vlanNetworks = allNetworks.filter(net => net.vlan_enabled);
     * ```
     * 
     * @see {@link create_network} to create a new network
     * @see {@link delete_network} to remove a network
     * @see {@link set_networksettings_base} to modify network settings
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: list_networkconf($network_id = '') -> return $this->fetch_results('/api/s/' . $this->site . '/rest/networkconf/' . trim($network_id));
     */
    async list_networkconf(network_id?: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        const url = network_id
            ? `/api/s/{site}/rest/networkconf/${network_id.trim()}`
            : '/api/s/{site}/rest/networkconf';

        return await this.makeRequest<any>({
            method: 'GET',
            url,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Delete network
     * 
     * Deletes a network configuration from the UniFi Controller.
     * This removes the network and all associated settings permanently.
     * 
     * @group Network Management
     * 
     * @param network_id - **Required** Network configuration ID to delete
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if network deletion was successful
     * 
     * @throws {Error} When network_id is invalid
     * @throws {APIError} When network deletion fails
     * 
     * @example
     * ```typescript
     * // Delete a network by ID
     * await client.delete_network('507f1f77bcf86cd799439011');
     * 
     * // Find and delete a network by name
     * const networks = await client.list_networkconf();
     * const guestNetwork = networks.find(net => net.name === 'Guest Network');
     * if (guestNetwork) {
     *   await client.delete_network(guestNetwork._id);
     * }
     * ```
     * 
     * @warning Deleting a network that is in use may cause connectivity issues
     * 
     * @see {@link list_networkconf} to get network IDs
     * @see {@link create_network} to create a new network
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: delete_network($network_id) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/networkconf/' . trim($network_id));
     */
    async delete_network(network_id: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        return await this.makeRequest<boolean>({
            method: 'DELETE',
            url: `/api/s/{site}/rest/networkconf/${network_id.trim()}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Update network settings, base
     * 
     * Updates network configuration settings for a specific network.
     * This method allows modification of network parameters like DHCP settings,
     * VLAN configuration, and other network properties.
     * 
     * @group Network Management
     * 
     * @param network_id - **Required** Network configuration ID to update
     * @param payload - **Required** Network configuration updates
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if network update was successful
     * 
     * @throws {Error} When network_id is invalid or empty
     * @throws {APIError} When network update fails
     * 
     * @example
     * ```typescript
     * // Update DHCP settings
     * await client.set_networksettings_base('507f1f77bcf86cd799439011', {
     *   dhcpd_enabled: true,
     *   dhcpd_start: '192.168.1.100',
     *   dhcpd_stop: '192.168.1.200',
     *   dhcpd_leasetime: 86400
     * });
     * 
     * // Enable VLAN on existing network
     * await client.set_networksettings_base('507f1f77bcf86cd799439011', {
     *   vlan_enabled: true,
     *   vlan: 50
     * });
     * 
     * // Update network name and purpose
     * await client.set_networksettings_base('507f1f77bcf86cd799439011', {
     *   name: 'Updated Network Name',
     *   purpose: 'corporate'
     * });
     * ```
     * 
     * @see {@link list_networkconf} to get network IDs and current settings
     * @see {@link create_network} to create a new network
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: set_networksettings_base($network_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/networkconf/' . trim($network_id), $payload);
     */
    async set_networksettings_base(
        network_id: string,
        payload: any,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!network_id || typeof network_id !== 'string') {
            throw new Error('Network ID cannot be empty');
        }

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/rest/networkconf/${network_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // ROUTING METHODS
    // ============================================================================

    /**
     * List routing rules
     * 
     * Retrieves routing rules configured in the UniFi Controller.
     * Can optionally filter by specific route ID.
     * 
     * @group Network Management
     * 
     * @param route_id - Optional route ID to filter by
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to routing rule(s)
     * 
     * @throws {APIError} When routing rule retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all routing rules
     * const routes = await client.list_routing();
     * console.log(`Found ${routes.length} routing rules`);
     * 
     * // Get specific route by ID
     * const route = await client.list_routing('507f1f77bcf86cd799439011');
     * console.log(`Route: ${route.name} -> ${route.nexthop}`);
     * 
     * // Find routes by type
     * const allRoutes = await client.list_routing();
     * const staticRoutes = allRoutes.filter(route => route.type === 'static');
     * ```
     * 
     * @see {@link create_routing} to create routing rules (if available)
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: list_routing($route_id = '') -> return $this->fetch_results('/api/s/' . $this->site . '/rest/routing/' . trim($route_id));
     */
    async list_routing(route_id?: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        const url = route_id
            ? `/api/s/{site}/rest/routing/${route_id.trim()}`
            : '/api/s/{site}/rest/routing';

        return await this.makeRequest<any>({
            method: 'GET',
            url,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // PORT CONFIGURATION METHODS
    // ============================================================================

    /**
     * List port configurations
     * 
     * Retrieves port configuration profiles from the UniFi Controller.
     * These profiles define VLAN assignments, PoE settings, and other
     * port-specific configurations for switches.
     * 
     * @group Network Management
     * 
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to port configuration profiles
     * 
     * @throws {APIError} When port configuration retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all port configurations
     * const portConfigs = await client.list_portconf();
     * console.log(`Found ${portConfigs.length} port configurations`);
     * 
     * // Find configurations by name
     * const voipConfig = portConfigs.find(config => config.name === 'VoIP');
     * if (voipConfig) {
     *   console.log(`VoIP VLAN: ${voipConfig.native_networkconf_id}`);
     * }
     * ```
     * 
     * @see {@link create_portconf} to create port configurations (if available)
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: list_portconf() -> return $this->fetch_results('/api/s/' . $this->site . '/list/portconf');
     */
    async list_portconf(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/list/portconf',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List port forwarding statistics
     * 
     * Retrieves statistics for port forwarding rules including
     * traffic counters and connection information.
     * 
     * @group Network Management
     * 
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to port forwarding statistics
     * 
     * @throws {APIError} When port forwarding statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get port forwarding statistics
     * const stats = await client.list_portforward_stats();
     * stats.forEach(stat => {
     *   console.log(`Rule ${stat.name}: ${stat.tx_bytes} bytes transferred`);
     * });
     * ```
     * 
     * @see {@link list_portforwarding} to get port forwarding rules
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: list_portforward_stats() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/portforward_stats');
     */
    async list_portforward_stats(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/stat/portforward_stats',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List port forwarding rules
     * 
     * Retrieves port forwarding rules configured in the UniFi Controller.
     * These rules define how external traffic is forwarded to internal hosts.
     * 
     * @group Network Management
     * 
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to port forwarding rules
     * 
     * @throws {APIError} When port forwarding rules retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all port forwarding rules
     * const rules = await client.list_portforwarding();
     * console.log(`Found ${rules.length} port forwarding rules`);
     * 
     * // Find rules by protocol
     * const httpRules = rules.filter(rule => rule.dst_port === '80');
     * const httpsRules = rules.filter(rule => rule.dst_port === '443');
     * ```
     * 
     * @see {@link create_portforwarding} to create port forwarding rules (if available)
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: list_portforwarding() -> return $this->fetch_results('/api/s/' . $this->site . '/list/portforward');
     */
    async list_portforwarding(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/list/portforward',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // DNS METHODS
    // ============================================================================

    /**
     * Create DNS record
     * 
     * Creates a new DNS record in the UniFi Controller's DNS server.
     * Supports various record types including A, AAAA, MX, TXT, SRV, and NS.
     * 
     * @group Network Management
     * 
     * @param record_type - **Required** DNS record type
     * @param value - **Required** DNS record value
     * @param key - **Required** DNS record key/name
     * @param ttl - Optional time-to-live in seconds
     * @param enabled - Optional whether the record is enabled (default: true)
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to the created DNS record
     * 
     * @throws {Error} When record parameters are invalid
     * @throws {APIError} When DNS record creation fails
     * 
     * @example
     * ```typescript
     * // Create A record
     * await client.create_dns_record('A', '192.168.1.100', 'server.local');
     * 
     * // Create CNAME record with TTL
     * await client.create_dns_record('CNAME', 'server.local', 'www.local', 3600);
     * 
     * // Create MX record
     * await client.create_dns_record('MX', '10 mail.local', 'local');
     * 
     * // Create disabled record
     * await client.create_dns_record('A', '192.168.1.200', 'test.local', 300, false);
     * ```
     * 
     * @see {@link list_dns_records} to list existing DNS records
     * @see {@link delete_dns_record} to remove DNS records
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: create_dns_record($record_type, $value, $key, $ttl = null, $enabled = true)
     */
    async create_dns_record(
        record_type: 'A' | 'AAAA' | 'MX' | 'TXT' | 'SRV' | 'NS',
        value: string,
        key: string,
        ttl?: number,
        enabled: boolean = true,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {
            record_type,
            value,
            key,
            enabled
        };

        if (ttl !== undefined) payload.ttl = ttl;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/rest/dnsrecord',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List DNS records
     * 
     * Retrieves DNS records configured in the UniFi Controller's DNS server.
     * 
     * @group Network Management
     * 
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to DNS records
     * 
     * @throws {APIError} When DNS records retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all DNS records
     * const records = await client.list_dns_records();
     * console.log(`Found ${records.length} DNS records`);
     * 
     * // Find records by type
     * const aRecords = records.filter(record => record.record_type === 'A');
     * const mxRecords = records.filter(record => record.record_type === 'MX');
     * ```
     * 
     * @see {@link create_dns_record} to create DNS records
     * @see {@link delete_dns_record} to remove DNS records
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: list_dns_records() -> return $this->fetch_results('/api/s/' . $this->site . '/rest/dnsrecord');
     */
    async list_dns_records(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/rest/dnsrecord',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Delete DNS record
     * 
     * Deletes a DNS record from the UniFi Controller's DNS server.
     * 
     * @group Network Management
     * 
     * @param record_id - **Required** DNS record ID to delete
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if DNS record deletion was successful
     * 
     * @throws {Error} When record_id is invalid
     * @throws {APIError} When DNS record deletion fails
     * 
     * @example
     * ```typescript
     * // Delete a DNS record by ID
     * await client.delete_dns_record('507f1f77bcf86cd799439011');
     * 
     * // Find and delete a record by name
     * const records = await client.list_dns_records();
     * const testRecord = records.find(record => record.key === 'test.local');
     * if (testRecord) {
     *   await client.delete_dns_record(testRecord._id);
     * }
     * ```
     * 
     * @see {@link list_dns_records} to get DNS record IDs
     * @see {@link create_dns_record} to create DNS records
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: delete_dns_record($record_id)
     */
    async delete_dns_record(record_id: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        return await this.makeRequest<boolean>({
            method: 'DELETE',
            url: `/v2/api/site/{site}/static-dns/${record_id}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // DYNAMIC DNS METHODS
    // ============================================================================

    /**
     * Create dynamic DNS configuration
     * 
     * Creates a new dynamic DNS configuration in the UniFi Controller.
     * Dynamic DNS automatically updates DNS records when IP addresses change.
     * 
     * @group Network Management
     * 
     * @param payload - **Required** Dynamic DNS configuration object
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if dynamic DNS creation was successful
     * 
     * @throws {Error} When payload validation fails
     * @throws {APIError} When dynamic DNS creation fails
     * 
     * @example
     * ```typescript
     * // Create dynamic DNS configuration
     * await client.create_dynamicdns({
     *   service: 'dyndns',
     *   host_name: 'myhost.dyndns.org',
     *   username: 'myusername',
     *   password: 'mypassword',
     *   enabled: true
     * });
     * ```
     * 
     * @see {@link list_dynamicdns} to list dynamic DNS configurations
     * @see {@link set_dynamicdns} to update dynamic DNS configurations
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: create_dynamicdns($payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/dynamicdns', $payload);
     */
    async create_dynamicdns(payload: any, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/rest/dynamicdns',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List dynamic DNS configurations
     * 
     * Retrieves dynamic DNS configurations from the UniFi Controller.
     * 
     * @group Network Management
     * 
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to dynamic DNS configurations
     * 
     * @throws {APIError} When dynamic DNS retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all dynamic DNS configurations
     * const configs = await client.list_dynamicdns();
     * console.log(`Found ${configs.length} dynamic DNS configurations`);
     * 
     * // Find enabled configurations
     * const enabledConfigs = configs.filter(config => config.enabled);
     * ```
     * 
     * @see {@link create_dynamicdns} to create dynamic DNS configurations
     * @see {@link set_dynamicdns} to update dynamic DNS configurations
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: list_dynamicdns() -> return $this->fetch_results('/api/s/' . $this->site . '/rest/dynamicdns');
     */
    async list_dynamicdns(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/rest/dynamicdns',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Update dynamic DNS configuration
     * 
     * Updates an existing dynamic DNS configuration in the UniFi Controller.
     * 
     * @group Network Management
     * 
     * @param dynamicdns_id - **Required** Dynamic DNS configuration ID to update
     * @param payload - **Required** Dynamic DNS configuration updates
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if dynamic DNS update was successful
     * 
     * @throws {Error} When dynamicdns_id is invalid or empty
     * @throws {APIError} When dynamic DNS update fails
     * 
     * @example
     * ```typescript
     * // Update dynamic DNS configuration
     * await client.set_dynamicdns('507f1f77bcf86cd799439011', {
     *   enabled: false,
     *   host_name: 'newhost.dyndns.org'
     * });
     * 
     * // Change credentials
     * await client.set_dynamicdns('507f1f77bcf86cd799439011', {
     *   username: 'newusername',
     *   password: 'newpassword'
     * });
     * ```
     * 
     * @see {@link list_dynamicdns} to get dynamic DNS configuration IDs
     * @see {@link create_dynamicdns} to create dynamic DNS configurations
     * 
     * @since 1.0.0
     * @category Network Management
     * @remarks PHP: set_dynamicdns($dynamicdns_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/dynamicdns/' . trim($dynamicdns_id), $payload);
     */
    async set_dynamicdns(
        dynamicdns_id: string,
        payload: any,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!dynamicdns_id || typeof dynamicdns_id !== 'string') {
            throw new Error('Dynamic DNS ID cannot be empty');
        }

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/rest/dynamicdns/${dynamicdns_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // WLAN MANAGEMENT METHODS
    // ============================================================================

    /**
     * Create a new WLAN (Wireless Network) configuration
     * 
     * @description Creates a new wireless network with specified security settings, user groups,
     * and advanced configuration options. The WLAN will be available on all Access Points unless
     * restricted to specific AP groups.
     * 
     * @param name - **Required** Name of the WLAN (SSID)
     * @param x_passphrase - **Required** Network password/passphrase (ignored for open networks)
     * @param usergroup_id - **Required** ID of the user group to assign clients to
     * @param wlangroup_id - **Required** ID of the WLAN group for AP assignment
     * @param enabled - Optional whether the WLAN is enabled (default: true)
     * @param hide_ssid - Optional whether to hide the SSID (default: false)
     * @param is_guest - Optional whether this is a guest network (default: false)
     * @param security - Optional security type: 'open', 'wpapsk', 'wpaeap' (default: 'open')
     * @param wpa_mode - Optional WPA mode: 'wpa', 'wpa2', 'wpa3' (default: 'wpa2')
     * @param wpa_enc - Optional WPA encryption: 'auto', 'ccmp', 'tkip' (default: 'ccmp')
     * @param vlan_enabled - Optional whether VLAN is enabled
     * @param vlan_id - Optional VLAN network ID
     * @param uapsd_enabled - Optional whether U-APSD is enabled (default: false)
     * @param schedule_enabled - Optional whether scheduling is enabled (default: false)
     * @param schedule - Optional schedule configuration array (default: [])
     * @param ap_group_ids - Optional array of AP group IDs to restrict WLAN to
     * @param additional_payload - Optional additional configuration parameters
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal for request cancellation
     * 
     * @returns Promise resolving to true if WLAN creation was successful
     * 
     * @throws {Error} When required parameters are missing or invalid
     * @throws {APIError} When WLAN creation fails or name already exists
     * 
     * @example
     * ```typescript
     * // Basic open network
     * await networkAPI.create_wlan('Public WiFi', '', 'default', 'default');
     * 
     * // Secure WPA2 network
     * await networkAPI.create_wlan(
     *   'Corporate WiFi',
     *   'strongpassword123',
     *   'corporate_group',
     *   'default',
     *   true,  // enabled
     *   false, // visible SSID
     *   false, // not guest
     *   'wpapsk',
     *   'wpa2',
     *   'ccmp'
     * );
     * 
     * // Guest network with VLAN
     * await networkAPI.create_wlan(
     *   'Guest Network',
     *   'guestpass',
     *   'guest_group',
     *   'guest_wlan_group',
     *   true,  // enabled
     *   false, // visible
     *   true,  // is guest
     *   'wpapsk',
     *   'wpa2',
     *   'ccmp',
     *   true,  // VLAN enabled
     *   'guest_vlan_id'
     * );
     * ```
     * 
     * @see {@link list_wlanconf} to view existing WLANs
     * @see {@link delete_wlan} to remove WLANs
     * @see {@link disable_wlan} to temporarily disable WLANs
     * 
     * @since 1.0.0
     * @category WLAN Management
     * @remarks PHP: create_wlan($name, $x_passphrase, $usergroup_id, $wlangroup_id, $enabled = true, $hide_ssid = false, $is_guest = false, $security = 'open', $wpa_mode = 'wpa2', $wpa_enc = 'ccmp', $vlan_enabled = null, $vlan_id = null, $uapsd_enabled = false, $schedule_enabled = false, $schedule = [], $ap_group_ids = null, $payload = [])
     */
    async create_wlan(
        name: string,
        x_passphrase: string,
        usergroup_id: string,
        wlangroup_id: string,
        enabled: boolean = true,
        hide_ssid: boolean = false,
        is_guest: boolean = false,
        security: string = 'open',
        wpa_mode: string = 'wpa2',
        wpa_enc: string = 'ccmp',
        vlan_enabled?: boolean,
        vlan_id?: string,
        uapsd_enabled: boolean = false,
        schedule_enabled: boolean = false,
        schedule: any[] = [],
        ap_group_ids?: string[],
        additional_payload: any = {},
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const payload = {
            ...additional_payload,
            name: name.trim(),
            usergroup_id: usergroup_id.trim(),
            wlangroup_id: wlangroup_id.trim(),
            enabled,
            hide_ssid,
            is_guest,
            security: security.trim(),
            wpa_mode: wpa_mode.trim(),
            wpa_enc: wpa_enc.trim(),
            uapsd_enabled,
            schedule_enabled,
            schedule,
            ...(vlan_id && { networkconf_id: vlan_id }),
            ...(x_passphrase && security !== 'open' && { x_passphrase: x_passphrase.trim() }),
            ...(ap_group_ids && { ap_group_ids })
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/add/wlanconf',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Delete WLAN
     * 
     * Permanently deletes a WLAN configuration from the UniFi Controller.
     * This removes the wireless network and all associated settings.
     * 
     * @group WLAN Management
     * 
     * @param wlan_id - **Required** WLAN configuration ID to delete
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if WLAN deletion was successful
     * 
     * @throws {Error} When wlan_id is invalid
     * @throws {APIError} When WLAN deletion fails
     * 
     * @example
     * ```typescript
     * // Delete a WLAN by ID
     * await networkAPI.delete_wlan('507f1f77bcf86cd799439011');
     * 
     * // Find and delete WLAN by name
     * const wlans = await networkAPI.list_wlanconf();
     * const guestWlan = wlans.find(wlan => wlan.name === 'Guest Network');
     * if (guestWlan) {
     *   await networkAPI.delete_wlan(guestWlan._id);
     * }
     * ```
     * 
     * @warning Deleting a WLAN will disconnect all clients using that network
     * 
     * @see {@link list_wlanconf} to get WLAN IDs
     * @see {@link create_wlan} to create a new WLAN
     * @see {@link disable_wlan} to temporarily disable instead of deleting
     * 
     * PHP: delete_wlan($wlan_id) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/wlanconf/' . trim($wlan_id));
     */
    async delete_wlan(wlan_id: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        return await this.makeRequest<boolean>({
            method: 'DELETE',
            url: `/api/s/{site}/rest/wlanconf/${wlan_id.trim()}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Disable WLAN
     * 
     * Temporarily disables or enables a WLAN without deleting the configuration.
     * This allows you to quickly turn wireless networks on/off as needed.
     * 
     * @group WLAN Management
     * 
     * @param wlan_id - **Required** WLAN configuration ID to disable/enable
     * @param disable - **Required** Whether to disable (true) or enable (false) the WLAN
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if WLAN disable/enable was successful
     * 
     * @throws {Error} When wlan_id is invalid
     * @throws {APIError} When WLAN disable/enable fails
     * 
     * @example
     * ```typescript
     * // Disable a WLAN
     * await networkAPI.disable_wlan('507f1f77bcf86cd799439011', true);
     * 
     * // Enable a WLAN
     * await networkAPI.disable_wlan('507f1f77bcf86cd799439011', false);
     * 
     * // Find and disable guest network during maintenance
     * const wlans = await networkAPI.list_wlanconf();
     * const guestWlan = wlans.find(wlan => wlan.name === 'Guest Network');
     * if (guestWlan) {
     *   await networkAPI.disable_wlan(guestWlan._id, true);
     * }
     * ```
     * 
     * @see {@link list_wlanconf} to get WLAN IDs and current status
     * @see {@link delete_wlan} to permanently remove a WLAN
     * 
     * PHP: disable_wlan($wlan_id, $disable) -> return $this->set_wlansettings_base($wlan_id, $payload);
     */
    async disable_wlan(wlan_id: string, disable: boolean, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        const action = !disable;
        const payload = {
            enabled: action
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/rest/wlanconf/${wlan_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List WLAN groups
     * 
     * Retrieves a list of WLAN groups configured in the UniFi Controller.
     * WLAN groups allow you to organize and manage wireless networks across different Access Points.
     * 
     * @group WLAN Management
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to an array of WLAN group objects
     * 
     * @throws {APIError} When WLAN group listing fails
     * 
     * @example
     * ```typescript
     * // Get all WLAN groups
     * const wlanGroups = await networkAPI.list_wlan_groups();
     * console.log(`Found ${wlanGroups.length} WLAN groups`);
     * 
     * // Find a specific WLAN group
     * const defaultGroup = wlanGroups.find(group => group.name === 'Default');
     * ```
     * 
     * @see {@link create_wlan} to create WLANs with specific groups
     * @see {@link list_wlanconf} to see WLAN configurations
     * 
     * PHP: list_wlan_groups() -> return $this->fetch_results('/api/s/' . $this->site . '/list/wlangroup');
     */
    async list_wlan_groups(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/list/wlangroup',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List WLAN configuration
     * 
     * Retrieves a list of all WLAN (wireless network) configurations from the UniFi Controller.
     * This includes SSIDs, security settings, user groups, and other wireless network parameters.
     * 
     * @group WLAN Management
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to an array of WLAN configuration objects
     * 
     * @throws {APIError} When WLAN configuration listing fails
     * 
     * @example
     * ```typescript
     * // Get all WLAN configurations
     * const wlans = await networkAPI.list_wlanconf();
     * console.log(`Found ${wlans.length} wireless networks`);
     * 
     * // Filter enabled WLANs only
     * const enabledWlans = wlans.filter(wlan => wlan.enabled);
     * 
     * // Find guest networks
     * const guestWlans = wlans.filter(wlan => wlan.is_guest);
     * ```
     * 
     * @see {@link create_wlan} to create new WLANs
     * @see {@link delete_wlan} to remove WLANs
     * @see {@link disable_wlan} to enable/disable WLANs
     * 
     * PHP: list_wlanconf() -> return $this->fetch_results('/api/s/' . $this->site . '/list/wlanconf');
     */
    async list_wlanconf(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/list/wlanconf',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Set WLAN settings
     * 
     * Updates WLAN configuration settings with the provided payload.
     * This is a high-level method that delegates to set_wlansettings_base.
     * 
     * @group WLAN Management
     * 
     * @param wlan_id - **Required** WLAN configuration ID to update
     * @param payload - **Required** Configuration settings to update
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if WLAN settings update was successful
     * 
     * @throws {Error} When wlan_id or payload is invalid
     * @throws {APIError} When WLAN settings update fails
     * 
     * @example
     * ```typescript
     * // Update WLAN security settings
     * await networkAPI.set_wlansettings('507f1f77bcf86cd799439011', {
     *   security: 'wpapsk',
     *   wpa_mode: 'wpa2',
     *   x_passphrase: 'newpassword123'
     * });
     * 
     * // Enable/disable WLAN
     * await networkAPI.set_wlansettings('507f1f77bcf86cd799439011', {
     *   enabled: false
     * });
     * ```
     * 
     * @see {@link set_wlansettings_base} for the underlying implementation
     * @see {@link list_wlanconf} to get WLAN IDs
     * 
     * PHP: set_wlansettings($wlan_id, $payload) -> return $this->set_wlansettings_base($wlan_id, $payload);
     */
    async set_wlansettings(wlan_id: string, payload: any, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        return await this.set_wlansettings_base(wlan_id, payload, site, options);
    }

    /**
     * Set WLAN settings base
     * 
     * Low-level method to update WLAN configuration settings directly.
     * This method provides direct access to the UniFi Controller's WLAN configuration API.
     * 
     * @group WLAN Management
     * 
     * @param wlan_id - **Required** WLAN configuration ID to update
     * @param payload - **Required** Configuration settings to update
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if WLAN settings update was successful
     * 
     * @throws {Error} When wlan_id or payload is invalid
     * @throws {APIError} When WLAN settings update fails
     * 
     * @example
     * ```typescript
     * // Update multiple WLAN settings
     * await networkAPI.set_wlansettings_base('507f1f77bcf86cd799439011', {
     *   name: 'Updated Network Name',
     *   enabled: true,
     *   hide_ssid: false,
     *   security: 'wpapsk',
     *   wpa_mode: 'wpa2',
     *   wpa_enc: 'ccmp',
     *   x_passphrase: 'newsecurepassword'
     * });
     * ```
     * 
     * @see {@link set_wlansettings} for the high-level wrapper
     * @see {@link list_wlanconf} to get current WLAN configurations
     * 
     * PHP: set_wlansettings_base($wlan_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/wlanconf/' . trim($wlan_id), $payload);
     */
    async set_wlansettings_base(wlan_id: string, payload: any, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/rest/wlanconf/${wlan_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // WIRELESS ANALYSIS AND MONITORING METHODS
    // ============================================================================

    /**
     * List country codes
     * 
     * Retrieves a list of supported country codes for wireless regulatory compliance.
     * Country codes determine allowed wireless channels and power levels.
     * 
     * @group Network Analysis
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to an array of country code objects
     * 
     * @throws {APIError} When country code listing fails
     * 
     * @example
     * ```typescript
     * // Get all supported country codes
     * const countryCodes = await networkAPI.list_country_codes();
     * console.log(`Supported countries: ${countryCodes.length}`);
     * 
     * // Find specific country
     * const usCode = countryCodes.find(country => country.code === 'US');
     * ```
     * 
     * @see {@link list_current_channels} to see current channel usage
     * 
     * PHP: list_country_codes() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/ccode');
     */
    async list_country_codes(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/stat/ccode',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List current channels
     * 
     * Retrieves information about currently used wireless channels across all Access Points.
     * This helps with channel planning and interference analysis.
     * 
     * @group Network Analysis
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to an array of current channel usage objects
     * 
     * @throws {APIError} When current channel listing fails
     * 
     * @example
     * ```typescript
     * // Get current channel usage
     * const channels = await networkAPI.list_current_channels();
     * console.log(`Active channels: ${channels.length}`);
     * 
     * // Find 5GHz channels
     * const fiveGhzChannels = channels.filter(ch => ch.radio === 'na');
     * ```
     * 
     * @see {@link spectrum_scan} to perform spectrum analysis
     * @see {@link list_country_codes} to see allowed channels by country
     * 
     * PHP: list_current_channels() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/current-channel');
     */
    async list_current_channels(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/stat/current-channel',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Spectrum scan
     * 
     * Initiates a spectrum scan on a specific Access Point to analyze wireless interference
     * and channel utilization. This helps optimize wireless performance.
     * 
     * @group Network Analysis
     * 
     * @param mac - **Required** MAC address of the Access Point to perform spectrum scan
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if spectrum scan was initiated successfully
     * 
     * @throws {Error} When MAC address is invalid
     * @throws {APIError} When spectrum scan initiation fails
     * 
     * @example
     * ```typescript
     * // Start spectrum scan on specific AP
     * await networkAPI.spectrum_scan('aa:bb:cc:dd:ee:ff');
     * 
     * // Check scan results after completion
     * setTimeout(async () => {
     *   const results = await networkAPI.spectrum_scan_state('aa:bb:cc:dd:ee:ff');
     *   console.log('Scan results:', results);
     * }, 30000); // Wait 30 seconds for scan to complete
     * ```
     * 
     * @see {@link spectrum_scan_state} to check scan results
     * @see {@link list_current_channels} to see current channel usage
     * 
     * PHP: spectrum_scan($mac) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr', $payload);
     */
    async spectrum_scan(mac: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            cmd: 'spectrum-scan',
            mac: mac.toLowerCase()
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Spectrum scan state
     * 
     * Retrieves the results of a spectrum scan performed on a specific Access Point.
     * This provides detailed information about wireless interference and channel utilization.
     * 
     * @group Network Analysis
     * 
     * @param mac - **Required** MAC address of the Access Point to get spectrum scan results
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to spectrum scan results
     * 
     * @throws {Error} When MAC address is invalid
     * @throws {APIError} When spectrum scan state retrieval fails
     * 
     * @example
     * ```typescript
     * // Get spectrum scan results
     * const scanResults = await networkAPI.spectrum_scan_state('aa:bb:cc:dd:ee:ff');
     * 
     * // Analyze interference levels
     * if (scanResults.spectrum_table) {
     *   const highInterference = scanResults.spectrum_table.filter(
     *     entry => entry.utilization > 50
     *   );
     *   console.log(`High interference channels: ${highInterference.length}`);
     * }
     * ```
     * 
     * @see {@link spectrum_scan} to initiate spectrum scans
     * @see {@link list_current_channels} to see current channel assignments
     * 
     * PHP: spectrum_scan_state($mac) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/spectrum-scan/' . strtolower(trim($mac)));
     */
    async spectrum_scan_state(mac: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: `/api/s/{site}/stat/spectrum-scan/${mac.toLowerCase()}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // DEVICE MANAGEMENT METHODS
    // ============================================================================

    /**
     * Move device
     * 
     * Moves a UniFi device from the current site to another site.
     * This is useful for reorganizing devices across different site configurations.
     * 
     * @group Device Management
     * 
     * @param mac - **Required** MAC address of the device to move
     * @param site_id - **Required** Target site ID to move the device to
     * @param site - Current site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if device move was successful
     * 
     * @throws {Error} When MAC address or site_id is invalid
     * @throws {APIError} When device move fails
     * 
     * @example
     * ```typescript
     * // Move device to different site
     * await networkAPI.move_device('aa:bb:cc:dd:ee:ff', 'branch-office');
     * 
     * // Move multiple devices (call multiple times)
     * const devicesToMove = ['aa:bb:cc:dd:ee:ff', 'ff:ee:dd:cc:bb:aa'];
     * for (const mac of devicesToMove) {
     *   await networkAPI.move_device(mac, 'new-site');
     * }
     * ```
     * 
     * @warning Moving a device will cause it to be reconfigured for the target site
     * 
     * @see {@link list_devices} to get device information
     * @see {@link list_sites} to get available site IDs
     * 
     * PHP: move_device($mac, $site_id) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/sitemgr', $payload);
     */
    async move_device(mac: string, site_id: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            cmd: 'move-device',
            mac: mac.toLowerCase(),
            site: site_id
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/sitemgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }
}