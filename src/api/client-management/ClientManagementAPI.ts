/**
 * Client Management API
 * 
 * This module provides methods for managing UniFi client devices, including
 * listing clients, blocking/unblocking devices, guest authorization, and
 * client configuration management.
 * 
 * @since 1.0.0
 * @category Client Management
 */

import { HTTPClient } from '../../http/HTTPClient';
import { UniFiClient } from '../../types';

export class ClientManagementAPI {
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
    // CLIENT LISTING AND INFORMATION METHODS
    // ============================================================================

    /**
     * List all client devices (users/stations) connected to the UniFi network
     * 
     * @description Retrieves a list of all client devices that have connected to the UniFi network.
     * This includes both currently connected and previously connected devices.
     * 
     * @param site - Site identifier (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal for request cancellation
     * 
     * @returns Promise resolving to an array of UniFi client objects
     * 
     * @example
     * ```typescript
     * // Get all clients
     * const clients = await clientAPI.list_users();
     * console.log(`Found ${clients.length} clients`);
     * 
     * // With request cancellation
     * const controller = new AbortController();
     * const clients = await clientAPI.list_users('default', { signal: controller.signal });
     * ```
     * 
     * @see {@link list_active_clients} for only currently connected clients
     * @see {@link list_clients_history} for historical client data
     * 
     * @since 1.0.0
     * @category Client Management
     * @remarks PHP: list_users() -> return $this->fetch_results('/api/s/' . $this->site . '/list/user');
     */
    async list_users(site: string = 'default', options?: { signal?: AbortSignal }): Promise<UniFiClient[]> {
        return await this.makeRequest<UniFiClient[]>({
            method: 'GET',
            url: '/api/s/{site}/list/user',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List active client devices
     * PHP: list_active_clients($include_traffic_usage = true, $include_unifi_devices = true)
     */
    async list_active_clients(
        site: string = 'default',
        include_traffic_usage: boolean = true,
        include_unifi_devices: boolean = true,
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const query_params = new URLSearchParams({
            include_traffic_usage: include_traffic_usage.toString(),
            include_unifi_devices: include_unifi_devices.toString()
        });

        return await this.makeRequest<any>({
            method: 'GET',
            url: `/v2/api/site/{site}/clients/active?${query_params.toString()}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List client devices
     * PHP: list_clients($mac = '') -> return $this->fetch_results('/api/s/' . $this->site . '/stat/sta', $payload);
     */
    async list_clients(site: string = 'default', mac?: string, options?: { signal?: AbortSignal }): Promise<any> {
        if (mac) {
            const payload = {
                macs: [mac.toLowerCase()]
            };
            return await this.makeRequest<any>({
                method: 'POST',
                url: '/api/s/{site}/stat/sta',
                data: payload,
                ...(options?.signal && { signal: options.signal }),
            }, site);
        } else {
            return await this.makeRequest<any>({
                method: 'GET',
                url: '/api/s/{site}/stat/sta',
                ...(options?.signal && { signal: options.signal }),
            }, site);
        }
    }

    /**
     * List client history
     * PHP: list_clients_history($historyhours = 8760, $start = null, $end = null, $mac = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/sta', $payload);
     */
    async list_clients_history(
        site: string = 'default',
        historyhours: number = 8760,
        start?: number,
        end?: number,
        mac?: string,
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const current_time = Date.now();
        const end_time = end || current_time;
        const start_time = start || (end_time - (historyhours * 3600 * 1000));

        const payload: any = {
            type: 'all',
            start: start_time,
            end: end_time
        };

        if (mac) {
            payload.mac = mac.toLowerCase();
        }

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/sta',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch details for a single client device
     * PHP: stat_client($mac) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/user/' . strtolower(trim($mac)));
     */
    async stat_client(site: string = 'default', mac: string, options?: { signal?: AbortSignal }): Promise<any> {
        if (!mac || typeof mac !== 'string') {
            throw new Error('MAC address is required');
        }

        // Basic MAC address validation
        const mac_trimmed = mac.trim();
        if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac_trimmed)) {
            throw new Error(`Invalid MAC address format: ${mac_trimmed}`);
        }

        return await this.makeRequest<any>({
            method: 'GET',
            url: `/api/s/{site}/stat/user/${mac_trimmed.toLowerCase()}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // CLIENT CONTROL METHODS
    // ============================================================================

    /**
     * Block a client device
     * 
     * Blocks network access for a specific client device by MAC address.
     * The device will be unable to connect to the network until unblocked.
     * 
     * @group Client Management
     * 
     * @param site - Site identifier (defaults to 'default')
     * @param mac - **Required** MAC address of the client device to block
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if blocking was successful
     * 
     * @throws {Error} When MAC address validation fails
     * @throws {APIError} When client blocking fails
     * 
     * @example
     * ```typescript
     * // Block a client device
     * await clientAPI.block_sta('default', 'aa:bb:cc:dd:ee:ff');
     * 
     * // Block with cancellation support
     * const controller = new AbortController();
     * await clientAPI.block_sta('default', 'aa:bb:cc:dd:ee:ff', { signal: controller.signal });
     * ```
     * 
     * @see {@link unblock_sta} to unblock a client device
     * @see {@link list_users} to get client device information
     * 
     * PHP: block_sta($mac) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/stamgr', $payload);
     */
    async block_sta(site: string = 'default', mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            cmd: 'block-sta',
            mac: mac.toLowerCase()
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/stamgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Unblock a station
     * PHP: unblock_sta($mac) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/stamgr', $payload);
     */
    async unblock_sta(
        site: string = 'default',
        mac: string,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!mac) {
            throw new Error('MAC address is required');
        }

        const payload = {
            cmd: 'unblock-sta',
            mac: mac.toLowerCase()
        };

        const response = await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/cmd/stamgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
        return response !== null && response !== false;
    }

    /**
     * Reconnect client device (kick and reconnect)
     * PHP: reconnect_sta($mac) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/stamgr', $payload);
     */
    async reconnect_sta(site: string = 'default', mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
        if (!mac || typeof mac !== 'string') {
            throw new Error('MAC address cannot be empty');
        }
        // Basic MAC address validation (simplified)
        if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac)) {
            throw new Error(`Invalid MAC address format: ${mac}`);
        }

        const payload = {
            cmd: 'kick-sta',
            mac: mac.toLowerCase()
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/stamgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Forget client device
     * PHP: forget_sta($mac) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/stamgr', $payload);
     */
    async forget_sta(site: string = 'default', macs: string | string[], options?: { signal?: AbortSignal }): Promise<boolean> {
        const mac_array = Array.isArray(macs) ? macs : [macs];

        if (mac_array.length === 0) {
            throw new Error('MAC address array cannot be empty');
        }

        // Validate MAC addresses
        for (const mac of mac_array) {
            if (!mac || typeof mac !== 'string') {
                throw new Error('MAC address cannot be empty');
            }
            // Basic MAC address validation (simplified)
            if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac)) {
                throw new Error(`Invalid MAC address format: ${mac}`);
            }
        }

        const payload = {
            cmd: 'forget-sta',
            macs: mac_array.map(mac => mac.toLowerCase())
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/stamgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // CLIENT CONFIGURATION METHODS
    // ============================================================================

    /**
     * Edit client fixed IP
     * PHP: edit_client_fixedip($client_id, $use_fixedip, $network_id = null, $fixed_ip = null)
     */
    async edit_client_fixedip(
        site: string = 'default',
        client_id: string,
        use_fixedip: boolean,
        network_id?: string,
        fixed_ip?: string,
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {
            use_fixedip
        };

        if (use_fixedip) {
            if (!network_id) {
                throw new Error('network_id is required when use_fixedip is true');
            }
            payload.network_id = network_id;

            if (fixed_ip) {
                payload.fixed_ip = fixed_ip;
            }
        }

        return await this.makeRequest<any>({
            method: 'PUT',
            url: `/api/s/{site}/rest/user/${client_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Edit client name
     * PHP: edit_client_name($client_id, $name)
     */
    async edit_client_name(site: string = 'default', client_id: string, name: string, options?: { signal?: AbortSignal }): Promise<any> {
        if (!name.trim()) {
            throw new Error('Name cannot be empty');
        }

        const payload = {
            name: name.trim()
        };

        return await this.makeRequest<any>({
            method: 'PUT',
            url: `/api/s/{site}/rest/user/${client_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Set client device name
     * PHP: set_sta_name($user_id, $name = '') -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/upd/user/' . trim($user_id), $payload);
     */
    async set_sta_name(
        site: string = 'default',
        user_id: string,
        name: string = '',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!user_id || typeof user_id !== 'string') {
            throw new Error('User ID cannot be empty');
        }

        const payload = {
            name: name.trim()
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/upd/user/${user_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Set client device note
     * PHP: set_sta_note($user_id, $note = '') -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/upd/user/' . trim($user_id), $payload);
     */
    async set_sta_note(
        site: string = 'default',
        user_id: string,
        note: string = '',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!user_id || typeof user_id !== 'string') {
            throw new Error('User ID cannot be empty');
        }

        const payload = {
            note: note.trim()
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/upd/user/${user_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // GUEST MANAGEMENT METHODS
    // ============================================================================

    /**
     * Authorize a guest client device for network access
     * 
     * @description Grants network access to a guest device for a specified duration with optional
     * bandwidth and data limits. The device will be automatically unauthorized after the time expires.
     * 
     * @param site - Site identifier (defaults to 'default')
     * @param mac - **Required** MAC address of the guest device to authorize
     * @param minutes - **Required** Duration in minutes for which the guest access is valid
     * @param up - Optional upload bandwidth limit in Kbps (e.g., 5000 = 5 Mbps)
     * @param down - Optional download bandwidth limit in Kbps (e.g., 10000 = 10 Mbps)
     * @param megabytes - Optional data usage limit in megabytes
     * @param ap_mac - Optional MAC address of specific Access Point to restrict access to
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal for request cancellation
     * 
     * @returns Promise resolving to true if authorization was successful
     * 
     * @throws {Error} When MAC address format is invalid
     * @throws {APIError} When device is already authorized or authorization fails
     * 
     * @example
     * ```typescript
     * // Basic guest authorization for 60 minutes
     * await clientAPI.authorize_guest('default', 'aa:bb:cc:dd:ee:ff', 60);
     * 
     * // With bandwidth limits (5 Mbps up, 10 Mbps down)
     * await clientAPI.authorize_guest('default', 'aa:bb:cc:dd:ee:ff', 120, 5000, 10000);
     * 
     * // With data limit (1 GB)
     * await clientAPI.authorize_guest('default', 'aa:bb:cc:dd:ee:ff', 180, undefined, undefined, 1024);
     * 
     * // Restrict to specific Access Point
     * await clientAPI.authorize_guest(
     *   'default',
     *   'aa:bb:cc:dd:ee:ff', 
     *   240, 
     *   2000, 
     *   5000, 
     *   512, 
     *   '11:22:33:44:55:66'
     * );
     * ```
     * 
     * @see {@link unauthorize_guest} to revoke guest access
     * @see {@link extend_guest_validity} to extend guest session
     * @see {@link list_guests} to view current guest sessions
     * 
     * @since 1.0.0
     * @category Guest Management
     * @remarks PHP: authorize_guest($mac, $minutes, $up = null, $down = null, $megabytes = null, $ap_mac = null)
     */
    async authorize_guest(
        site: string = 'default',
        mac: string,
        minutes: number,
        up?: number,
        down?: number,
        megabytes?: number,
        ap_mac?: string,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const payload: any = {
            cmd: 'authorize-guest',
            mac: mac.toLowerCase(),
            minutes
        };

        if (up !== undefined) payload.up = up;
        if (down !== undefined) payload.down = down;
        if (megabytes !== undefined) payload.bytes = megabytes;
        if (ap_mac) payload.ap_mac = ap_mac.toLowerCase();

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/stamgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Unauthorize a guest
     * PHP: unauthorize_guest($mac) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/stamgr', $payload);
     */
    async unauthorize_guest(
        site: string = 'default',
        mac: string,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!mac) {
            throw new Error('MAC address is required');
        }

        const payload = {
            cmd: 'unauthorize-guest',
            mac: mac.toLowerCase()
        };

        const response = await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/cmd/stamgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
        return response !== null && response !== false;
    }

    /**
     * Extend guest validity
     * PHP: extend_guest_validity($guest_id) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/hotspot', $payload);
     */
    async extend_guest_validity(site: string = 'default', guest_id: string, options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            _id: guest_id,
            cmd: 'extend'
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/hotspot',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List guest devices
     * PHP: list_guests($within = 8760) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/guest', $payload);
     */
    async list_guests(site: string = 'default', within: number = 8760, options?: { signal?: AbortSignal }): Promise<any> {
        const payload = {
            within
        };

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/guest',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // SESSION AND STATISTICS METHODS
    // ============================================================================

    /**
     * Fetch sessions
     * PHP: stat_sessions($start = null, $end = null, $mac = null, $type = 'all') -> return $this->fetch_results('/api/s/' . $this->site . '/stat/session', $payload);
     */
    async stat_sessions(
        site: string = 'default',
        start?: number,
        end?: number,
        mac?: string,
        type: 'all' | 'guest' | 'user' = 'all',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        if (!['all', 'guest', 'user'].includes(type)) {
            throw new Error('Invalid type parameter. Must be one of: all, guest, user');
        }

        const end_time = end || Math.floor(Date.now() / 1000);
        const start_time = start || (end_time - (7 * 24 * 3600)); // 7 days ago

        const payload: any = {
            type,
            start: start_time,
            end: end_time
        };

        if (mac) {
            payload.mac = mac.toLowerCase();
        }

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/session',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch latest sessions for a station
     * PHP: stat_sta_sessions_latest($mac, $limit = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/session', $payload);
     */
    async stat_sta_sessions_latest(
        site: string = 'default',
        mac: string,
        limit?: number,
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const session_limit = limit || 5;

        const payload = {
            mac: mac.toLowerCase(),
            _limit: session_limit,
            _sort: '-assoc_time'
        };

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/session',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // TAG MANAGEMENT METHODS
    // ============================================================================

    /**
     * Create tag
     * 
     * Creates a new tag for organizing and managing client devices.
     * Tags can be used to group devices for easier management and policy application.
     * 
     * @group Tag Management
     * 
     * @param name - **Required** Name for the new tag
     * @param macs - Optional array of MAC addresses to initially assign to this tag
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if tag creation was successful
     * 
     * @throws {Error} When name is invalid
     * @throws {APIError} When tag creation fails
     * 
     * @example
     * ```typescript
     * // Create empty tag
     * await clientAPI.create_tag('VIP Devices');
     * 
     * // Create tag with initial devices
     * await clientAPI.create_tag('Conference Room', [
     *   'aa:bb:cc:dd:ee:ff',
     *   'ff:ee:dd:cc:bb:aa'
     * ]);
     * ```
     * 
     * @see {@link list_tags} to view existing tags
     * @see {@link set_tagged_devices} to modify tag membership
     * @see {@link delete_tag} to remove tags
     * 
     * PHP: create_tag($name, $macs = null)
     */
    async create_tag(name: string, macs?: string[], site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload: any = {
            name
        };

        if (macs && Array.isArray(macs)) {
            payload.member_table = macs.map(mac => mac.toLowerCase());
        }

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/rest/tag',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Delete tag
     * 
     * Permanently deletes a tag from the UniFi Controller.
     * This removes the tag and all device associations.
     * 
     * @group Tag Management
     * 
     * @param tag_id - **Required** Tag ID to delete
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if tag deletion was successful
     * 
     * @throws {Error} When tag_id is invalid
     * @throws {APIError} When tag deletion fails
     * 
     * @example
     * ```typescript
     * // Delete tag by ID
     * await clientAPI.delete_tag('507f1f77bcf86cd799439011');
     * 
     * // Find and delete tag by name
     * const tags = await clientAPI.list_tags();
     * const oldTag = tags.find(tag => tag.name === 'Old Devices');
     * if (oldTag) {
     *   await clientAPI.delete_tag(oldTag._id);
     * }
     * ```
     * 
     * @warning This operation removes all device associations with the tag
     * 
     * @see {@link list_tags} to get tag IDs
     * @see {@link create_tag} to create new tags
     * 
     * PHP: delete_tag($tag_id) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/tag/' . $tag_id);
     */
    async delete_tag(tag_id: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        return await this.makeRequest<boolean>({
            method: 'DELETE',
            url: `/api/s/{site}/rest/tag/${tag_id}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Get tag
     * 
     * Retrieves detailed information about a specific tag including its member devices.
     * 
     * @group Tag Management
     * 
     * @param tag_id - **Required** Tag ID to retrieve
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to tag information object
     * 
     * @throws {Error} When tag_id is invalid
     * @throws {APIError} When tag retrieval fails
     * 
     * @example
     * ```typescript
     * // Get specific tag details
     * const tag = await clientAPI.get_tag('507f1f77bcf86cd799439011');
     * console.log(`Tag "${tag.name}" has ${tag.member_table?.length || 0} devices`);
     * 
     * // Check if device is in tag
     * const deviceMac = 'aa:bb:cc:dd:ee:ff';
     * const isTagged = tag.member_table?.includes(deviceMac.toLowerCase());
     * ```
     * 
     * @see {@link list_tags} to get all tags
     * @see {@link set_tagged_devices} to modify tag membership
     * 
     * PHP: get_tag($tag_id) -> return $this->fetch_results('/api/s/' . $this->site . '/rest/tag/' . $tag_id);
     */
    async get_tag(tag_id: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: `/api/s/{site}/rest/tag/${tag_id}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List tags
     * 
     * Retrieves a list of all tags configured in the UniFi Controller.
     * Tags are used for organizing and managing client devices.
     * 
     * @group Tag Management
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to an array of tag objects
     * 
     * @throws {APIError} When tag listing fails
     * 
     * @example
     * ```typescript
     * // Get all tags
     * const tags = await clientAPI.list_tags();
     * console.log(`Found ${tags.length} tags`);
     * 
     * // Find tags with devices
     * const activeTags = tags.filter(tag => 
     *   tag.member_table && tag.member_table.length > 0
     * );
     * 
     * // Get tag names
     * const tagNames = tags.map(tag => tag.name);
     * ```
     * 
     * @see {@link create_tag} to create new tags
     * @see {@link get_tag} to get detailed tag information
     * @see {@link delete_tag} to remove tags
     * 
     * PHP: list_tags() -> return $this->fetch_results('/api/s/' . $this->site . '/list/tag');
     */
    async list_tags(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/list/tag',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Set tagged devices
     * 
     * Updates the list of devices associated with a specific tag.
     * This replaces the current device list with the provided MAC addresses.
     * 
     * @group Tag Management
     * 
     * @param tag_id - **Required** Tag ID to update
     * @param device_macs - **Required** Array of MAC addresses to assign to this tag
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if tag device assignment was successful
     * 
     * @throws {Error} When tag_id or device_macs is invalid
     * @throws {APIError} When tag device assignment fails
     * 
     * @example
     * ```typescript
     * // Assign devices to tag
     * await clientAPI.set_tagged_devices('507f1f77bcf86cd799439011', [
     *   'aa:bb:cc:dd:ee:ff',
     *   'ff:ee:dd:cc:bb:aa',
     *   '11:22:33:44:55:66'
     * ]);
     * 
     * // Clear all devices from tag
     * await clientAPI.set_tagged_devices('507f1f77bcf86cd799439011', []);
     * 
     * // Add single device to tag (replacing all others)
     * await clientAPI.set_tagged_devices('507f1f77bcf86cd799439011', [
     *   'aa:bb:cc:dd:ee:ff'
     * ]);
     * ```
     * 
     * @warning This replaces the entire device list - existing devices not in the array will be removed
     * 
     * @see {@link get_tag} to see current device assignments
     * @see {@link list_tags} to get tag IDs
     * 
     * PHP: set_tagged_devices($tag_id, $device_macs) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/tag/' . $tag_id, $payload);
     */
    async set_tagged_devices(tag_id: string, device_macs: string[], site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            member_table: device_macs.map(mac => mac.toLowerCase())
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/rest/tag/${tag_id}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // VOUCHER MANAGEMENT METHODS
    // ============================================================================

    /**
     * Create voucher
     * 
     * Creates guest access vouchers with specified duration, bandwidth limits, and usage quotas.
     * Vouchers provide temporary network access without requiring device registration.
     * 
     * @group Voucher Management
     * 
     * @param minutes - **Required** Voucher validity duration in minutes
     * @param count - Number of vouchers to create (default: 1)
     * @param quota - Usage quota per voucher (0 = unlimited) (default: 0)
     * @param note - Optional note/description for the vouchers (default: '')
     * @param up - Optional upload bandwidth limit in Kbps
     * @param down - Optional download bandwidth limit in Kbps
     * @param megabytes - Optional data usage limit in megabytes
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to voucher creation result
     * 
     * @throws {Error} When parameters are invalid
     * @throws {APIError} When voucher creation fails
     * 
     * @example
     * ```typescript
     * // Create single voucher for 60 minutes
     * const voucher = await clientAPI.create_voucher(60);
     * 
     * // Create 10 vouchers with bandwidth limits (5 Mbps down, 2 Mbps up)
     * await clientAPI.create_voucher(
     *   120,    // 2 hours
     *   10,     // 10 vouchers
     *   0,      // unlimited usage
     *   'Conference guests',
     *   2000,   // 2 Mbps up
     *   5000    // 5 Mbps down
     * );
     * 
     * // Create voucher with data limit (500 MB)
     * await clientAPI.create_voucher(
     *   180,    // 3 hours
     *   1,      // 1 voucher
     *   0,      // unlimited usage
     *   'Limited data access',
     *   undefined, // no upload limit
     *   undefined, // no download limit
     *   500     // 500 MB data limit
     * );
     * ```
     * 
     * @see {@link revoke_voucher} to revoke vouchers
     * @see {@link list_guests} to see active voucher sessions
     * 
     * PHP: create_voucher($minutes, $count = 1, $quota = 0, $note = '', $up = null, $down = null, $megabytes = null)
     */
    async create_voucher(
        minutes: number,
        count: number = 1,
        quota: number = 0,
        note: string = '',
        up?: number,
        down?: number,
        megabytes?: number,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {
            cmd: 'create-voucher',
            expire: minutes,
            n: count,
            quota
        };

        if (note.trim()) {
            payload.note = note.trim();
        }

        if (up !== undefined) {
            payload.up = up;
        }

        if (down !== undefined) {
            payload.down = down;
        }

        if (megabytes !== undefined) {
            payload.bytes = megabytes;
        }

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/cmd/hotspot',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Revoke voucher
     * 
     * Revokes (deletes) a specific voucher, making it invalid for future use.
     * This does not affect currently active sessions using the voucher.
     * 
     * @group Voucher Management
     * 
     * @param voucher_id - **Required** Voucher ID to revoke
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if voucher revocation was successful
     * 
     * @throws {Error} When voucher_id is invalid
     * @throws {APIError} When voucher revocation fails
     * 
     * @example
     * ```typescript
     * // Revoke specific voucher
     * await clientAPI.revoke_voucher('507f1f77bcf86cd799439011');
     * 
     * // Find and revoke vouchers by note
     * const vouchers = await clientAPI.stat_voucher();
     * const conferenceVouchers = vouchers.filter(v => 
     *   v.note && v.note.includes('Conference')
     * );
     * for (const voucher of conferenceVouchers) {
     *   await clientAPI.revoke_voucher(voucher._id);
     * }
     * ```
     * 
     * @warning This permanently deletes the voucher - it cannot be recovered
     * 
     * @see {@link create_voucher} to create new vouchers
     * @see {@link stat_voucher} to list existing vouchers
     * 
     * PHP: revoke_voucher($voucher_id) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/hotspot', $payload);
     */
    async revoke_voucher(voucher_id: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            cmd: 'delete-voucher',
            _id: voucher_id
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/hotspot',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // HOTSPOT OPERATOR MANAGEMENT METHODS
    // ============================================================================

    /**
     * Create hotspot operator
     * 
     * Creates a new hotspot operator account for managing guest access.
     * Hotspot operators can create and manage vouchers for guest network access.
     * 
     * @group Hotspot Management
     * 
     * @param name - **Required** Username for the hotspot operator
     * @param x_password - **Required** Password for the hotspot operator
     * @param note - Optional note/description for the operator (default: '')
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if hotspot operator creation was successful
     * 
     * @throws {Error} When name or password is invalid
     * @throws {APIError} When hotspot operator creation fails
     * 
     * @example
     * ```typescript
     * // Create basic hotspot operator
     * await clientAPI.create_hotspotop('reception', 'securepassword123');
     * 
     * // Create hotspot operator with note
     * await clientAPI.create_hotspotop(
     *   'conference_desk',
     *   'conf2024!',
     *   'Conference registration desk operator'
     * );
     * ```
     * 
     * @see {@link list_hotspotop} to view existing operators
     * @see {@link create_voucher} for voucher creation by operators
     * 
     * PHP: create_hotspotop($name, $x_password, $note = '')
     */
    async create_hotspotop(
        name: string,
        x_password: string,
        note: string = '',
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const payload: any = {
            name,
            x_password
        };

        if (note.trim()) {
            payload.note = note.trim();
        }

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/rest/hotspotop',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List hotspot operators
     * 
     * Retrieves a list of all hotspot operators configured in the UniFi Controller.
     * Hotspot operators can manage guest access and create vouchers.
     * 
     * @group Hotspot Management
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to an array of hotspot operator objects
     * 
     * @throws {APIError} When hotspot operator listing fails
     * 
     * @example
     * ```typescript
     * // Get all hotspot operators
     * const operators = await clientAPI.list_hotspotop();
     * console.log(`Found ${operators.length} hotspot operators`);
     * 
     * // Find specific operator
     * const receptionOp = operators.find(op => op.name === 'reception');
     * if (receptionOp) {
     *   console.log(`Reception operator note: ${receptionOp.note}`);
     * }
     * ```
     * 
     * @see {@link create_hotspotop} to create new operators
     * 
     * PHP: list_hotspotop() -> return $this->fetch_results('/api/s/' . $this->site . '/list/hotspotop');
     */
    async list_hotspotop(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/list/hotspotop',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }
}