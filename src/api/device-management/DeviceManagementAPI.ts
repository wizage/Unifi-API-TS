/**
 * Device Management API module
 * 
 * Handles all UniFi device-related operations including adoption, configuration, and maintenance.
 * This module provides comprehensive device management functionality for UniFi networks.
 * 
 * @since 1.0.0
 * @category Device Management
 */

import { HTTPClient } from '../../http/HTTPClient';
import { UniFiDevice, AdvancedAdoptConfig } from '../../types';

export class DeviceManagementAPI {
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

    /**
     * List UniFi devices (Access Points, Switches, Gateways, etc.)
     * 
     * @description Retrieves information about UniFi devices in the network. Can optionally filter
     * by specific MAC addresses. When no MAC addresses are provided, returns all devices.
     * 
     * @param macs - Optional MAC address(es) to filter devices. Can be a single MAC string or array of MACs
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal for request cancellation
     * 
     * @returns Promise resolving to an array of UniFi device objects
     * 
     * @example
     * ```typescript
     * // Get all devices
     * const allDevices = await client.list_devices();
     * 
     * // Get specific device by MAC
     * const device = await client.list_devices('aa:bb:cc:dd:ee:ff');
     * 
     * // Get multiple devices by MAC
     * const devices = await client.list_devices(['aa:bb:cc:dd:ee:ff', 'ff:ee:dd:cc:bb:aa']);
     * 
     * // Filter access points only
     * const allDevices = await client.list_devices();
     * const accessPoints = allDevices.filter(device => device.type === 'uap');
     * ```
     * 
     * @see {@link list_devices_basic} for basic device information (faster)
     * @see {@link adopt_device} to adopt new devices
     * 
     * @since 1.0.0
     * @category Device Management
     * @remarks PHP: list_devices($macs = []) -> return $this->fetch_results('/api/s/' . $this->site . '/stat/device', $payload);
     */
    async list_devices(macs?: string | string[], options?: { signal?: AbortSignal }): Promise<UniFiDevice[]> {
        const mac_array = Array.isArray(macs) ? macs : (macs ? [macs] : []);

        if (mac_array.length > 0) {
            // POST with payload when filtering by MACs
            const payload = { macs: mac_array.map(mac => mac.toLowerCase()) };
            return await this.makeRequest<UniFiDevice[]>({
                method: 'POST',
                url: '/api/s/{site}/stat/device',
                data: payload,
                ...(options?.signal && { signal: options.signal }),
            });
        } else {
            // GET when no filtering
            return await this.makeRequest<UniFiDevice[]>({
                method: 'GET',
                url: '/api/s/{site}/stat/device',
                ...(options?.signal && { signal: options.signal }),
            });
        }
    }

