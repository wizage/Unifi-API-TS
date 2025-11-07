/**
 * Statistics API module for UniFi Controller
 * 
 * This module contains all statistics and monitoring related API methods including:
 * - System information and health metrics
 * - Controller and firmware update checks
 * - Event and alarm monitoring
 * - Time-based statistics (5-minute, hourly, daily, monthly)
 * - User and device statistics
 * - IPS/IDS event monitoring
 * - Speed test results
 * - Session and payment statistics
 * 
 * @since 1.0.0
 * @category Statistics & Monitoring
 */

import { HTTPClient } from '../../http/HTTPClient';
import { SystemInfo } from '../../types';

export class StatisticsAPI {
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
    // SYSTEM INFORMATION AND HEALTH
    // ============================================================================

    /**
     * Get system information and statistics from the UniFi Controller
     * 
     * @description Retrieves comprehensive system information including controller version,
     * uptime, memory usage, CPU information, and other system statistics.
     * 
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal for request cancellation
     * 
     * @returns Promise resolving to an array of system information objects
     * 
     * @example
     * ```typescript
     * const sysInfo = await statisticsAPI.stat_sysinfo();
     * console.log(`Controller version: ${sysInfo[0].version}`);
     * console.log(`Uptime: ${sysInfo[0].uptime} seconds`);
     * console.log(`Memory: ${sysInfo[0].mem_total} MB total`);
     * ```
     * 
     * @see {@link stat_status} for basic status information
     * @see {@link stat_full_status} for comprehensive status
     * 
     * @since 1.0.0
     * @category Statistics & Monitoring
     * @remarks PHP: stat_sysinfo() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/sysinfo');
     */
    async stat_sysinfo(site: string = 'default', options?: { signal?: AbortSignal }): Promise<SystemInfo[]> {
        return await this.makeRequest<SystemInfo[]>({
            method: 'GET',
            url: '/api/s/{site}/stat/sysinfo',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List health metrics
     * 
     * Retrieves health metrics for the UniFi site including subsystem status,
     * connectivity information, and overall site health indicators.
     * 
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of health metric objects
     * 
     * @throws {APIError} When health metrics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get site health metrics
     * const health = await statisticsAPI.list_health();
     * console.log(`Site health status: ${health[0].status}`);
     * 
     * // Check specific subsystems
     * const wanHealth = health.find(h => h.subsystem === 'wan');
     * const lanHealth = health.find(h => h.subsystem === 'lan');
     * const wlanHealth = health.find(h => h.subsystem === 'wlan');
     * 
     * // Monitor connectivity
     * const connectivity = health.filter(h => h.subsystem === 'connectivity');
     * ```
     * 
     * @see {@link stat_sysinfo} for detailed system information
     * @see {@link list_events} for event-based monitoring
     * 
     * PHP: list_health() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/health');
     */
    async list_health(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/stat/health',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch full status information
     * 
     * Retrieves comprehensive status information from the UniFi Controller.
     * This includes detailed system status, configuration, and operational data.
     * 
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to full status object
     * 
     * @throws {APIError} When full status retrieval fails
     * 
     * @example
     * ```typescript
     * // Get comprehensive status
     * const status = await statisticsAPI.stat_full_status();
     * console.log('Full system status:', status);
     * 
     * // Check specific status components
     * if (status.meta && status.meta.rc === 'ok') {
     *   console.log('System is operating normally');
     * }
     * ```
     * 
     * @see {@link stat_sysinfo} for system information
     * @see {@link stat_status} for basic status
     * 
     * PHP: stat_full_status() -> $this->fetch_results_boolean('/status', null, $this->is_unifi_os); return json_decode($this->get_last_results_raw());
     */
    async stat_full_status(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        // This endpoint works differently - it returns raw status data
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/status',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }    
// ============================================================================
    // UPDATE AND FIRMWARE CHECKS
    // ============================================================================

    /**
     * Check for controller updates
     * 
     * Checks for available UniFi Controller software updates.
     * Returns information about the latest available controller version.
     * 
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to controller update information
     * 
     * @throws {APIError} When update check fails
     * 
     * @example
     * ```typescript
     * // Check for controller updates
     * const updateInfo = await statisticsAPI.check_controller_update();
     * if (updateInfo.latest_version !== updateInfo.current_version) {
     *   console.log(`Update available: ${updateInfo.latest_version}`);
     * }
     * ```
     * 
     * @see {@link stat_sysinfo} to get current controller version
     * @see {@link check_firmware_update} to check for device firmware updates
     * 
     * PHP: check_controller_update() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/fwupdate/latest-version');
     */
    async check_controller_update(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/stat/fwupdate/latest-version',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Check for firmware updates
     * 
     * Initiates a check for available firmware updates for all UniFi devices
     * in the site. This triggers the controller to query for new firmware versions.
     * 
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if firmware update check was initiated successfully
     * 
     * @throws {APIError} When firmware update check fails
     * 
     * @example
     * ```typescript
     * // Check for firmware updates
     * await statisticsAPI.check_firmware_update();
     * 
     * // Then list devices to see available updates
     * const devices = await deviceAPI.list_devices();
     * const devicesWithUpdates = devices.filter(device => device.upgradable);
     * ```
     * 
     * @see {@link list_devices} to see which devices have available updates
     * @see {@link check_controller_update} to check for controller updates
     * 
     * PHP: check_firmware_update() -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr', $payload);
     */
    async check_firmware_update(site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            cmd: 'check-firmware-update'
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // EVENTS AND ALARMS
    // ============================================================================

    /**
     * List events
     * 
     * Retrieves system events from the UniFi Controller with optional time filtering.
     * Events include device connections, disconnections, configuration changes, and system alerts.
     * 
     * @param historyhours - Number of hours of history to retrieve (default: 720 = 30 days)
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param limit - Maximum number of events to return (default: 3000)
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of event objects
     * 
     * @throws {APIError} When events retrieval fails
     * 
     * @example
     * ```typescript
     * // Get last 24 hours of events
     * const events = await statisticsAPI.list_events(24);
     * 
     * // Get events for specific time range
     * const start = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
     * const end = Date.now();
     * const weekEvents = await statisticsAPI.list_events(undefined, start, end);
     * 
     * // Get recent events with limit
     * const recentEvents = await statisticsAPI.list_events(1, undefined, undefined, 100);
     * 
     * // Filter events by type
     * const allEvents = await statisticsAPI.list_events(24);
     * const deviceEvents = allEvents.filter(event => event.key === 'EVT_AP_Connected');
     * const userEvents = allEvents.filter(event => event.key === 'EVT_LU_Connected');
     * ```
     * 
     * @see {@link list_alarms} for alarm-specific events
     * @see {@link stat_ips_events} for security-related events
     * 
     * PHP: list_events($historyhours = 720, $start = null, $end = null, $limit = 3000) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/event', $payload);
     */
    async list_events(
        historyhours: number = 720,
        start?: number,
        end?: number,
        limit: number = 3000,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {
            _limit: limit,
            within: historyhours
        };

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/event',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List alarms
     * 
     * Retrieves system alarms from the UniFi Controller.
     * Alarms represent significant events that require attention.
     * 
     * @param payload - Optional filter payload for alarm retrieval
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of alarm objects
     * 
     * @throws {APIError} When alarms retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all alarms
     * const alarms = await statisticsAPI.list_alarms();
     * console.log(`Found ${alarms.length} alarms`);
     * 
     * // Get alarms with specific filter
     * const criticalAlarms = await statisticsAPI.list_alarms({
     *   archived: false,
     *   severity: 'critical'
     * });
     * 
     * // Filter alarms by type
     * const allAlarms = await statisticsAPI.list_alarms();
     * const deviceAlarms = allAlarms.filter(alarm => alarm.key.includes('device'));
     * const networkAlarms = allAlarms.filter(alarm => alarm.key.includes('network'));
     * ```
     * 
     * @see {@link list_events} for general system events
     * @see {@link count_alarms} to get alarm counts
     * 
     * PHP: list_alarms($payload = []) -> return $this->fetch_results('/api/s/' . $this->site . '/list/alarm', $payload);
     */
    async list_alarms(payload: any = {}, site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        if (Object.keys(payload).length > 0) {
            return await this.makeRequest<any>({
                method: 'POST',
                url: '/api/s/{site}/list/alarm',
                data: payload,
                ...(options?.signal && { signal: options.signal }),
            }, site);
        } else {
            return await this.makeRequest<any>({
                method: 'GET',
                url: '/api/s/{site}/list/alarm',
                ...(options?.signal && { signal: options.signal }),
            }, site);
        }
    }

    /**
     * Count alarms
     * 
     * Retrieves the count of alarms, optionally filtered by archived status.
     * 
     * @param archived - Optional filter for archived alarms (undefined = all, false = active only)
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to alarm count information
     * 
     * @throws {APIError} When alarm count retrieval fails
     * 
     * @example
     * ```typescript
     * // Get total alarm count
     * const totalCount = await statisticsAPI.count_alarms();
     * 
     * // Get active alarms count only
     * const activeCount = await statisticsAPI.count_alarms(false);
     * 
     * console.log(`Active alarms: ${activeCount.count}`);
     * ```
     * 
     * @see {@link list_alarms} to get detailed alarm information
     * 
     * PHP: count_alarms($archived = null) -> return $this->fetch_results('/api/s/' . $this->site . '/cnt/alarm' . $path_suffix);
     */
    async count_alarms(archived?: boolean, site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        const path_suffix = archived === false ? '?archived=false' : '';

        return await this.makeRequest<any>({
            method: 'GET',
            url: `/api/s/{site}/cnt/alarm${path_suffix}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // 5-MINUTE STATISTICS
    // ============================================================================

    /**
     * Fetch 5-minute site statistics
     * 
     * Retrieves 5-minute interval statistics for the entire site.
     * Provides detailed metrics about network usage, performance, and activity.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of 5-minute site statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get last 12 hours of 5-minute stats
     * const stats = await statisticsAPI.stat_5minutes_site();
     * 
     * // Get stats for specific time range
     * const start = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
     * const end = Date.now();
     * const stats = await statisticsAPI.stat_5minutes_site(start, end);
     * 
     * // Get specific attributes only
     * const stats = await statisticsAPI.stat_5minutes_site(
     *   undefined, 
     *   undefined, 
     *   ['bytes', 'num_sta', 'time']
     * );
     * ```
     * 
     * @see {@link stat_hourly_site} for hourly statistics
     * @see {@link stat_daily_site} for daily statistics
     * @see {@link stat_5minutes_aps} for AP-specific 5-minute stats
     * 
     * PHP: stat_5minutes_site($start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/5minutes.site', $payload);
     */
    async stat_5minutes_site(
        start?: number,
        end?: number,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/5minutes.site',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch 5-minute access point statistics
     * 
     * Retrieves 5-minute interval statistics for access points.
     * Can get stats for all APs or filter by specific MAC address.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param mac - Optional AP MAC address to filter results
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of 5-minute AP statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get 5-minute stats for all APs
     * const allApStats = await statisticsAPI.stat_5minutes_aps();
     * 
     * // Get stats for specific AP
     * const apStats = await statisticsAPI.stat_5minutes_aps(
     *   undefined, undefined, 'aa:bb:cc:dd:ee:ff'
     * );
     * 
     * // Get specific metrics for time range
     * const start = Date.now() - (6 * 60 * 60 * 1000); // 6 hours ago
     * const stats = await statisticsAPI.stat_5minutes_aps(
     *   start, Date.now(), undefined, ['bytes', 'num_sta']
     * );
     * ```
     * 
     * @see {@link stat_5minutes_site} for site-wide statistics
     * @see {@link stat_daily_aps} for daily AP statistics
     * 
     * PHP: stat_5minutes_aps($start = null, $end = null, $mac = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/5minutes.ap', $payload);
     */
    async stat_5minutes_aps(
        start?: number,
        end?: number,
        mac?: string,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (mac) payload.mac = mac.toLowerCase();
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/5minutes.ap',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch 5-minute gateway statistics
     * 
     * Retrieves 5-minute interval statistics for the gateway/router.
     * Provides metrics about WAN/LAN traffic, routing, and gateway performance.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of 5-minute gateway statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get recent gateway stats
     * const gwStats = await statisticsAPI.stat_5minutes_gateway();
     * 
     * // Get gateway stats for specific time range
     * const start = Date.now() - (12 * 60 * 60 * 1000); // 12 hours ago
     * const stats = await statisticsAPI.stat_5minutes_gateway(start, Date.now());
     * 
     * // Get specific gateway metrics
     * const stats = await statisticsAPI.stat_5minutes_gateway(
     *   undefined, undefined, ['wan-tx_bytes', 'wan-rx_bytes', 'lan-tx_bytes']
     * );
     * ```
     * 
     * @see {@link stat_5minutes_site} for site-wide statistics
     * @see {@link stat_daily_gateway} for daily gateway statistics
     * 
     * PHP: stat_5minutes_gateway($start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/5minutes.gw', $payload);
     */
    async stat_5minutes_gateway(
        start?: number,
        end?: number,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/5minutes.gw',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch 5-minute user statistics
     * 
     * Retrieves 5-minute interval statistics for users/clients.
     * Can get stats for all users or filter by specific MAC address.
     * 
     * @param mac - Optional client MAC address to filter results
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of 5-minute user statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get 5-minute stats for all users
     * const allUserStats = await statisticsAPI.stat_5minutes_user();
     * 
     * // Get stats for specific user
     * const userStats = await statisticsAPI.stat_5minutes_user('aa:bb:cc:dd:ee:ff');
     * 
     * // Get user stats for time range with specific metrics
     * const start = Date.now() - (4 * 60 * 60 * 1000); // 4 hours ago
     * const stats = await statisticsAPI.stat_5minutes_user(
     *   'aa:bb:cc:dd:ee:ff', start, Date.now(), ['tx_bytes', 'rx_bytes']
     * );
     * ```
     * 
     * @see {@link stat_5minutes_site} for site-wide statistics
     * @see {@link stat_daily_user} for daily user statistics
     * 
     * PHP: stat_5minutes_user($mac = null, $start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/5minutes.user', $payload);
     */
    async stat_5minutes_user(
        mac?: string,
        start?: number,
        end?: number,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (mac) payload.mac = mac.toLowerCase();
        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/5minutes.user',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // HOURLY STATISTICS
    // ============================================================================

    /**
     * Fetch hourly stats for a single access point or all access points
     * 
     * Retrieves hourly statistics for access points with optional filtering by MAC address.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param mac - Optional AP MAC address to filter results
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of hourly AP statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get hourly stats for all APs
     * const allApStats = await statisticsAPI.stat_hourly_aps();
     * 
     * // Get stats for specific AP over last week
     * const start = Date.now() - (7 * 24 * 60 * 60 * 1000);
     * const apStats = await statisticsAPI.stat_hourly_aps(
     *   start, Date.now(), 'aa:bb:cc:dd:ee:ff'
     * );
     * ```
     * 
     * @see {@link stat_5minutes_aps} for 5-minute AP statistics
     * @see {@link stat_daily_aps} for daily AP statistics
     * 
     * PHP: stat_hourly_aps($start = null, $end = null, $mac = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/hourly.ap', $payload);
     */
    async stat_hourly_aps(
        start?: number,
        end?: number,
        mac?: string,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (mac) payload.mac = mac.toLowerCase();
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/hourly.ap',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch hourly gateway stats
     * 
     * Retrieves hourly statistics for the gateway/router.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of hourly gateway statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get hourly gateway stats
     * const gwStats = await statisticsAPI.stat_hourly_gateway();
     * 
     * // Get gateway stats for specific time range
     * const start = Date.now() - (48 * 60 * 60 * 1000); // 48 hours ago
     * const stats = await statisticsAPI.stat_hourly_gateway(start, Date.now());
     * ```
     * 
     * @see {@link stat_5minutes_gateway} for 5-minute gateway statistics
     * @see {@link stat_daily_gateway} for daily gateway statistics
     * 
     * PHP: stat_hourly_gateway($start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/hourly.gw', $payload);
     */
    async stat_hourly_gateway(
        start?: number,
        end?: number,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/hourly.gw',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch hourly site stats
     * 
     * Retrieves hourly statistics for the entire site.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of hourly site statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get hourly site stats
     * const siteStats = await statisticsAPI.stat_hourly_site();
     * 
     * // Get site stats for last 3 days
     * const start = Date.now() - (3 * 24 * 60 * 60 * 1000);
     * const stats = await statisticsAPI.stat_hourly_site(start, Date.now());
     * ```
     * 
     * @see {@link stat_5minutes_site} for 5-minute site statistics
     * @see {@link stat_daily_site} for daily site statistics
     * 
     * PHP: stat_hourly_site($start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/hourly.site', $payload);
     */
    async stat_hourly_site(
        start?: number,
        end?: number,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/hourly.site',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch hourly user stats
     * 
     * Retrieves hourly statistics for users/clients.
     * 
     * @param mac - Optional client MAC address to filter results
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of hourly user statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get hourly stats for all users
     * const allUserStats = await statisticsAPI.stat_hourly_user();
     * 
     * // Get stats for specific user over last 2 days
     * const start = Date.now() - (2 * 24 * 60 * 60 * 1000);
     * const userStats = await statisticsAPI.stat_hourly_user(
     *   'aa:bb:cc:dd:ee:ff', start, Date.now()
     * );
     * ```
     * 
     * @see {@link stat_5minutes_user} for 5-minute user statistics
     * @see {@link stat_daily_user} for daily user statistics
     * 
     * PHP: stat_hourly_user($mac = null, $start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/hourly.user', $payload);
     */
    async stat_hourly_user(
        mac?: string,
        start?: number,
        end?: number,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (mac) payload.mac = mac.toLowerCase();
        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/hourly.user',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // DAILY STATISTICS
    // ============================================================================

    /**
     * Fetch daily stats for a single access point or all access points
     * 
     * Retrieves daily statistics for access points with optional filtering by MAC address.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param mac - Optional AP MAC address to filter results
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of daily AP statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get daily stats for all APs
     * const allApStats = await statisticsAPI.stat_daily_aps();
     * 
     * // Get stats for specific AP over last month
     * const start = Date.now() - (30 * 24 * 60 * 60 * 1000);
     * const apStats = await statisticsAPI.stat_daily_aps(
     *   start, Date.now(), 'aa:bb:cc:dd:ee:ff'
     * );
     * ```
     * 
     * @see {@link stat_hourly_aps} for hourly AP statistics
     * @see {@link stat_monthly_aps} for monthly AP statistics
     * 
     * PHP: stat_daily_aps($start = null, $end = null, $mac = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/daily.ap', $payload);
     */
    async stat_daily_aps(
        start?: number,
        end?: number,
        mac?: string,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (mac) payload.mac = mac.toLowerCase();
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/daily.ap',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch daily gateway stats
     * 
     * Retrieves daily statistics for the gateway/router.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of daily gateway statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get daily gateway stats
     * const gwStats = await statisticsAPI.stat_daily_gateway();
     * 
     * // Get gateway stats for last 2 weeks
     * const start = Date.now() - (14 * 24 * 60 * 60 * 1000);
     * const stats = await statisticsAPI.stat_daily_gateway(start, Date.now());
     * ```
     * 
     * @see {@link stat_hourly_gateway} for hourly gateway statistics
     * @see {@link stat_monthly_gateway} for monthly gateway statistics
     * 
     * PHP: stat_daily_gateway($start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/daily.gw', $payload);
     */
    async stat_daily_gateway(
        start?: number,
        end?: number,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/daily.gw',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch daily site stats
     * 
     * Retrieves daily statistics for the entire site.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of daily site statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get daily site stats
     * const siteStats = await statisticsAPI.stat_daily_site();
     * 
     * // Get site stats for last month
     * const start = Date.now() - (30 * 24 * 60 * 60 * 1000);
     * const stats = await statisticsAPI.stat_daily_site(start, Date.now());
     * ```
     * 
     * @see {@link stat_hourly_site} for hourly site statistics
     * @see {@link stat_monthly_site} for monthly site statistics
     * 
     * PHP: stat_daily_site($start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/daily.site', $payload);
     */
    async stat_daily_site(
        start?: number,
        end?: number,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/daily.site',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch daily stats for a single user/client device or all user/client devices
     * 
     * Retrieves daily statistics for users/clients with optional filtering by MAC address.
     * 
     * @param mac - Optional client MAC address to filter results
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of daily user statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get daily stats for all users
     * const allUserStats = await statisticsAPI.stat_daily_user();
     * 
     * // Get stats for specific user over last month
     * const start = Date.now() - (30 * 24 * 60 * 60 * 1000);
     * const userStats = await statisticsAPI.stat_daily_user(
     *   'aa:bb:cc:dd:ee:ff', start, Date.now()
     * );
     * ```
     * 
     * @see {@link stat_hourly_user} for hourly user statistics
     * @see {@link stat_monthly_user} for monthly user statistics
     * 
     * PHP: stat_daily_user($mac = null, $start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/daily.user', $payload);
     */
    async stat_daily_user(
        mac?: string,
        start?: number,
        end?: number,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (mac) payload.mac = mac.toLowerCase();
        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/daily.user',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }   
 // ============================================================================
    // MONTHLY STATISTICS
    // ============================================================================

    /**
     * Fetch monthly stats for a single access point or all access points
     * 
     * Retrieves monthly statistics for access points with optional filtering by MAC address.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param mac - Optional AP MAC address to filter results
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of monthly AP statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get monthly stats for all APs
     * const allApStats = await statisticsAPI.stat_monthly_aps();
     * 
     * // Get stats for specific AP over last year
     * const start = Date.now() - (365 * 24 * 60 * 60 * 1000);
     * const apStats = await statisticsAPI.stat_monthly_aps(
     *   start, Date.now(), 'aa:bb:cc:dd:ee:ff'
     * );
     * ```
     * 
     * @see {@link stat_daily_aps} for daily AP statistics
     * @see {@link stat_5minutes_aps} for 5-minute AP statistics
     * 
     * PHP: stat_monthly_aps($start = null, $end = null, $mac = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/monthly.ap', $payload);
     */
    async stat_monthly_aps(
        start?: number,
        end?: number,
        mac?: string,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (mac) payload.mac = mac.toLowerCase();
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/monthly.ap',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch monthly gateway stats
     * 
     * Retrieves monthly statistics for the gateway/router.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of monthly gateway statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get monthly gateway stats
     * const gwStats = await statisticsAPI.stat_monthly_gateway();
     * 
     * // Get gateway stats for last 6 months
     * const start = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
     * const stats = await statisticsAPI.stat_monthly_gateway(start, Date.now());
     * ```
     * 
     * @see {@link stat_daily_gateway} for daily gateway statistics
     * @see {@link stat_hourly_gateway} for hourly gateway statistics
     * 
     * PHP: stat_monthly_gateway($start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/monthly.gw', $payload);
     */
    async stat_monthly_gateway(
        start?: number,
        end?: number,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/monthly.gw',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch monthly site stats
     * 
     * Retrieves monthly statistics for the entire site.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of monthly site statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get monthly site stats
     * const siteStats = await statisticsAPI.stat_monthly_site();
     * 
     * // Get site stats for last year
     * const start = Date.now() - (365 * 24 * 60 * 60 * 1000);
     * const stats = await statisticsAPI.stat_monthly_site(start, Date.now());
     * ```
     * 
     * @see {@link stat_daily_site} for daily site statistics
     * @see {@link stat_hourly_site} for hourly site statistics
     * 
     * PHP: stat_monthly_site($start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/monthly.site', $payload);
     */
    async stat_monthly_site(
        start?: number,
        end?: number,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/monthly.site',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch monthly user stats
     * 
     * Retrieves monthly statistics for users/clients with optional filtering by MAC address.
     * 
     * @param mac - Optional client MAC address to filter results
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param attribs - Optional array of specific attributes to retrieve
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of monthly user statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get monthly stats for all users
     * const allUserStats = await statisticsAPI.stat_monthly_user();
     * 
     * // Get stats for specific user over last year
     * const start = Date.now() - (365 * 24 * 60 * 60 * 1000);
     * const userStats = await statisticsAPI.stat_monthly_user(
     *   'aa:bb:cc:dd:ee:ff', start, Date.now()
     * );
     * ```
     * 
     * @see {@link stat_daily_user} for daily user statistics
     * @see {@link stat_hourly_user} for hourly user statistics
     * 
     * PHP: stat_monthly_user($mac = null, $start = null, $end = null, $attribs = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/monthly.user', $payload);
     */
    async stat_monthly_user(
        mac?: string,
        start?: number,
        end?: number,
        attribs?: string[],
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (mac) payload.mac = mac.toLowerCase();
        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (attribs && attribs.length > 0) payload.attrs = attribs;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/monthly.user',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // SPECIALIZED STATISTICS
    // ============================================================================

    /**
     * Fetch all users statistics
     * 
     * Retrieves comprehensive statistics for all users/clients over a specified time period.
     * 
     * @param historyhours - Number of hours of history to retrieve (default: 8760 = 1 year)
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of all user statistics
     * 
     * @throws {APIError} When statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all user stats for last month
     * const monthlyStats = await statisticsAPI.stat_allusers(720); // 30 days
     * 
     * // Get all user stats for last week
     * const weeklyStats = await statisticsAPI.stat_allusers(168); // 7 days
     * 
     * // Get comprehensive yearly stats
     * const yearlyStats = await statisticsAPI.stat_allusers(); // Default 1 year
     * ```
     * 
     * @see {@link stat_client} for individual client statistics
     * @see {@link stat_daily_user} for daily user statistics
     * 
     * PHP: stat_allusers($historyhours = 8760) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/alluser', $payload);
     */
    async stat_allusers(
        historyhours: number = 8760,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload = {
            within: historyhours
        };

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/alluser',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch details for a single client device
     * 
     * Retrieves detailed statistics and information for a specific client device.
     * 
     * @param mac - **Required** MAC address of the client device
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to client device statistics
     * 
     * @throws {Error} When MAC address is invalid
     * @throws {APIError} When client statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get detailed stats for specific client
     * const clientStats = await statisticsAPI.stat_client('aa:bb:cc:dd:ee:ff');
     * console.log(`Client: ${clientStats.hostname || clientStats.mac}`);
     * console.log(`Total bytes: ${clientStats.tx_bytes + clientStats.rx_bytes}`);
     * ```
     * 
     * @see {@link stat_allusers} for all user statistics
     * @see {@link stat_daily_user} for daily user statistics
     * 
     * PHP: stat_client($mac) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/user/' . strtolower(trim($mac)));
     */
    async stat_client(mac: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        if (!mac || typeof mac !== 'string') {
            throw new Error('MAC address is required');
        }

        return await this.makeRequest<any>({
            method: 'GET',
            url: `/api/s/{site}/stat/user/${mac.toLowerCase().trim()}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch authorization events
     * 
     * Retrieves authentication and authorization events for the site.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of authorization events
     * 
     * @throws {APIError} When authorization events retrieval fails
     * 
     * @example
     * ```typescript
     * // Get recent authorization events
     * const authEvents = await statisticsAPI.stat_auths();
     * 
     * // Get auth events for specific time range
     * const start = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
     * const dayAuthEvents = await statisticsAPI.stat_auths(start, Date.now());
     * ```
     * 
     * @see {@link list_events} for general system events
     * @see {@link stat_sessions} for session information
     * 
     * PHP: stat_auths($start = null, $end = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/authorization', $payload);
     */
    async stat_auths(
        start?: number,
        end?: number,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/authorization',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch sessions
     * 
     * Retrieves user session information with optional filtering.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param mac - Optional client MAC address to filter sessions
     * @param type - Session type filter: 'all', 'guest', or 'user' (default: 'all')
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of session objects
     * 
     * @throws {APIError} When sessions retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all recent sessions
     * const allSessions = await statisticsAPI.stat_sessions();
     * 
     * // Get guest sessions only
     * const guestSessions = await statisticsAPI.stat_sessions(
     *   undefined, undefined, undefined, 'guest'
     * );
     * 
     * // Get sessions for specific client
     * const clientSessions = await statisticsAPI.stat_sessions(
     *   undefined, undefined, 'aa:bb:cc:dd:ee:ff'
     * );
     * ```
     * 
     * @see {@link stat_auths} for authorization events
     * @see {@link stat_client} for client-specific statistics
     * 
     * PHP: stat_sessions($start = null, $end = null, $mac = null, $type = 'all') -> return $this->fetch_results('/api/s/' . $this->site . '/stat/session', $payload);
     */
    async stat_sessions(
        start?: number,
        end?: number,
        mac?: string,
        type: string = 'all',
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {
            type: type.trim()
        };

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (mac) payload.mac = mac.toLowerCase();

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/session',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch IPS events
     * 
     * Retrieves Intrusion Prevention System (IPS) security events.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param limit - Optional maximum number of events to return
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of IPS event objects
     * 
     * @throws {APIError} When IPS events retrieval fails
     * 
     * @example
     * ```typescript
     * // Get recent IPS events
     * const ipsEvents = await statisticsAPI.stat_ips_events();
     * 
     * // Get IPS events for last 24 hours with limit
     * const start = Date.now() - (24 * 60 * 60 * 1000);
     * const recentEvents = await statisticsAPI.stat_ips_events(start, Date.now(), 100);
     * 
     * // Analyze security threats
     * const events = await statisticsAPI.stat_ips_events();
     * const threats = events.filter(event => event.severity === 'high');
     * ```
     * 
     * @see {@link list_events} for general system events
     * @see {@link list_alarms} for security alarms
     * 
     * PHP: stat_ips_events($start = null, $end = null, $limit = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/ips/event', $payload);
     */
    async stat_ips_events(
        start?: number,
        end?: number,
        limit?: number,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;
        if (limit !== undefined) payload._limit = limit;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/ips/event',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch speed test results
     * 
     * Retrieves network speed test results performed by the UniFi system.
     * 
     * @param start - Optional start timestamp (Unix timestamp in milliseconds)
     * @param end - Optional end timestamp (Unix timestamp in milliseconds)
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of speed test result objects
     * 
     * @throws {APIError} When speed test results retrieval fails
     * 
     * @example
     * ```typescript
     * // Get recent speed test results
     * const speedTests = await statisticsAPI.stat_speedtest_results();
     * 
     * // Get speed tests for last month
     * const start = Date.now() - (30 * 24 * 60 * 60 * 1000);
     * const monthlyTests = await statisticsAPI.stat_speedtest_results(start, Date.now());
     * 
     * // Analyze network performance
     * const tests = await statisticsAPI.stat_speedtest_results();
     * const avgDownload = tests.reduce((sum, test) => sum + test.download, 0) / tests.length;
     * const avgUpload = tests.reduce((sum, test) => sum + test.upload, 0) / tests.length;
     * ```
     * 
     * @see {@link stat_5minutes_gateway} for gateway performance statistics
     * @see {@link list_health} for network health metrics
     * 
     * PHP: stat_speedtest_results($start = null, $end = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/report/archive.speedtest', $payload);
     */
    async stat_speedtest_results(
        start?: number,
        end?: number,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (start !== undefined) payload.start = start;
        if (end !== undefined) payload.end = end;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/report/archive.speedtest',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch payments
     * 
     * Retrieves payment information for guest access or hotspot services.
     * 
     * @param within - Optional time period in hours to retrieve payments for
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of payment objects
     * 
     * @throws {APIError} When payments retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all payments
     * const allPayments = await statisticsAPI.stat_payment();
     * 
     * // Get payments from last 24 hours
     * const recentPayments = await statisticsAPI.stat_payment(24);
     * 
     * // Analyze payment trends
     * const payments = await statisticsAPI.stat_payment(720); // Last 30 days
     * const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
     * ```
     * 
     * @see {@link stat_voucher} for voucher statistics
     * @see {@link list_guests} for guest access information
     * 
     * PHP: stat_payment($within = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/payment' . $path_suffix);
     */
    async stat_payment(
        within?: number,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const path_suffix = within ? `?within=${within}` : '';

        return await this.makeRequest<any>({
            method: 'GET',
            url: `/api/s/{site}/stat/payment${path_suffix}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Fetch voucher stats
     * 
     * Retrieves statistics about guest access vouchers.
     * 
     * @param create_time - Optional creation time filter (Unix timestamp)
     * @param site - Site name (defaults to 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of voucher statistics
     * 
     * @throws {APIError} When voucher statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all voucher stats
     * const voucherStats = await statisticsAPI.stat_voucher();
     * 
     * // Get vouchers created after specific time
     * const recentTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
     * const recentVouchers = await statisticsAPI.stat_voucher(recentTime);
     * 
     * // Analyze voucher usage
     * const vouchers = await statisticsAPI.stat_voucher();
     * const usedVouchers = vouchers.filter(v => v.used > 0);
     * const unusedVouchers = vouchers.filter(v => v.used === 0);
     * ```
     * 
     * @see {@link stat_payment} for payment statistics
     * @see {@link list_guests} for guest access information
     * 
     * PHP: stat_voucher($create_time = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/voucher', $payload);
     */
    async stat_voucher(
        create_time?: number,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {};

        if (create_time !== undefined) payload.create_time = create_time;

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/voucher',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // ALARM AND EVENT MANAGEMENT METHODS
    // ============================================================================

    /**
     * Archive alarms
     * 
     * Archives (dismisses) alarms in the UniFi Controller. Can archive a specific alarm
     * by ID or archive all current alarms.
     * 
     * @group Alarm Management
     * 
     * @param alarm_id - Optional specific alarm ID to archive. If not provided, archives all alarms
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if alarm archiving was successful
     * 
     * @throws {APIError} When alarm archiving fails
     * 
     * @example
     * ```typescript
     * // Archive all alarms
     * await statisticsAPI.archive_alarm();
     * 
     * // Archive specific alarm
     * await statisticsAPI.archive_alarm('507f1f77bcf86cd799439011');
     * 
     * // Archive alarms after reviewing them
     * const alarms = await statisticsAPI.list_alarms();
     * const criticalAlarms = alarms.filter(alarm => alarm.key === 'EVT_GW_WAN_Disconnected');
     * for (const alarm of criticalAlarms) {
     *   await statisticsAPI.archive_alarm(alarm._id);
     * }
     * ```
     * 
     * @see {@link list_alarms} to view current alarms
     * @see {@link count_alarms} to get alarm counts
     * 
     * PHP: archive_alarm($alarm_id = '') -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/evtmgr', $payload);
     */
    async archive_alarm(alarm_id?: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = alarm_id
            ? { cmd: 'archive-alarm', _id: alarm_id }
            : { cmd: 'archive-all-alarms' };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/evtmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // SYSTEM COMMAND AND CONTROL METHODS
    // ============================================================================

    /**
     * Execute command statistics
     * 
     * Executes specific system commands for statistics management.
     * Currently supports DPI (Deep Packet Inspection) reset operations.
     * 
     * @group System Commands
     * 
     * @param command - **Required** Command to execute (currently only 'reset-dpi' is supported)
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if command execution was successful
     * 
     * @throws {Error} When command is invalid or not supported
     * @throws {APIError} When command execution fails
     * 
     * @example
     * ```typescript
     * // Reset DPI statistics
     * await statisticsAPI.cmd_stat('reset-dpi');
     * 
     * // This will clear all DPI data and start fresh collection
     * ```
     * 
     * @warning This command will reset DPI statistics permanently
     * 
     * @see {@link list_dpi_stats} to view DPI statistics
     * @see {@link list_dpi_stats_filtered} for filtered DPI data
     * 
     * PHP: cmd_stat($command) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/stat', $payload);
     */
    async cmd_stat(command: string, site: string = 'default', options?: { signal?: AbortSignal }): Promise<boolean> {
        // Only allow specific commands for security
        if (command !== 'reset-dpi') {
            throw new Error('Invalid command. Only "reset-dpi" is supported.');
        }

        const payload = {
            cmd: command
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/stat',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // DASHBOARD AND MONITORING METHODS
    // ============================================================================

    /**
     * List dashboard
     * 
     * Retrieves dashboard statistics and metrics for the UniFi site.
     * Can provide either standard or 5-minute interval statistics.
     * 
     * @group Dashboard
     * 
     * @param five_minutes - Whether to use 5-minute intervals instead of standard intervals (default: false)
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to dashboard statistics object
     * 
     * @throws {APIError} When dashboard statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get standard dashboard stats
     * const dashboard = await statisticsAPI.list_dashboard();
     * console.log(`Total clients: ${dashboard.num_user}`);
     * console.log(`Total devices: ${dashboard.num_ap + dashboard.num_sw + dashboard.num_gw}`);
     * 
     * // Get high-resolution 5-minute stats
     * const detailedDashboard = await statisticsAPI.list_dashboard(true);
     * 
     * // Monitor network health
     * const stats = await statisticsAPI.list_dashboard();
     * if (stats.num_disconnected > 0) {
     *   console.log(`Warning: ${stats.num_disconnected} devices disconnected`);
     * }
     * ```
     * 
     * @see {@link stat_5minutes_site} for detailed 5-minute site statistics
     * @see {@link list_health} for network health metrics
     * 
     * PHP: list_dashboard($five_minutes = false) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/dashboard', $payload);
     */
    async list_dashboard(five_minutes: boolean = false, site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        const payload = five_minutes ? { scale: '5minutes' } : {};

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/dashboard',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // DPI (DEEP PACKET INSPECTION) METHODS
    // ============================================================================

    /**
     * List DPI stats
     * 
     * Retrieves Deep Packet Inspection (DPI) statistics showing application usage
     * and traffic patterns across the network.
     * 
     * @group DPI Statistics
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of DPI statistics objects
     * 
     * @throws {APIError} When DPI statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all DPI stats
     * const dpiStats = await statisticsAPI.list_dpi_stats();
     * 
     * // Find top applications by traffic
     * const topApps = dpiStats
     *   .sort((a, b) => (b.tx_bytes + b.rx_bytes) - (a.tx_bytes + a.rx_bytes))
     *   .slice(0, 10);
     * 
     * // Analyze social media usage
     * const socialApps = dpiStats.filter(app => 
     *   app.cat && app.cat.toLowerCase().includes('social')
     * );
     * ```
     * 
     * @see {@link list_dpi_stats_filtered} for filtered DPI statistics
     * @see {@link cmd_stat} to reset DPI statistics
     * 
     * PHP: list_dpi_stats() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/dpi');
     */
    async list_dpi_stats(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/stat/dpi',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List DPI stats filtered
     * 
     * Retrieves filtered Deep Packet Inspection (DPI) statistics with specific
     * categorization and filtering options.
     * 
     * @group DPI Statistics
     * 
     * @param type - Type of DPI grouping: 'by_app' or 'by_cat' (default: 'by_app')
     * @param cat_filter - Optional category filter to limit results
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to filtered DPI statistics
     * 
     * @throws {APIError} When filtered DPI statistics retrieval fails
     * 
     * @example
     * ```typescript
     * // Get DPI stats grouped by application
     * const appStats = await statisticsAPI.list_dpi_stats_filtered('by_app');
     * 
     * // Get DPI stats grouped by category
     * const catStats = await statisticsAPI.list_dpi_stats_filtered('by_cat');
     * 
     * // Get stats for specific category
     * const socialStats = await statisticsAPI.list_dpi_stats_filtered('by_app', 'Social');
     * 
     * // Analyze streaming usage
     * const streamingStats = await statisticsAPI.list_dpi_stats_filtered('by_app', 'Streaming');
     * const totalStreaming = streamingStats.reduce((sum, app) => 
     *   sum + app.tx_bytes + app.rx_bytes, 0
     * );
     * ```
     * 
     * @see {@link list_dpi_stats} for unfiltered DPI statistics
     * @see {@link cmd_stat} to reset DPI statistics
     * 
     * PHP: list_dpi_stats_filtered($type = 'by_app', $cat_filter = null) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/sitedpi', $payload);
     */
    async list_dpi_stats_filtered(
        type: string = 'by_app',
        cat_filter?: string,
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload: any = {
            type
        };

        if (cat_filter) {
            payload.cats = cat_filter;
        }

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/sitedpi',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // SYSTEM STATUS AND MONITORING METHODS
    // ============================================================================

    /**
     * Stat status
     * 
     * Retrieves comprehensive status information for the UniFi site including
     * device states, network health, and system performance metrics.
     * 
     * @group System Status
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to system status information
     * 
     * @throws {APIError} When status retrieval fails
     * 
     * @example
     * ```typescript
     * // Get comprehensive system status
     * const status = await statisticsAPI.stat_status();
     * console.log(`Controller version: ${status.version}`);
     * console.log(`Uptime: ${status.uptime} seconds`);
     * 
     * // Check for issues
     * if (status.num_disconnected > 0) {
     *   console.log(`${status.num_disconnected} devices are disconnected`);
     * }
     * 
     * // Monitor performance
     * console.log(`Memory usage: ${status.mem_used}/${status.mem_total} MB`);
     * console.log(`CPU load: ${status.loadavg_1}%`);
     * ```
     * 
     * @see {@link stat_sysinfo} for detailed system information
     * @see {@link list_dashboard} for dashboard metrics
     * @see {@link list_health} for network health status
     * 
     * PHP: stat_status() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/status');
     */
    async stat_status(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/stat/status',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // SYSTEM LOG METHODS
    // ============================================================================

    /**
     * Get system log
     * 
     * Retrieves system log entries from the UniFi Controller.
     * Provides access to system events, errors, and operational messages.
     * 
     * @group System Logs
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of system log entries
     * 
     * @throws {APIError} When system log retrieval fails
     * 
     * @example
     * ```typescript
     * // Get system logs
     * const logs = await statisticsAPI.get_system_log();
     * 
     * // Filter error messages
     * const errors = logs.filter(log => 
     *   log.level === 'error' || log.msg.toLowerCase().includes('error')
     * );
     * 
     * // Find recent critical events
     * const recentCritical = logs.filter(log => 
     *   log.level === 'critical' && 
     *   Date.now() - log.datetime < (24 * 60 * 60 * 1000) // Last 24 hours
     * );
     * 
     * // Monitor device events
     * const deviceEvents = logs.filter(log => 
     *   log.msg.includes('device') || log.msg.includes('AP')
     * );
     * ```
     * 
     * @see {@link list_events} for structured event information
     * @see {@link list_alarms} for alarm information
     * 
     * PHP: get_system_log() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/log');
     */
    async get_system_log(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/stat/log',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // DISCOVERY AND FINGERPRINTING METHODS
    // ============================================================================

    /**
     * List extension
     * 
     * Retrieves information about UniFi Controller extensions and add-ons.
     * This includes installed plugins, modules, and additional functionality.
     * 
     * @group Discovery & Fingerprinting
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of extension objects
     * 
     * @throws {APIError} When extension listing fails
     * 
     * @example
     * ```typescript
     * // Get all installed extensions
     * const extensions = await statisticsAPI.list_extension();
     * 
     * // Check for specific extensions
     * const hasProtect = extensions.some(ext => ext.name.includes('Protect'));
     * const hasAccess = extensions.some(ext => ext.name.includes('Access'));
     * 
     * // List extension details
     * extensions.forEach(ext => {
     *   console.log(`${ext.name} v${ext.version} - ${ext.status}`);
     * });
     * ```
     * 
     * @see {@link stat_sysinfo} for system information
     * @see {@link list_fingerprint_devices} for device fingerprinting
     * 
     * PHP: list_extension() -> return $this->fetch_results('/api/s/' . $this->site . '/list/extension');
     */
    async list_extension(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/list/extension',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List fingerprint devices
     * 
     * Retrieves device fingerprinting information showing detected device types,
     * operating systems, and other identifying characteristics based on network behavior.
     * 
     * @group Discovery & Fingerprinting
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of fingerprint device objects
     * 
     * @throws {APIError} When fingerprint device listing fails
     * 
     * @example
     * ```typescript
     * // Get all device fingerprints
     * const fingerprints = await statisticsAPI.list_fingerprint_devices();
     * 
     * // Analyze device types
     * const deviceTypes = fingerprints.reduce((acc, device) => {
     *   acc[device.dev_cat] = (acc[device.dev_cat] || 0) + 1;
     *   return acc;
     * }, {});
     * 
     * // Find mobile devices
     * const mobileDevices = fingerprints.filter(device => 
     *   device.dev_cat === 'Mobile' || device.os_name.includes('iOS') || device.os_name.includes('Android')
     * );
     * 
     * // Check for unknown devices
     * const unknownDevices = fingerprints.filter(device => 
     *   device.dev_cat === 'Unknown' || !device.os_name
     * );
     * ```
     * 
     * @see {@link list_extension} for controller extensions
     * @see {@link list_devices} for managed device information
     * 
     * PHP: list_fingerprint_devices() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/fingerprint');
     */
    async list_fingerprint_devices(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/stat/fingerprint',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // ROGUE ACCESS POINT DETECTION METHODS
    // ============================================================================

    /**
     * List rogue APs
     * 
     * Retrieves a list of rogue (unauthorized) access points detected within
     * the specified time period. Helps identify potential security threats.
     * 
     * @group Security Monitoring
     * 
     * @param within - Time period in hours to search for rogue APs (default: 24)
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of rogue access point objects
     * 
     * @throws {APIError} When rogue AP listing fails
     * 
     * @example
     * ```typescript
     * // Get rogue APs from last 24 hours
     * const rogueAPs = await statisticsAPI.list_rogueaps();
     * 
     * // Get rogue APs from last week
     * const weeklyRogues = await statisticsAPI.list_rogueaps(168); // 7 days
     * 
     * // Analyze security threats
     * const rogues = await statisticsAPI.list_rogueaps();
     * const strongSignalRogues = rogues.filter(ap => ap.signal > -50);
     * const suspiciousNames = rogues.filter(ap => 
     *   ap.essid && ap.essid.toLowerCase().includes('free')
     * );
     * 
     * // Check for known rogue APs
     * const knownRogues = await statisticsAPI.list_known_rogueaps();
     * const newRogues = rogues.filter(rogue => 
     *   !knownRogues.some(known => known.bssid === rogue.bssid)
     * );
     * ```
     * 
     * @see {@link list_known_rogueaps} for known/whitelisted rogue APs
     * @see {@link list_alarms} for security-related alarms
     * 
     * PHP: list_rogueaps($within = 24) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/rogueap', $payload);
     */
    async list_rogueaps(within: number = 24, site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        const payload = {
            within
        };

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/stat/rogueap',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List known rogue APs
     * 
     * Retrieves a list of known (whitelisted) rogue access points that have been
     * marked as safe or authorized. These APs won't trigger security alerts.
     * 
     * @group Security Monitoring
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of known rogue access point objects
     * 
     * @throws {APIError} When known rogue AP listing fails
     * 
     * @example
     * ```typescript
     * // Get all known/whitelisted rogue APs
     * const knownRogues = await statisticsAPI.list_known_rogueaps();
     * 
     * // Check if specific AP is whitelisted
     * const targetBSSID = 'aa:bb:cc:dd:ee:ff';
     * const isWhitelisted = knownRogues.some(ap => ap.bssid === targetBSSID);
     * 
     * // Review whitelisted APs
     * console.log(`${knownRogues.length} APs are whitelisted`);
     * knownRogues.forEach(ap => {
     *   console.log(`${ap.essid} (${ap.bssid}) - ${ap.note || 'No note'}`);
     * });
     * ```
     * 
     * @see {@link list_rogueaps} for detected rogue APs
     * @see {@link list_alarms} for security-related alarms
     * 
     * PHP: list_known_rogueaps() -> return $this->fetch_results('/api/s/' . $this->site . '/rest/rogueknown');
     */
    async list_known_rogueaps(site: string = 'default', options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/rest/rogueknown',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }
}