    /**
     * Adopt one or more UniFi devices to the current site
     * 
     * @description Adopts UniFi devices (Access Points, Switches, Gateways) to the current site.
     * Devices must be in an adoptable state (showing as pending adoption in the controller).
     * 
     * @param macs - **Required** MAC address(es) of device(s) to adopt. Can be a single MAC string or array of MACs
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal for request cancellation
     * 
     * @returns Promise resolving to true if adoption was successful
     * 
     * @throws {Error} When MAC address format is invalid
     * @throws {APIError} When device is not in adoptable state or already adopted
     * 
     * @example
     * ```typescript
     * // Adopt single device
     * await client.adopt_device('aa:bb:cc:dd:ee:ff');
     * 
     * // Adopt multiple devices
     * await client.adopt_device(['aa:bb:cc:dd:ee:ff', 'ff:ee:dd:cc:bb:aa']);
     * 
     * // With error handling
     * try {
     *   await client.adopt_device('aa:bb:cc:dd:ee:ff');
     *   console.log('Device adopted successfully');
     * } catch (error) {
     *   console.error('Adoption failed:', error.message);
     * }
     * ```
     * 
     * @see {@link advanced_adopt_device} for adoption with custom SSH credentials
     * @see {@link list_devices} to check device status after adoption
     * 
     * @since 1.0.0
     * @category Device Management
     * @remarks PHP: adopt_device($macs) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr', $payload);
     */
    async adopt_device(macs: string | string[], options?: { signal?: AbortSignal }): Promise<boolean> {
        const mac_array = Array.isArray(macs) ? macs : [macs];

        const payload = {
            macs: mac_array.map(mac => mac.toLowerCase()),
            cmd: 'adopt'
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Adopt a device using custom SSH credentials
     * 
     * @description Adopts a UniFi device using custom SSH credentials for advanced scenarios
     * where the device requires specific authentication parameters.
     * 
     * @param mac - **Required** MAC address of the device to adopt
     * @param ip - **Required** IP address of the device
     * @param username - **Required** SSH username for device access
     * @param password - **Required** SSH password for device access
     * @param url - **Required** Controller URL for device adoption
     * @param port - Optional SSH port (default: 22)
     * @param ssh_key_verify - Optional SSH key verification (default: true)
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal for request cancellation
     * 
     * @returns Promise resolving to true if advanced adoption was successful
     * 
     * @throws {Error} When required parameters are missing or invalid
     * @throws {APIError} When advanced adoption fails
     * 
     * @example
     * ```typescript
     * // Advanced adoption with custom credentials
     * await client.advanced_adopt_device(
     *   'aa:bb:cc:dd:ee:ff',
     *   '192.168.1.100',
     *   'ubnt',
     *   'ubnt',
     *   'https://controller.example.com:8443',
     *   22,
     *   true
     * );
     * ```
     * 
     * @see {@link adopt_device} for standard device adoption
     * 
     * @since 1.0.0
     * @category Device Management
     * @remarks PHP: advanced_adopt_device($mac, $ip, $username, $password, $url, $port = 22, $ssh_key_verify = true)
     */
    async advanced_adopt_device(
        mac: string,
        ip: string,
        username: string,
        password: string,
        url: string,
        port: number = 22,
        ssh_key_verify: boolean = true,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const payload = {
            cmd: 'adv-adopt',
            mac: mac.toLowerCase(),
            ip,
            username,
            password,
            url,
            port,
            sshKeyVerify: ssh_key_verify,
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    } 
   /**
     * Cancel device migration
     * 
     * Cancels an ongoing device migration process for one or more UniFi devices.
     * This stops the migration and returns devices to their previous state.
     * 
     * @group Device Management
     * 
     * @param macs - **Required** MAC address(es) of device(s) to cancel migration for
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if migration cancellation was successful
     * 
     * @throws {Error} When MAC address validation fails
     * @throws {APIError} When migration cancellation fails
     * 
     * @example
     * ```typescript
     * // Cancel migration for single device
     * await client.cancel_migrate_device('aa:bb:cc:dd:ee:ff');
     * 
     * // Cancel migration for multiple devices
     * await client.cancel_migrate_device([
     *   'aa:bb:cc:dd:ee:ff',
     *   'ff:ee:dd:cc:bb:aa'
     * ]);
     * ```
     * 
     * @see {@link migrate_device} to start device migration
     * @see {@link list_devices} to get device information
     * 
     * PHP: cancel_migrate_device($macs) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr', $payload);
     */
    async cancel_migrate_device(macs: string | string[], options?: { signal?: AbortSignal }): Promise<boolean> {
        const mac_array = Array.isArray(macs) ? macs : [macs];

        const payload = {
            macs: mac_array.map(mac => mac.toLowerCase()),
            cmd: 'cancel-migrate'
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Cancel rolling upgrade
     * 
     * Cancels an ongoing rolling upgrade process for UniFi devices.
     * This stops the automatic firmware upgrade sequence across devices.
     * 
     * @group Device Management
     * 
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if rolling upgrade cancellation was successful
     * 
     * @throws {APIError} When rolling upgrade cancellation fails
     * 
     * @example
     * ```typescript
     * // Cancel ongoing rolling upgrade
     * await client.cancel_rolling_upgrade();
     * 
     * // With cancellation support
     * const controller = new AbortController();
     * await client.cancel_rolling_upgrade({ signal: controller.signal });
     * ```
     * 
     * @see {@link start_rolling_upgrade} to start a rolling upgrade
     * @see {@link check_firmware_update} to check for available updates
     * 
     * PHP: cancel_rolling_upgrade() -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr', $payload);
     */
    async cancel_rolling_upgrade(options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            cmd: 'unset-rollupgrade'
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Check for firmware updates
     * 
     * Initiates a check for available firmware updates for all UniFi devices
     * in the site. This triggers the controller to query for new firmware versions.
     * 
     * @group Device Management
     * 
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
     * await client.check_firmware_update();
     * 
     * // Then list devices to see available updates
     * const devices = await client.list_devices();
     * const devicesWithUpdates = devices.filter(device => device.upgradable);
     * ```
     * 
     * @see {@link list_devices} to see which devices have available updates
     * @see {@link upgrade_device} to upgrade specific devices
     * @see {@link start_rolling_upgrade} to upgrade all devices automatically
     * 
     * PHP: check_firmware_update() -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr', $payload);
     */
    async check_firmware_update(options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            cmd: 'check-firmware-update'
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Delete device
     * 
     * Permanently removes a device from the UniFi Controller.
     * This operation cannot be undone and the device will need to be re-adopted.
     * 
     * @param mac - **Required** MAC address of the device to delete
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if device deletion was successful
     * 
     * @throws {Error} When MAC address validation fails
     * @throws {APIError} When device deletion fails
     * 
     * @example
     * ```typescript
     * // Delete a device by MAC address
     * await client.delete_device('aa:bb:cc:dd:ee:ff');
     * ```
     * 
     * @warning This operation is irreversible
     * 
     * @see {@link list_devices} to get device MAC addresses
     * @see {@link adopt_device} to re-adopt deleted devices
     * 
     * PHP: delete_device($mac)
     */
    async delete_device(mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            cmd: 'delete-device',
            mac: mac.toLowerCase()
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/sitemgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Disable access point
     * 
     * Disables or enables an Access Point device.
     * When disabled, the AP will stop broadcasting wireless networks.
     * 
     * @param ap_id - **Required** Access Point device ID
     * @param disable - **Required** Whether to disable (true) or enable (false) the AP
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if AP disable/enable was successful
     * 
     * @throws {Error} When ap_id validation fails
     * @throws {APIError} When AP disable/enable fails
     * 
     * @example
     * ```typescript
     * // Disable an Access Point
     * await client.disable_ap('507f1f77bcf86cd799439011', true);
     * 
     * // Enable an Access Point
     * await client.disable_ap('507f1f77bcf86cd799439011', false);
     * ```
     * 
     * @see {@link list_devices} to get AP device IDs
     * @see {@link restart_device} to restart disabled APs
     * 
     * PHP: disable_ap($ap_id, $disable) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/device/' . trim($ap_id), $payload);
     */
    async disable_ap(ap_id: string, disable: boolean, options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            disabled: disable
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/rest/device/${ap_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Force provision device
     * 
     * Forces provisioning of one or more UniFi devices.
     * This triggers the device to re-download its configuration from the controller.
     * 
     * @param macs - **Required** MAC address(es) of device(s) to force provision
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if force provision was successful
     * 
     * @throws {Error} When MAC address validation fails
     * @throws {APIError} When force provision fails
     * 
     * @example
     * ```typescript
     * // Force provision single device
     * await client.force_provision('aa:bb:cc:dd:ee:ff');
     * 
     * // Force provision multiple devices
     * await client.force_provision([
     *   'aa:bb:cc:dd:ee:ff',
     *   'ff:ee:dd:cc:bb:aa'
     * ]);
     * ```
     * 
     * @see {@link list_devices} to get device MAC addresses
     * @see {@link restart_device} for device restart operations
     * 
     * PHP: force_provision($mac) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr/', $payload);
     */
    async force_provision(macs: string | string[], options?: { signal?: AbortSignal }): Promise<boolean> {
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
            macs: mac_array.map(mac => mac.toLowerCase()),
            cmd: 'force-provision'
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }    /*
*
     * Override LED settings on a device
     * 
     * Controls the LED indicator on UniFi devices.
     * Can turn LEDs on, off, or return to default behavior.
     * 
     * @param device_id - **Required** Device ID to control LED for
     * @param override_mode - **Required** LED mode: 'off', 'on', or 'default'
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if LED override was successful
     * 
     * @throws {Error} When device_id or override_mode validation fails
     * @throws {APIError} When LED override fails
     * 
     * @example
     * ```typescript
     * // Turn off device LED
     * await client.led_override('507f1f77bcf86cd799439011', 'off');
     * 
     * // Turn on device LED
     * await client.led_override('507f1f77bcf86cd799439011', 'on');
     * 
     * // Return to default LED behavior
     * await client.led_override('507f1f77bcf86cd799439011', 'default');
     * ```
     * 
     * @see {@link list_devices} to get device IDs
     * @see {@link locate_ap} for temporary LED location functionality
     * 
     * PHP: led_override($device_id, $override_mode) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/device/' . trim($device_id), $payload);
     */
    async led_override(
        device_id: string,
        override_mode: 'off' | 'on' | 'default',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const payload = {
            led_override: override_mode
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/rest/device/${device_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * List access point groups
     * 
     * Retrieves all Access Point groups configured in the site.
     * AP groups allow organizing and managing multiple APs together.
     * 
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to an array of AP group objects
     * 
     * @throws {APIError} When AP group listing fails
     * 
     * @example
     * ```typescript
     * // List all AP groups
     * const apGroups = await client.list_apgroups();
     * console.log(`Found ${apGroups.length} AP groups`);
     * 
     * // Find specific AP group
     * const mainGroup = apGroups.find(group => group.name === 'Main Building');
     * ```
     * 
     * @see {@link create_apgroup} to create new AP groups
     * @see {@link delete_apgroup} to remove AP groups
     * 
     * PHP: list_apgroups() -> return $this->fetch_results('/v2/api/site/' . $this->site . '/apgroups');
     */
    async list_apgroups(options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/v2/api/site/{site}/apgroups',
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * List access points
     * 
     * Retrieves information about Access Point devices.
     * Can optionally filter by specific MAC address.
     * 
     * @param mac - Optional MAC address to filter by specific AP
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to an array of Access Point objects
     * 
     * @throws {APIError} When AP listing fails
     * 
     * @example
     * ```typescript
     * // List all Access Points
     * const aps = await client.list_aps();
     * 
     * // Get specific AP by MAC
     * const ap = await client.list_aps('aa:bb:cc:dd:ee:ff');
     * ```
     * 
     * @see {@link list_devices} for all device types
     * @see {@link adopt_device} to adopt new APs
     * 
     * PHP: list_aps($mac = '') -> return $this->fetch_results('/api/s/' . $this->site . '/stat/device', $payload);
     */
    async list_aps(mac?: string, options?: { signal?: AbortSignal }): Promise<any> {
        if (mac) {
            const payload = {
                macs: [mac.toLowerCase()]
            };
            return await this.makeRequest<any>({
                method: 'POST',
                url: '/api/s/{site}/stat/device',
                data: payload,
                ...(options?.signal && { signal: options.signal }),
            });
        } else {
            return await this.makeRequest<any>({
                method: 'GET',
                url: '/api/s/{site}/stat/device',
                ...(options?.signal && { signal: options.signal }),
            });
        }
    }

    /**
     * List device name mappings
     * 
     * Retrieves device name mappings from the controller.
     * This shows custom names assigned to devices.
     * 
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to device name mapping data
     * 
     * @throws {APIError} When device name mapping retrieval fails
     * 
     * @example
     * ```typescript
     * // Get device name mappings
     * const mappings = await client.list_device_name_mappings();
     * ```
     * 
     * @see {@link rename_ap} to rename devices
     * @see {@link list_devices} to get device information
     * 
     * PHP: list_device_name_mappings() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/device-name-mapping');
     */
    async list_device_name_mappings(options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/stat/device-name-mapping',
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * List device states
     * 
     * Retrieves current state information for all devices.
     * This includes connection status and operational state.
     * 
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to device state data
     * 
     * @throws {APIError} When device state retrieval fails
     * 
     * @example
     * ```typescript
     * // Get device states
     * const states = await client.list_device_states();
     * ```
     * 
     * @see {@link list_devices} for detailed device information
     * @see {@link stat_sysinfo} for system status
     * 
     * PHP: list_device_states() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/device-state');
     */
    async list_device_states(options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/stat/device-state',
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * List devices (basic information)
     * 
     * Retrieves basic device information with reduced data payload.
     * Faster than full device listing for simple operations.
     * 
     * @param device_mac - Optional MAC address to filter by specific device
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to basic device information
     * 
     * @throws {APIError} When basic device listing fails
     * 
     * @example
     * ```typescript
     * // Get basic info for all devices
     * const devices = await client.list_devices_basic();
     * 
     * // Get basic info for specific device
     * const device = await client.list_devices_basic('aa:bb:cc:dd:ee:ff');
     * ```
     * 
     * @see {@link list_devices} for complete device information
     * 
     * PHP: list_devices_basic($device_mac = '') -> return $this->fetch_results('/api/s/' . $this->site . '/stat/device-basic', $payload);
     */
    async list_devices_basic(device_mac?: string, options?: { signal?: AbortSignal }): Promise<any> {
        if (device_mac) {
            const payload = {
                macs: [device_mac.toLowerCase()]
            };
            return await this.makeRequest<any>({
                method: 'POST',
                url: '/api/s/{site}/stat/device-basic',
                data: payload,
                ...(options?.signal && { signal: options.signal }),
            });
        } else {
            return await this.makeRequest<any>({
                method: 'GET',
                url: '/api/s/{site}/stat/device-basic',
                ...(options?.signal && { signal: options.signal }),
            });
        }
    }

    /**
     * List available firmware versions
     * 
     * Retrieves available firmware versions for devices.
     * Can optionally filter by device type.
     * 
     * @param device_type - Optional device type to filter firmware for
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to firmware version data
     * 
     * @throws {APIError} When firmware listing fails
     * 
     * @example
     * ```typescript
     * // List all available firmware
     * const firmware = await client.list_firmware();
     * 
     * // List firmware for specific device type
     * const apFirmware = await client.list_firmware('uap');
     * ```
     * 
     * @see {@link check_firmware_update} to check for updates
     * @see {@link upgrade_device} to upgrade device firmware
     * 
     * PHP: list_firmware($device_type = '') -> return $this->fetch_results('/api/s/' . $this->site . '/stat/firmware', $payload);
     */
    async list_firmware(device_type?: string, options?: { signal?: AbortSignal }): Promise<any> {
        if (device_type) {
            const payload = {
                type: device_type
            };
            return await this.makeRequest<any>({
                method: 'POST',
                url: '/api/s/{site}/stat/firmware',
                data: payload,
                ...(options?.signal && { signal: options.signal }),
            });
        } else {
            return await this.makeRequest<any>({
                method: 'GET',
                url: '/api/s/{site}/stat/firmware',
                ...(options?.signal && { signal: options.signal }),
            });
        }
    }

    /**
     * List device models
     * 
     * Retrieves information about supported device models.
     * This includes model names, capabilities, and specifications.
     * 
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to device model data
     * 
     * @throws {APIError} When device model listing fails
     * 
     * @example
     * ```typescript
     * // Get supported device models
     * const models = await client.list_models();
     * ```
     * 
     * @see {@link list_devices} to see actual devices
     * 
     * PHP: list_models() -> return $this->fetch_results('/api/s/' . $this->site . '/stat/device-model');
     */
    async list_models(options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/stat/device-model',
            ...(options?.signal && { signal: options.signal }),
        });
    } 
   /**
     * Locate access point (LED blink)
     * 
     * Enables or disables the locate LED feature on an Access Point.
     * When enabled, the AP's LED will blink to help physically locate the device.
     * 
     * @param mac - **Required** MAC address of the Access Point
     * @param enable - **Required** Whether to enable (true) or disable (false) locate mode
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if locate operation was successful
     * 
     * @throws {Error} When MAC address validation fails
     * @throws {APIError} When locate operation fails
     * 
     * @example
     * ```typescript
     * // Enable locate mode (LED blinks)
     * await client.locate_ap('aa:bb:cc:dd:ee:ff', true);
     * 
     * // Disable locate mode
     * await client.locate_ap('aa:bb:cc:dd:ee:ff', false);
     * ```
     * 
     * @see {@link led_override} for permanent LED control
     * @see {@link list_aps} to get AP MAC addresses
     * 
     * PHP: locate_ap($mac, $enable) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr', $payload);
     */
    async locate_ap(mac: string, enable: boolean, options?: { signal?: AbortSignal }): Promise<boolean> {
        // Basic MAC address validation
        if (!mac || typeof mac !== 'string') {
            throw new Error('MAC address is required and must be a string');
        }

        const payload = {
            cmd: enable ? 'set-locate' : 'unset-locate',
            mac: mac.toLowerCase()
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Migrate device to another controller
     * 
     * Migrates one or more UniFi devices to a different controller.
     * The devices will be removed from the current controller and adopted by the target.
     * 
     * @param macs - **Required** MAC address(es) of device(s) to migrate
     * @param inform_url - **Required** Inform URL of the target controller
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if migration was initiated successfully
     * 
     * @throws {Error} When MAC address or inform_url validation fails
     * @throws {APIError} When device migration fails
     * 
     * @example
     * ```typescript
     * // Migrate single device
     * await client.migrate_device(
     *   'aa:bb:cc:dd:ee:ff',
     *   'http://new-controller.example.com:8080/inform'
     * );
     * 
     * // Migrate multiple devices
     * await client.migrate_device(
     *   ['aa:bb:cc:dd:ee:ff', 'ff:ee:dd:cc:bb:aa'],
     *   'http://new-controller.example.com:8080/inform'
     * );
     * ```
     * 
     * @see {@link cancel_migrate_device} to cancel ongoing migration
     * @see {@link list_devices} to get device MAC addresses
     * 
     * PHP: migrate_device($macs, $inform_url) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr', $payload);
     */
    async migrate_device(
        macs: string | string[],
        inform_url: string,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const mac_array = Array.isArray(macs) ? macs : [macs];

        if (!inform_url || typeof inform_url !== 'string') {
            throw new Error('Inform URL is required and must be a string');
        }

        const payload = {
            macs: mac_array.map(mac => mac.toLowerCase()),
            inform_url,
            cmd: 'migrate'
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Power cycle switch port
     * 
     * Power cycles a specific port on a UniFi switch.
     * This turns the port off and then back on to reset connected devices.
     * 
     * @param mac - **Required** MAC address of the switch
     * @param port_idx - **Required** Port index to power cycle (1-based)
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if power cycle was successful
     * 
     * @throws {Error} When MAC address or port_idx validation fails
     * @throws {APIError} When power cycle fails
     * 
     * @example
     * ```typescript
     * // Power cycle port 8 on a switch
     * await client.power_cycle_switch_port('aa:bb:cc:dd:ee:ff', 8);
     * ```
     * 
     * @see {@link list_devices} to get switch MAC addresses
     * @see {@link restart_device} to restart the entire switch
     * 
     * PHP: power_cycle_switch_port($mac, $port_idx) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr', $payload);
     */
    async power_cycle_switch_port(
        mac: string,
        port_idx: number,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!mac || typeof mac !== 'string') {
            throw new Error('MAC address is required and must be a string');
        }

        if (!Number.isInteger(port_idx) || port_idx < 1) {
            throw new Error('Port index must be a positive integer starting from 1');
        }

        const payload = {
            mac: mac.toLowerCase(),
            port_idx,
            cmd: 'power-cycle'
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Reboot Cloud Key
     * 
     * Reboots the UniFi Cloud Key device.
     * This will temporarily interrupt controller services.
     * 
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if reboot was initiated successfully
     * 
     * @throws {APIError} When Cloud Key reboot fails
     * 
     * @example
     * ```typescript
     * // Reboot the Cloud Key
     * await client.reboot_cloudkey();
     * ```
     * 
     * @warning This will temporarily interrupt controller services
     * 
     * @see {@link restart_device} to restart other devices
     * 
     * PHP: reboot_cloudkey() -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/system', $payload);
     */
    async reboot_cloudkey(options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            cmd: 'reboot'
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/system',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Rename access point
     * 
     * Changes the name of an Access Point device.
     * The new name will be displayed in the controller interface.
     * 
     * @param ap_id - **Required** Access Point device ID
     * @param ap_name - **Required** New name for the Access Point
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if rename was successful
     * 
     * @throws {Error} When ap_id or ap_name validation fails
     * @throws {APIError} When AP rename fails
     * 
     * @example
     * ```typescript
     * // Rename an Access Point
     * await client.rename_ap('507f1f77bcf86cd799439011', 'Main Office AP');
     * ```
     * 
     * @see {@link list_devices} to get AP device IDs
     * @see {@link list_device_name_mappings} to see current names
     * 
     * PHP: rename_ap($ap_id, $ap_name) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/upd/device/' . trim($ap_id), $payload);
     */
    async rename_ap(
        ap_id: string,
        ap_name: string,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!ap_id || typeof ap_id !== 'string') {
            throw new Error('AP ID is required and must be a string');
        }

        if (!ap_name || typeof ap_name !== 'string') {
            throw new Error('AP name is required and must be a string');
        }

        const payload = {
            name: ap_name.trim()
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/upd/device/${ap_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Restart access point (deprecated)
     * 
     * @deprecated Use restart_device() instead
     * 
     * PHP: restart_ap() -> throw new MethodDeprecatedException('Function restart_ap() has been deprecated, use restart_device() instead.');
     */
    async restart_ap(options?: { signal?: AbortSignal }): Promise<boolean> {
        throw new Error('Function restart_ap() has been deprecated, use restart_device() instead.');
    }

    /**
     * Restart device
     * 
     * Restarts one or more UniFi devices.
     * Can perform either soft restart (graceful) or hard restart (forced).
     * 
     * @param macs - **Required** MAC address(es) of device(s) to restart
     * @param reboot_type - Optional restart type: 'soft' (default) or 'hard'
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if restart was initiated successfully
     * 
     * @throws {Error} When MAC address validation fails
     * @throws {APIError} When device restart fails
     * 
     * @example
     * ```typescript
     * // Soft restart single device
     * await client.restart_device('aa:bb:cc:dd:ee:ff');
     * 
     * // Hard restart multiple devices
     * await client.restart_device(
     *   ['aa:bb:cc:dd:ee:ff', 'ff:ee:dd:cc:bb:aa'],
     *   'hard'
     * );
     * ```
     * 
     * @see {@link list_devices} to get device MAC addresses
     * @see {@link reboot_cloudkey} to restart Cloud Key
     * 
     * PHP: restart_device($macs, $reboot_type = 'soft') -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr', $payload);
     */
    async restart_device(
        macs: string | string[],
        reboot_type: 'soft' | 'hard' = 'soft',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const mac_array = Array.isArray(macs) ? macs : [macs];

        if (mac_array.length === 0) {
            throw new Error('MAC address array cannot be empty');
        }

        const payload = {
            macs: mac_array.map(mac => mac.toLowerCase()),
            reboot_type,
            cmd: 'restart'
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }    /**

     * Set access point radio settings
     * 
     * Configures radio settings for an Access Point including channel, power, and HT mode.
     * This allows fine-tuning of wireless performance and coverage.
     * 
     * @param ap_id - **Required** Access Point device ID
     * @param radio - **Required** Radio identifier ('ng' for 2.4GHz, 'na' for 5GHz)
     * @param channel - **Required** Wireless channel number
     * @param ht - **Required** HT (High Throughput) mode setting
     * @param tx_power_mode - **Required** Transmit power mode
     * @param tx_power - **Required** Transmit power level
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if radio settings were updated successfully
     * 
     * @throws {Error} When parameter validation fails
     * @throws {APIError} When radio settings update fails
     * 
     * @example
     * ```typescript
     * // Set 2.4GHz radio to channel 6 with high power
     * await client.set_ap_radiosettings(
     *   '507f1f77bcf86cd799439011',
     *   'ng',
     *   6,
     *   20,
     *   'auto',
     *   'high'
     * );
     * 
     * // Set 5GHz radio to channel 36 with medium power
     * await client.set_ap_radiosettings(
     *   '507f1f77bcf86cd799439011',
     *   'na',
     *   36,
     *   80,
     *   'auto',
     *   'medium'
     * );
     * ```
     * 
     * @see {@link list_devices} to get AP device IDs
     * @see {@link list_current_channels} to see available channels
     * 
     * PHP: set_ap_radiosettings($ap_id, $radio, $channel, $ht, $tx_power_mode, $tx_power) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/upd/device/' . trim($ap_id), $payload);
     */
    async set_ap_radiosettings(
        ap_id: string,
        radio: string,
        channel: number,
        ht: number,
        tx_power_mode: string,
        tx_power: string,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const payload = {
            radio_table: [{
                radio,
                channel,
                ht,
                tx_power_mode,
                tx_power
            }]
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/upd/device/${ap_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Set access point WLAN group
     * 
     * Assigns an Access Point to a specific WLAN group for radio configuration.
     * This controls which wireless networks are broadcast on which radios.
     * 
     * @param type_id - **Required** Radio type: 'ng' (2.4GHz) or 'na' (5GHz)
     * @param device_id - **Required** Access Point device ID
     * @param group_id - **Required** WLAN group ID to assign
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if WLAN group assignment was successful
     * 
     * @throws {Error} When parameter validation fails
     * @throws {APIError} When WLAN group assignment fails
     * 
     * @example
     * ```typescript
     * // Assign 2.4GHz radio to a WLAN group
     * await client.set_ap_wlangroup(
     *   'ng',
     *   '507f1f77bcf86cd799439011',
     *   'wlan-group-id'
     * );
     * 
     * // Assign 5GHz radio to a different WLAN group
     * await client.set_ap_wlangroup(
     *   'na',
     *   '507f1f77bcf86cd799439011',
     *   'another-wlan-group-id'
     * );
     * ```
     * 
     * @see {@link list_devices} to get AP device IDs
     * @see {@link list_wlan_groups} to get WLAN group IDs
     * 
     * PHP: set_ap_wlangroup($type_id, $device_id, $group_id) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/upd/device/' . trim($device_id), $payload);
     */
    async set_ap_wlangroup(
        type_id: 'ng' | 'na',
        device_id: string,
        group_id: string,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const payload = {
            wlan_overrides: [{
                radio: type_id,
                wlangroup_id_ng: type_id === 'ng' ? group_id : undefined,
                wlangroup_id_na: type_id === 'na' ? group_id : undefined
            }]
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/upd/device/${device_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Set device settings (base method)
     * 
     * Updates device settings using a custom payload.
     * This is a low-level method for advanced device configuration.
     * 
     * @param device_id - **Required** Device ID to update
     * @param payload - **Required** Configuration payload object
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if device settings were updated successfully
     * 
     * @throws {Error} When device_id or payload validation fails
     * @throws {APIError} When device settings update fails
     * 
     * @example
     * ```typescript
     * // Update device settings with custom payload
     * await client.set_device_settings_base(
     *   '507f1f77bcf86cd799439011',
     *   {
     *     name: 'New Device Name',
     *     led_override: 'off'
     *   }
     * );
     * ```
     * 
     * @see {@link list_devices} to get device IDs
     * @see {@link rename_ap} for device naming
     * @see {@link led_override} for LED control
     * 
     * PHP: set_device_settings_base($device_id, $payload) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/device/' . trim($device_id), $payload);
     */
    async set_device_settings_base(
        device_id: string,
        payload: any,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!device_id || typeof device_id !== 'string') {
            throw new Error('Device ID is required and must be a string');
        }

        if (!payload || typeof payload !== 'object') {
            throw new Error('Payload is required and must be an object');
        }

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/rest/device/${device_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Set element adoption
     * 
     * Enables or disables automatic device adoption for the site.
     * When enabled, new devices will be automatically adopted.
     * 
     * @param enable - **Required** Whether to enable (true) or disable (false) element adoption
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if element adoption setting was updated successfully
     * 
     * @throws {APIError} When element adoption setting update fails
     * 
     * @example
     * ```typescript
     * // Enable automatic device adoption
     * await client.set_element_adoption(true);
     * 
     * // Disable automatic device adoption
     * await client.set_element_adoption(false);
     * ```
     * 
     * @see {@link adopt_device} for manual device adoption
     * 
     * PHP: set_element_adoption($enable) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/set/setting/element_adopt', $payload);
     */
    async set_element_adoption(enable: boolean, options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            enabled: enable
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: '/api/s/{site}/set/setting/element_adopt',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Start rolling upgrade
     * 
     * Initiates a rolling firmware upgrade for specified device types.
     * Devices will be upgraded automatically in sequence to minimize downtime.
     * 
     * @param payload - Optional array of device types to upgrade (default: ['uap', 'usw', 'ugw', 'uxg'])
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if rolling upgrade was started successfully
     * 
     * @throws {APIError} When rolling upgrade start fails
     * 
     * @example
     * ```typescript
     * // Start rolling upgrade for all device types
     * await client.start_rolling_upgrade();
     * 
     * // Start rolling upgrade for specific device types
     * await client.start_rolling_upgrade(['uap', 'usw']);
     * ```
     * 
     * @see {@link cancel_rolling_upgrade} to cancel ongoing upgrade
     * @see {@link check_firmware_update} to check for available updates
     * 
     * PHP: start_rolling_upgrade($payload = ['uap', 'usw', 'ugw', 'uxg']) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr/set-rollupgrade', $payload);
     */
    async start_rolling_upgrade(
        payload: string[] = ['uap', 'usw', 'ugw', 'uxg'],
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr/set-rollupgrade',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Unset locate access point (deprecated)
     * 
     * @deprecated Use locate_ap() instead
     * 
     * PHP: unset_locate_ap() -> throw new MethodDeprecatedException('Function unset_locate_ap() has been deprecated, use locate_ap() instead.');
     */
    async unset_locate_ap(
        options?: { signal?: AbortSignal }
    ): Promise<never> {
        throw new Error('Function unset_locate_ap() has been deprecated, use locate_ap() instead.');
    }

    /**
     * Upgrade all devices
     * 
     * Initiates firmware upgrade for all devices of a specified type.
     * This upgrades all devices simultaneously rather than in sequence.
     * 
     * @param type - Optional device type to upgrade (default: 'uap')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if upgrade was initiated successfully
     * 
     * @throws {APIError} When device upgrade fails
     * 
     * @example
     * ```typescript
     * // Upgrade all Access Points
     * await client.upgrade_all_devices('uap');
     * 
     * // Upgrade all switches
     * await client.upgrade_all_devices('usw');
     * ```
     * 
     * @see {@link upgrade_device} to upgrade specific devices
     * @see {@link start_rolling_upgrade} for sequential upgrades
     * 
     * PHP: upgrade_all_devices($type = 'uap') -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr/upgrade-all', $payload);
     */
    async upgrade_all_devices(
        type: string = 'uap',
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const payload = {
            type
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr/upgrade-all',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Upgrade device
     * 
     * Initiates firmware upgrade for a specific device.
     * The device will download and install the latest available firmware.
     * 
     * @param mac - **Required** MAC address of the device to upgrade
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if upgrade was initiated successfully
     * 
     * @throws {Error} When MAC address validation fails
     * @throws {APIError} When device upgrade fails
     * 
     * @example
     * ```typescript
     * // Upgrade specific device
     * await client.upgrade_device('aa:bb:cc:dd:ee:ff');
     * ```
     * 
     * @see {@link upgrade_all_devices} to upgrade all devices of a type
     * @see {@link check_firmware_update} to check for available updates
     * 
     * PHP: upgrade_device($mac) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr/upgrade', $payload);
     */
    async upgrade_device(
        mac: string,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!mac || typeof mac !== 'string') {
            throw new Error('MAC address is required and must be a string');
        }

        const payload = {
            mac: mac.toLowerCase()
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr/upgrade',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Upgrade device with external firmware
     * 
     * Upgrades one or more devices using firmware from an external URL.
     * This allows using custom or beta firmware versions.
     * 
     * @param firmware_url - **Required** URL to the firmware file
     * @param macs - **Required** MAC address(es) of device(s) to upgrade
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if external upgrade was initiated successfully
     * 
     * @throws {Error} When firmware_url or MAC address validation fails
     * @throws {APIError} When external upgrade fails
     * 
     * @example
     * ```typescript
     * // Upgrade single device with external firmware
     * await client.upgrade_device_external(
     *   'https://firmware.example.com/device-firmware.bin',
     *   'aa:bb:cc:dd:ee:ff'
     * );
     * 
     * // Upgrade multiple devices with external firmware
     * await client.upgrade_device_external(
     *   'https://firmware.example.com/device-firmware.bin',
     *   ['aa:bb:cc:dd:ee:ff', 'ff:ee:dd:cc:bb:aa']
     * );
     * ```
     * 
     * @warning Use only trusted firmware sources
     * 
     * @see {@link upgrade_device} for standard firmware upgrades
     * @see {@link list_firmware} to see available firmware versions
     * 
     * PHP: upgrade_device_external($firmware_url, $macs) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/cmd/devmgr/upgrade-external', $payload);
     */
    async upgrade_device_external(
        firmware_url: string,
        macs: string | string[],
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!firmware_url || typeof firmware_url !== 'string') {
            throw new Error('Firmware URL is required and must be a string');
        }

        const mac_array = Array.isArray(macs) ? macs : [macs];

        if (mac_array.length === 0) {
            throw new Error('MAC address array cannot be empty');
        }

        const payload = {
            url: firmware_url,
            macs: mac_array.map(mac => mac.toLowerCase())
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/devmgr/upgrade-external',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    // ============================================================================
    // AP GROUP MANAGEMENT METHODS
    // ============================================================================

    /**
     * Create access point group
     * 
     * Creates a new Access Point group for organizing and managing multiple APs together.
     * AP groups allow applying common settings and configurations to multiple devices.
     * 
     * @param group_name - **Required** Name for the new AP group
     * @param device_macs - Optional array of device MAC addresses to include in the group
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if AP group creation was successful
     * 
     * @throws {Error} When group_name validation fails
     * @throws {APIError} When AP group creation fails
     * 
     * @example
     * ```typescript
     * // Create empty AP group
     * await client.create_apgroup('Main Building APs');
     * 
     * // Create AP group with devices
     * await client.create_apgroup('Office APs', [
     *   'aa:bb:cc:dd:ee:ff',
     *   'ff:ee:dd:cc:bb:aa'
     * ]);
     * ```
     * 
     * @see {@link list_apgroups} to list existing AP groups
     * @see {@link edit_apgroup} to modify AP groups
     * @see {@link delete_apgroup} to remove AP groups
     * 
     * PHP: create_apgroup($group_name, $device_macs = []) -> return $this->fetch_results_boolean('/api/s/' . $this->site . '/rest/apgroup', $payload);
     */
    async create_apgroup(group_name: string, device_macs: string[] = [], options?: { signal?: AbortSignal }): Promise<boolean> {
        if (!group_name || typeof group_name !== 'string') {
            throw new Error('Group name is required and must be a string');
        }

        const payload = {
            device_macs: device_macs.map(mac => mac.toLowerCase()),
            name: group_name
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/rest/apgroup',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Delete access point group
     * 
     * Permanently removes an Access Point group from the controller.
     * Devices in the group will be moved to the default group.
     * 
     * @param group_id - **Required** ID of the AP group to delete
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if AP group deletion was successful
     * 
     * @throws {Error} When group_id validation fails
     * @throws {APIError} When AP group deletion fails
     * 
     * @example
     * ```typescript
     * // Delete an AP group
     * await client.delete_apgroup('507f1f77bcf86cd799439011');
     * ```
     * 
     * @warning This operation cannot be undone
     * 
     * @see {@link list_apgroups} to get AP group IDs
     * @see {@link create_apgroup} to create new AP groups
     * 
     * PHP: delete_apgroup($group_id) -> return $this->fetch_results_boolean('/v2/api/site/' . $this->site . '/apgroups/' . trim($group_id));
     */
    async delete_apgroup(group_id: string, options?: { signal?: AbortSignal }): Promise<boolean> {
        if (!group_id || typeof group_id !== 'string') {
            throw new Error('Group ID is required and must be a string');
        }

        return await this.makeRequest<boolean>({
            method: 'DELETE',
            url: `/v2/api/site/{site}/apgroups/${group_id.trim()}`,
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Edit access point group
     * 
     * Updates an existing Access Point group with new name and device assignments.
     * This allows modifying group membership and properties.
     * 
     * @param group_id - **Required** ID of the AP group to edit
     * @param group_name - **Required** New name for the AP group
     * @param device_macs - **Required** Array of device MAC addresses to include in the group
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to the updated AP group data
     * 
     * @throws {Error} When parameter validation fails
     * @throws {APIError} When AP group edit fails
     * 
     * @example
     * ```typescript
     * // Update AP group name and devices
     * await client.edit_apgroup(
     *   '507f1f77bcf86cd799439011',
     *   'Updated Office APs',
     *   ['aa:bb:cc:dd:ee:ff', 'ff:ee:dd:cc:bb:aa']
     * );
     * ```
     * 
     * @see {@link list_apgroups} to get AP group IDs
     * @see {@link create_apgroup} to create new AP groups
     * @see {@link delete_apgroup} to remove AP groups
     * 
     * PHP: edit_apgroup($group_id, $group_name, $device_macs) -> return $this->fetch_results('/v2/api/site/' . $this->site . '/apgroups/' . trim($group_id), $payload);
     */
    async edit_apgroup(
        group_id: string,
        group_name: string,
        device_macs: string[],
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        if (!group_id || typeof group_id !== 'string') {
            throw new Error('Group ID is required and must be a string');
        }

        if (!group_name || typeof group_name !== 'string') {
            throw new Error('Group name is required and must be a string');
        }

        if (!Array.isArray(device_macs)) {
            throw new Error('Device MACs must be an array');
        }

        const payload = {
            _id: group_id,
            attr_no_delete: true,
            attr_hidden_id: 'default',
            name: group_name,
            device_macs: device_macs.map(mac => mac.toLowerCase())
        };

        return await this.makeRequest<any>({
            method: 'PUT',
            url: `/v2/api/site/{site}/apgroups/${group_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        });
    }
}