/**
 * Generated API methods from PHP UniFi API client
 * This file contains the core UniFi API methods from the original PHP client
 * Auto-generated - do not edit manually
 */

import { HTTPClient } from '../http/HTTPClient';
import { APIResponse } from '../types/api';
import { RequestOptions } from '../types/config';
import { 
  UniFiNetwork, 
  NetworkConfig, 
  UniFiSite, 
  SystemInfo, 
  UniFiEvent, 
  UniFiAlarm, 
  HealthMetric, 
  DPIStats,
  UniFiDevice,
  UniFiClient,
  UniFiWlan,
  WlanConfig,
  UniFiUserGroup,
  UserGroupConfig,
  UniFiFirewallGroup,
  FirewallGroupConfig,
  UniFiTag,
  TagConfig,
  UniFiVoucher,
  VoucherConfig,
  GuestAuthorizationConfig,
  ClientConfig,
  DeviceConfig,
  UniFiPortConfig,
  UniFiRoute,
  UniFiDynamicDns,
  UniFiCountryCode,
  UniFiSpectrumScan,
  UniFiNeighborAp,
  UniFiRogueAp,
  UniFiReport,
  UniFiSetting,
  AdvancedAdoptConfig,
  DeviceMigrationConfig
} from './types';

export class GeneratedAPIMethods {
  constructor(private httpClient: HTTPClient) {}

  /**
   * Substitutes site placeholder in URL
   * @protected
   */
  protected substituteUrl(url: string, site: string = 'default'): string {
    return url.replace('{site}', site);
  }

  /**
   * Makes a request with site substitution
   * @protected
   */
  protected async makeRequest<T>(config: any, site: string = 'default'): Promise<T> {
    const substitutedConfig = {
      ...config,
      url: this.substituteUrl(config.url, site)
    };
    const response = await this.httpClient.request<T>(substitutedConfig);
    return response.data;
  }

  // Authentication methods
  /**
   * Authenticates with the UniFi controller
   * 
   * @param options - Request options
   * @param options.signal - AbortSignal for request cancellation
   * @returns Promise resolving to true when login is successful
   * @throws {AuthenticationError} When credentials are invalid
   */
  async login(options?: { signal?: AbortSignal }): Promise<boolean> {
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/login',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  /**
   * Logs out from the UniFi controller
   * 
   * @param options - Request options
   * @param options.signal - AbortSignal for request cancellation
   * @returns Promise resolving to true when logout is successful
   */
  async logout(options?: { signal?: AbortSignal }): Promise<boolean> {
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/logout',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Guest management methods
  /**
   * Authorizes a guest device for network access
   * 
   * @param mac - MAC address of the guest device (format: 'aa:bb:cc:dd:ee:ff')
   * @param minutes - Duration of access in minutes
   * @param up - Upload bandwidth limit in Kbps (optional)
   * @param down - Download bandwidth limit in Kbps (optional)
   * @param megabytes - Data transfer limit in megabytes (optional)
   * @param apMac - MAC address of the access point (optional)
   * @param options - Request options
   * @param options.signal - AbortSignal for request cancellation
   * @returns Promise resolving to true when authorization is successful
   * @throws {Error} When MAC address is invalid or missing
   * 
   * @example
   * ```typescript
   * // Authorize guest for 60 minutes with 10 Mbps down, 5 Mbps up
   * await client.authorizeGuest('aa:bb:cc:dd:ee:ff', 60, 5000, 10000);
   * ```
   */
  async authorizeGuest(mac: string, minutes: number, up?: number, down?: number, megabytes?: number, apMac?: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    if (typeof minutes !== 'number') {
      throw new Error('Parameter minutes must be a number');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/stamgr',
      data: {
        cmd: 'authorize-guest',
        mac,
        minutes,
        ...(up !== undefined && { up }),
        ...(down !== undefined && { down }),
        ...(megabytes !== undefined && { bytes: megabytes }),
        ...(apMac !== undefined && { ap_mac: apMac }),
      },
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Revokes guest authorization for a device
   * 
   * @param mac - MAC address of the guest device (format: 'aa:bb:cc:dd:ee:ff')
   * @param options - Request options
   * @param options.signal - AbortSignal for request cancellation
   * @returns Promise resolving to true when deauthorization is successful
   * @throws {Error} When MAC address is invalid or missing
   * 
   * @example
   * ```typescript
   * await client.unauthorizeGuest('aa:bb:cc:dd:ee:ff');
   * ```
   */
  async unauthorizeGuest(mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/stamgr',
      data: {
        cmd: 'unauthorize-guest',
        mac,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Client management methods
  /**
   * Forces a client device to reconnect
   * 
   * Disconnects the specified client, forcing it to reconnect and re-authenticate.
   * Useful for applying new settings or troubleshooting connectivity issues.
   * 
   * @param mac - MAC address of the client device (format: 'aa:bb:cc:dd:ee:ff')
   * @param options - Request options
   * @param options.signal - AbortSignal for request cancellation
   * @returns Promise resolving to true when reconnection is initiated
   * @throws {Error} When MAC address is invalid or missing
   * 
   * @example
   * ```typescript
   * await client.reconnectSta('aa:bb:cc:dd:ee:ff');
   * ```
   */
  async reconnectSta(mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/stamgr',
      data: {
        cmd: 'kick-sta',
        mac,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  /**
   * Blocks a client device from network access
   * 
   * @param mac - MAC address of the client device (format: 'aa:bb:cc:dd:ee:ff')
   * @param options - Request options
   * @param options.signal - AbortSignal for request cancellation
   * @returns Promise resolving to true when blocking is successful
   * @throws {Error} When MAC address is invalid or missing
   * 
   * @example
   * ```typescript
   * await client.blockSta('aa:bb:cc:dd:ee:ff');
   * ```
   */
  async blockSta(mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/stamgr',
      data: {
        cmd: 'block-sta',
        mac,
      },
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Unblocks a previously blocked client device
   * 
   * @param mac - MAC address of the client device (format: 'aa:bb:cc:dd:ee:ff')
   * @param options - Request options
   * @param options.signal - AbortSignal for request cancellation
   * @returns Promise resolving to true when unblocking is successful
   * @throws {Error} When MAC address is invalid or missing
   * 
   * @example
   * ```typescript
   * await client.unblockSta('aa:bb:cc:dd:ee:ff');
   * ```
   */
  async unblockSta(mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/stamgr',
      data: {
        cmd: 'unblock-sta',
        mac,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  /**
   * Removes a client device from the controller's memory
   * 
   * Forgets all information about the specified client device, including
   * statistics and connection history.
   * 
   * @param mac - MAC address of the client device (format: 'aa:bb:cc:dd:ee:ff')
   * @param options - Request options
   * @param options.signal - AbortSignal for request cancellation
   * @returns Promise resolving to true when forgetting is successful
   * @throws {Error} When MAC address is invalid or missing
   * 
   * @example
   * ```typescript
   * await client.forgetSta('aa:bb:cc:dd:ee:ff');
   * ```
   */
  async forgetSta(mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/stamgr',
      data: {
        cmd: 'forget-sta',
        mac,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Statistics and listing methods
  /**
   * Lists connected client devices
   * 
   * @param clientMac - Optional MAC address to get specific client (format: 'aa:bb:cc:dd:ee:ff')
   * @param options - Request options
   * @param options.signal - AbortSignal for request cancellation
   * @returns Promise resolving to array of client devices
   * 
   * @example
   * ```typescript
   * // Get all clients
   * const allClients = await client.listUsers();
   * 
   * // Get specific client
   * const specificClient = await client.listUsers('aa:bb:cc:dd:ee:ff');
   * ```
   */
  async listUsers(clientMac?: string, options?: RequestOptions): Promise<UniFiClient[]> {
    return await this.makeRequest<UniFiClient[]>({
      method: 'GET',
      url: clientMac ? `/api/s/{site}/stat/user/${clientMac}` : '/api/s/{site}/stat/user',
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Lists UniFi devices (access points, switches, gateways)
   * 
   * @param apMac - Optional device MAC address to get specific device (format: 'aa:bb:cc:dd:ee:ff')
   * @param options - Request options
   * @param options.signal - AbortSignal for request cancellation
   * @returns Promise resolving to array of UniFi devices
   * 
   * @example
   * ```typescript
   * // Get all devices
   * const allDevices = await client.listDevices();
   * 
   * // Get specific device
   * const specificDevice = await client.listDevices('aa:bb:cc:dd:ee:ff');
   * ```
   */
  async listDevices(apMac?: string, options?: RequestOptions): Promise<UniFiDevice[]> {
    return await this.makeRequest<UniFiDevice[]>({
      method: 'GET',
      url: apMac ? `/api/s/{site}/stat/device/${apMac}` : '/api/s/{site}/stat/device',
      ...(options?.signal && { signal: options.signal }),
    });
  }

  /**
   * Lists UniFi devices with basic information only
   * 
   * Returns a simplified view of devices with essential information only,
   * which is faster than the full device listing.
   * 
   * @param options - Request options
   * @param options.signal - AbortSignal for request cancellation
   * @returns Promise resolving to array of UniFi devices with basic info
   * 
   * @example
   * ```typescript
   * const devices = await client.listDevicesBasic();
   * console.log(`Found ${devices.length} devices`);
   * ```
   */
  async listDevicesBasic(options?: RequestOptions): Promise<UniFiDevice[]> {
    return await this.makeRequest<UniFiDevice[]>({
      method: 'GET',
      url: '/api/s/{site}/stat/device-basic',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listSites(options?: { signal?: AbortSignal }): Promise<UniFiSite[]> {
    return await this.makeRequest<UniFiSite[]>({
      method: 'GET',
      url: '/api/self/sites',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statSites(options?: { signal?: AbortSignal }): Promise<UniFiSite[]> {
    return await this.makeRequest<UniFiSite[]>({
      method: 'GET',
      url: '/api/stat/sites',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statSysinfo(options?: { signal?: AbortSignal }): Promise<SystemInfo> {
    return await this.makeRequest<SystemInfo>({
      method: 'GET',
      url: '/api/s/{site}/stat/sysinfo',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statStatus(options?: { signal?: AbortSignal }): Promise<boolean> {
    return await this.makeRequest<boolean>({
      method: 'GET',
      url: '/api/s/{site}/stat/status',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statFullStatus(options?: { signal?: AbortSignal }): Promise<any> {
    return await this.makeRequest<any>({
      method: 'GET',
      url: '/api/s/{site}/stat/full-status',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // WLAN management methods
  async listWlanconf(wlanId?: string, options?: RequestOptions): Promise<UniFiWlan[]> {
    return await this.makeRequest<UniFiWlan[]>({
      method: 'GET',
      url: wlanId ? `/api/s/{site}/rest/wlanconf/${wlanId}` : '/api/s/{site}/rest/wlanconf',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async createWlan(name: string, xPassphrase: string, usergroupId: string, wlangroupId: string, enabled?: boolean, hideSsid?: boolean, isGuest?: boolean, security?: string, wpaMode?: string, wpaEnc?: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!name || typeof name !== 'string') {
      throw new Error('Parameter name must be a non-empty string');
    }
    if (!xPassphrase || typeof xPassphrase !== 'string') {
      throw new Error('Parameter xPassphrase must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/rest/wlanconf',
      data: {
        name,
        x_passphrase: xPassphrase,
        usergroup_id: usergroupId,
        wlangroup_id: wlangroupId,
        enabled: enabled !== undefined ? enabled : true,
        hide_ssid: hideSsid !== undefined ? hideSsid : false,
        is_guest: isGuest !== undefined ? isGuest : false,
        security: security || 'wpapsk',
        wpa_mode: wpaMode || 'wpa2',
        wpa_enc: wpaEnc || 'ccmp',
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setWlansettingsBase(wlanId: string, payload: any, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!wlanId || typeof wlanId !== 'string') {
      throw new Error('Parameter wlanId must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/wlanconf/${wlanId}`,
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setWlansettings(wlanId: string, xPassphrase: string, name?: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!wlanId || typeof wlanId !== 'string') {
      throw new Error('Parameter wlanId must be a non-empty string');
    }
    if (!xPassphrase || typeof xPassphrase !== 'string') {
      throw new Error('Parameter xPassphrase must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/wlanconf/${wlanId}`,
      data: {
        x_passphrase: xPassphrase,
        ...(name && { name }),
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async disableWlan(wlanId: string, disable: boolean, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!wlanId || typeof wlanId !== 'string') {
      throw new Error('Parameter wlanId must be a non-empty string');
    }
    if (typeof disable !== 'boolean') {
      throw new Error('Parameter disable must be a boolean');
    }
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/wlanconf/${wlanId}`,
      data: {
        enabled: !disable,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async deleteWlan(wlanId: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!wlanId || typeof wlanId !== 'string') {
      throw new Error('Parameter wlanId must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'DELETE',
      url: `/api/s/{site}/rest/wlanconf/${wlanId}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Network management methods
  async listNetworkconf(networkId?: string, options?: { signal?: AbortSignal }): Promise<UniFiNetwork[]> {
    return await this.makeRequest<UniFiNetwork[]>({
      method: 'GET',
      url: networkId ? `/api/s/{site}/rest/networkconf/${networkId}` : '/api/s/{site}/rest/networkconf',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async createNetwork(config: NetworkConfig, options?: { signal?: AbortSignal }): Promise<UniFiNetwork> {
    if (!config || typeof config !== 'object') {
      throw new Error('Parameter config must be a valid NetworkConfig object');
    }
    if (!config.name || typeof config.name !== 'string') {
      throw new Error('Network name is required and must be a string');
    }
    if (!config.purpose || typeof config.purpose !== 'string') {
      throw new Error('Network purpose is required and must be a string');
    }
    
    return await this.makeRequest<UniFiNetwork>({
      method: 'POST',
      url: '/api/s/{site}/rest/networkconf',
      data: config,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setNetworksettingsBase(networkId: string, config: Partial<NetworkConfig>, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!networkId || typeof networkId !== 'string') {
      throw new Error('Parameter networkId must be a non-empty string');
    }
    if (!config || typeof config !== 'object') {
      throw new Error('Parameter config must be a valid NetworkConfig object');
    }
    
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/networkconf/${networkId}`,
      data: config,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async deleteNetwork(networkId: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!networkId || typeof networkId !== 'string') {
      throw new Error('Parameter networkId must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'DELETE',
      url: `/api/s/{site}/rest/networkconf/${networkId}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Additional network management methods
  async listNetworkgroups(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/list/networkgroup',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listPortconf(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/rest/portconf',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setPortconf(portId: string, config: any, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!portId || typeof portId !== 'string') {
      throw new Error('Parameter portId must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/portconf/${portId}`,
      data: config,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Device management methods
  async adoptDevice(macs: string | string[], options?: { signal?: AbortSignal }): Promise<boolean> {
    const macArray = Array.isArray(macs) ? macs : [macs];
    if (!Array.isArray(macArray)) {
      throw new Error('Parameter macs must be an array');
    }
    
    // Validate MAC addresses
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    for (const mac of macArray) {
      if (!mac || typeof mac !== 'string' || !macRegex.test(mac)) {
        throw new Error('Invalid MAC address');
      }
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/devmgr',
      data: {
        cmd: 'adopt',
        macs: macArray,
      },
      ...(options?.signal && { signal: options.signal }),
    });
  }

  async restartDevice(macs: string | string[], rebootType?: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    const macArray = Array.isArray(macs) ? macs : [macs];
    if (!Array.isArray(macArray)) {
      throw new Error('Parameter macs must be an array');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/devmgr',
      data: {
        cmd: 'restart',
        macs: macArray,
        reboot_type: rebootType || 'soft',
      },
      ...(options?.signal && { signal: options.signal }),
    });
  }

  async forceProvision(mac: string | string[], options?: { signal?: AbortSignal }): Promise<boolean> {
    const macArray = Array.isArray(mac) ? mac : [mac];
    if (!Array.isArray(macArray)) {
      throw new Error('Parameter mac must be an array');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/devmgr',
      data: {
        cmd: 'force-provision',
        macs: macArray,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async disableAp(apId: string, disable: boolean, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!apId || typeof apId !== 'string') {
      throw new Error('Parameter apId must be a non-empty string');
    }
    if (typeof disable !== 'boolean') {
      throw new Error('Parameter disable must be a boolean');
    }
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/device/${apId}`,
      data: {
        disabled: disable,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async ledOverride(deviceId: string, overrideMode: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!deviceId || typeof deviceId !== 'string') {
      throw new Error('Parameter deviceId must be a non-empty string');
    }
    if (!overrideMode || typeof overrideMode !== 'string') {
      throw new Error('Parameter overrideMode must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/device/${deviceId}`,
      data: {
        led_override: overrideMode,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async locateAp(mac: string, enable: boolean, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    if (typeof enable !== 'boolean') {
      throw new Error('Parameter enable must be a boolean');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/devmgr',
      data: {
        cmd: enable ? 'set-locate' : 'unset-locate',
        mac,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async siteLeds(enable: boolean, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (typeof enable !== 'boolean') {
      throw new Error('Parameter enable must be a boolean');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/set/setting/mgmt',
      data: {
        led_enabled: enable,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Site management methods
  async createSite(description: string, options?: { signal?: AbortSignal }): Promise<UniFiSite> {
    if (!description || typeof description !== 'string') {
      throw new Error('Parameter description must be a non-empty string');
    }
    return await this.makeRequest<UniFiSite>({
      method: 'POST',
      url: '/api/s/{site}/cmd/sitemgr',
      data: {
        cmd: 'add-site',
        desc: description,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async deleteSite(siteId: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!siteId || typeof siteId !== 'string') {
      throw new Error('Parameter siteId must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/sitemgr',
      data: {
        cmd: 'delete-site',
        site: siteId,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Additional site management and statistics methods
  async setSiteName(siteName: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!siteName || typeof siteName !== 'string') {
      throw new Error('Parameter siteName must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/sitemgr',
      data: {
        cmd: 'update-site',
        desc: siteName,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setSiteCountry(countryId: number, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (typeof countryId !== 'number') {
      throw new Error('Parameter countryId must be a number');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/set/setting/country',
      data: {
        country: countryId,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setSiteLocale(timezone: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!timezone || typeof timezone !== 'string') {
      throw new Error('Parameter timezone must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/set/setting/locale',
      data: {
        timezone,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setSiteSnmp(community: string, contact: string, location: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!community || typeof community !== 'string') {
      throw new Error('Parameter community must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/set/setting/snmp',
      data: {
        community,
        contact: contact || '',
        location: location || '',
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setSiteMgmt(autoUpgrade: boolean, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (typeof autoUpgrade !== 'boolean') {
      throw new Error('Parameter autoUpgrade must be a boolean');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/set/setting/mgmt',
      data: {
        auto_upgrade: autoUpgrade,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setSiteNtp(ntpServer1: string, ntpServer2?: string, ntpServer3?: string, ntpServer4?: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!ntpServer1 || typeof ntpServer1 !== 'string') {
      throw new Error('Parameter ntpServer1 must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/set/setting/ntp',
      data: {
        ntp_server_1: ntpServer1,
        ...(ntpServer2 && { ntp_server_2: ntpServer2 }),
        ...(ntpServer3 && { ntp_server_3: ntpServer3 }),
        ...(ntpServer4 && { ntp_server_4: ntpServer4 }),
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setSiteConnectivity(enabled: boolean, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (typeof enabled !== 'boolean') {
      throw new Error('Parameter enabled must be a boolean');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/set/setting/connectivity',
      data: {
        enabled,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Event and alarm methods
  async listEvents(historyhours?: number, start?: number, limit?: number, options?: { signal?: AbortSignal }): Promise<UniFiEvent[]> {
    const params: any = {};
    if (historyhours !== undefined) params.historyhours = historyhours;
    if (start !== undefined) params.start = start;
    if (limit !== undefined) params.limit = limit;
    
    return await this.makeRequest<UniFiEvent[]>({
      method: 'GET',
      url: '/api/s/{site}/stat/event',
      params,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listAlarms(archived?: boolean, options?: { signal?: AbortSignal }): Promise<UniFiAlarm[]> {
    const params: any = {};
    if (archived !== undefined) params.archived = archived;
    
    return await this.makeRequest<UniFiAlarm[]>({
      method: 'GET',
      url: '/api/s/{site}/list/alarm',
      params,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async countAlarms(archived?: boolean, options?: { signal?: AbortSignal }): Promise<{ count: number }> {
    const params: any = {};
    if (archived !== undefined) params.archived = archived;
    
    return await this.makeRequest<{ count: number }>({
      method: 'GET',
      url: '/api/s/{site}/cnt/alarm',
      params,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async archiveAlarm(alarmId?: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/evtmgr',
      data: {
        cmd: 'archive-all-alarms',
        ...(alarmId && { _id: alarmId }),
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Additional monitoring and statistics methods
  async statHealth(options?: { signal?: AbortSignal }): Promise<HealthMetric[]> {
    return await this.makeRequest<HealthMetric[]>({
      method: 'GET',
      url: '/api/s/{site}/stat/health',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statDashboard(scale?: string, options?: { signal?: AbortSignal }): Promise<any> {
    const params: any = {};
    if (scale) params.scale = scale;
    
    return await this.makeRequest<any>({
      method: 'GET',
      url: '/api/s/{site}/stat/dashboard',
      params,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statDpi(type?: string, options?: { signal?: AbortSignal }): Promise<DPIStats[]> {
    const params: any = {};
    if (type) params.type = type;
    
    return await this.makeRequest<DPIStats[]>({
      method: 'GET',
      url: '/api/s/{site}/stat/dpi',
      params,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statSpeedtest(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/stat/speedtest',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statPortforwardStats(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/stat/portforward_stats',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statDynamicDns(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/stat/dynamicdns',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statRouting(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/stat/routing',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statCurrentChannels(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/stat/current-channel',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statSpectrumscan(mac: string, options?: { signal?: AbortSignal }): Promise<any[]> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: `/api/s/{site}/stat/spectrumscan/${mac}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statNeighborAp(hiddenAps?: boolean, options?: { signal?: AbortSignal }): Promise<any[]> {
    const params: any = {};
    if (hiddenAps !== undefined) params.includeHidden = hiddenAps;
    
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/stat/neighbour_ap',
      params,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statRogueAp(within?: number, options?: { signal?: AbortSignal }): Promise<any[]> {
    const params: any = {};
    if (within !== undefined) params.within = within;
    
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/stat/rogue_ap',
      params,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statKnownRogueAp(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/rest/rogue_ap',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statReport(type: string, options?: { signal?: AbortSignal }): Promise<any[]> {
    if (!type || typeof type !== 'string') {
      throw new Error('Parameter type must be a non-empty string');
    }
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: `/api/s/{site}/stat/report/${type}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Firmware and update methods
  async checkControllerUpdate(options?: { signal?: AbortSignal }): Promise<any> {
    return await this.makeRequest<any>({
      method: 'GET',
      url: '/api/s/{site}/stat/fwupdate',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async checkFirmwareUpdate(options?: { signal?: AbortSignal }): Promise<boolean> {
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/devmgr',
      data: {
        cmd: 'check-firmware-update',
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async upgradeDevice(mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/devmgr',
      data: {
        cmd: 'upgrade',
        mac,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async upgradeDeviceExternal(firmwareUrl: string, macs: string | string[], options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!firmwareUrl || typeof firmwareUrl !== 'string') {
      throw new Error('Parameter firmwareUrl must be a non-empty string');
    }
    const macArray = Array.isArray(macs) ? macs : [macs];
    if (!Array.isArray(macArray)) {
      throw new Error('Parameter macs must be an array');
    }
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/devmgr',
      data: {
        cmd: 'upgrade-external',
        url: firmwareUrl,
        macs: macArray,
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Voucher methods
  async statVoucher(createTime?: number, options?: { signal?: AbortSignal }): Promise<any> {
    return await this.makeRequest<any>({
      method: 'GET',
      url: '/api/s/{site}/stat/voucher',
      ...(createTime !== undefined && { data: { create_time: createTime } }),
      ...(options?.signal && { signal: options.signal }),
    });
    
  }



  // Statistics methods - Time series data
  async stat5minutesSite(start?: number, end?: number, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || Date.now();
    const startTime = start || endTime - (12 * 3600 * 1000);
    const attributes = attribs || ['bytes', 'wan-tx_bytes', 'wan-rx_bytes', 'wlan_bytes', 'num_sta', 'lan-num_sta', 'wlan-num_sta', 'time'];
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/5minutes.site',
      data: {
        attrs: attributes,
        start: startTime,
        end: endTime
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statHourlySite(start?: number, end?: number, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || Date.now();
    const startTime = start || endTime - (7 * 24 * 3600 * 1000);
    const attributes = attribs || ['bytes', 'wan-tx_bytes', 'wan-rx_bytes', 'wlan_bytes', 'num_sta', 'lan-num_sta', 'wlan-num_sta', 'time'];
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/hourly.site',
      data: {
        attrs: attributes,
        start: startTime,
        end: endTime
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statDailySite(start?: number, end?: number, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || (Date.now() - (Date.now() % 3600000));
    const startTime = start || endTime - (52 * 7 * 24 * 3600 * 1000);
    const attributes = attribs || ['bytes', 'wan-tx_bytes', 'wan-rx_bytes', 'wlan_bytes', 'num_sta', 'lan-num_sta', 'wlan-num_sta', 'time'];
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/daily.site',
      data: {
        attrs: attributes,
        start: startTime,
        end: endTime
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statMonthlySite(start?: number, end?: number, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || (Date.now() - (Date.now() % 3600000));
    const startTime = start || endTime - (52 * 7 * 24 * 3600 * 1000);
    const attributes = attribs || ['bytes', 'wan-tx_bytes', 'wan-rx_bytes', 'wlan_bytes', 'num_sta', 'lan-num_sta', 'wlan-num_sta', 'time'];
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/monthly.site',
      data: {
        attrs: attributes,
        start: startTime,
        end: endTime
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // AP Statistics methods
  async stat5minutesAps(start?: number, end?: number, mac?: string, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || Date.now();
    const startTime = start || endTime - (12 * 3600 * 1000);
    const attributes = attribs || ['bytes', 'num_sta', 'time'];
    
    const payload: any = {
      attrs: attributes,
      start: startTime,
      end: endTime
    };
    
    if (mac) payload.mac = mac.toLowerCase();
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/5minutes.ap',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statHourlyAps(start?: number, end?: number, mac?: string, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || Date.now();
    const startTime = start || endTime - (7 * 24 * 3600 * 1000);
    const attributes = attribs || ['bytes', 'num_sta', 'time'];
    
    const payload: any = {
      attrs: attributes,
      start: startTime,
      end: endTime
    };
    
    if (mac) payload.mac = mac.toLowerCase();
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/hourly.ap',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statDailyAps(start?: number, end?: number, mac?: string, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || Date.now();
    const startTime = start || endTime - (7 * 24 * 3600 * 1000);
    const attributes = attribs || ['bytes', 'num_sta', 'time'];
    
    const payload: any = {
      attrs: attributes,
      start: startTime,
      end: endTime
    };
    
    if (mac) payload.mac = mac.toLowerCase();
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/daily.ap',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statMonthlyAps(start?: number, end?: number, mac?: string, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || Date.now();
    const startTime = start || endTime - (52 * 7 * 24 * 3600 * 1000);
    const attributes = attribs || ['bytes', 'num_sta', 'time'];
    
    const payload: any = {
      attrs: attributes,
      start: startTime,
      end: endTime
    };
    
    if (mac) payload.mac = mac.toLowerCase();
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/monthly.ap',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // User/Client Statistics methods
  async stat5minutesUser(mac?: string, start?: number, end?: number, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || Date.now();
    const startTime = start || endTime - (12 * 3600 * 1000);
    const attributes = attribs || ['time', 'rx_bytes', 'tx_bytes'];
    
    const payload: any = {
      attrs: attributes,
      start: startTime,
      end: endTime
    };
    
    if (mac) payload.mac = mac.toLowerCase();
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/5minutes.user',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statHourlyUser(mac?: string, start?: number, end?: number, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || Date.now();
    const startTime = start || endTime - (7 * 24 * 3600 * 1000);
    const attributes = attribs || ['time', 'rx_bytes', 'tx_bytes'];
    
    const payload: any = {
      attrs: attributes,
      start: startTime,
      end: endTime
    };
    
    if (mac) payload.mac = mac.toLowerCase();
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/hourly.user',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statDailyUser(mac?: string, start?: number, end?: number, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || Date.now();
    const startTime = start || endTime - (7 * 24 * 3600 * 1000);
    const attributes = attribs || ['time', 'rx_bytes', 'tx_bytes'];
    
    const payload: any = {
      attrs: attributes,
      start: startTime,
      end: endTime
    };
    
    if (mac) payload.mac = mac.toLowerCase();
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/daily.user',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statMonthlyUser(mac?: string, start?: number, end?: number, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || Date.now();
    const startTime = start || endTime - (13 * 7 * 24 * 3600 * 1000);
    const attributes = attribs || ['time', 'rx_bytes', 'tx_bytes'];
    
    const payload: any = {
      attrs: attributes,
      start: startTime,
      end: endTime
    };
    
    if (mac) payload.mac = mac.toLowerCase();
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/monthly.user',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Gateway Statistics methods
  async stat5minutesGateway(start?: number, end?: number, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || Date.now();
    const startTime = start || endTime - (12 * 3600 * 1000);
    const attributes = attribs || ['time', 'mem', 'cpu', 'loadavg_5'];
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/5minutes.gw',
      data: {
        attrs: attributes,
        start: startTime,
        end: endTime
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statHourlyGateway(start?: number, end?: number, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || Date.now();
    const startTime = start || endTime - (7 * 24 * 3600 * 1000);
    const attributes = attribs || ['time', 'mem', 'cpu', 'loadavg_5'];
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/hourly.gw',
      data: {
        attrs: attributes,
        start: startTime,
        end: endTime
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statDailyGateway(start?: number, end?: number, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || (Date.now() - (Date.now() % 3600000));
    const startTime = start || endTime - (52 * 7 * 24 * 3600 * 1000);
    const attributes = attribs || ['time', 'mem', 'cpu', 'loadavg_5'];
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/daily.gw',
      data: {
        attrs: attributes,
        start: startTime,
        end: endTime
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statMonthlyGateway(start?: number, end?: number, attribs?: string[], options?: { signal?: AbortSignal }): Promise<any[]> {
    const endTime = end || (Date.now() - (Date.now() % 3600000));
    const startTime = start || endTime - (52 * 7 * 24 * 3600 * 1000);
    const attributes = attribs || ['time', 'mem', 'cpu', 'loadavg_5'];
    
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/report/monthly.gw',
      data: {
        attrs: attributes,
        start: startTime,
        end: endTime
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Extended client management methods
  async createUser(mac: string, userGroupId: string, name?: string, note?: string, isGuest?: boolean, isWired?: boolean, options?: { signal?: AbortSignal }): Promise<any> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    if (!userGroupId || typeof userGroupId !== 'string') {
      throw new Error('Parameter userGroupId must be a non-empty string');
    }
    
    const newUser: any = {
      mac: mac.toLowerCase(),
      usergroup_id: userGroupId
    };
    
    if (name) newUser.name = name;
    if (note) newUser.note = note;
    if (isGuest !== undefined) newUser.is_guest = isGuest;
    if (isWired !== undefined) newUser.is_wired = isWired;
    
    return await this.makeRequest<any>({
      method: 'POST',
      url: '/api/s/{site}/group/user',
      data: {
        objects: [{ data: newUser }]
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setStaNote(userId: string, note: string = '', options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Parameter userId must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/upd/user/${userId.trim()}`,
      data: { note },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setStaName(userId: string, name: string = '', options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Parameter userId must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/upd/user/${userId.trim()}`,
      data: { name },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statAllUsers(historyhours: number = 8760, options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/alluser',
      data: {
        type: 'all',
        conn: 'all',
        within: historyhours
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listGuests(within: number = 8760, options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'POST',
      url: '/api/s/{site}/stat/guest',
      data: { within },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listActiveClients(includeTrafficUsage: boolean = true, includeUnifiDevices: boolean = true, options?: { signal?: AbortSignal }): Promise<any[]> {
    const params = new URLSearchParams({
      include_traffic_usage: includeTrafficUsage.toString(),
      include_unifi_devices: includeUnifiDevices.toString()
    });
    
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: `/v2/api/site/{site}/clients/active?${params.toString()}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listClientsHistory(onlyNonBlocked: boolean = true, includeUnifiDevices: boolean = true, withinHours: number = 0, options?: { signal?: AbortSignal }): Promise<any[]> {
    const params = new URLSearchParams({
      only_non_blocked: onlyNonBlocked.toString(),
      include_unifi_devices: includeUnifiDevices.toString(),
      within_hours: withinHours.toString()
    });
    
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: `/v2/api/site/{site}/clients/history?${params.toString()}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async statClient(mac: string, options?: { signal?: AbortSignal }): Promise<any> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    
    return await this.makeRequest<any>({
      method: 'GET',
      url: `/api/s/{site}/stat/user/${mac.toLowerCase().trim()}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Voucher management methods
  async createVoucher(minutes: number, count: number = 1, quota: number = 0, note?: string, up?: number, down?: number, megabytes?: number, options?: { signal?: AbortSignal }): Promise<any> {
    if (typeof minutes !== 'number') {
      throw new Error('Parameter minutes must be a number');
    }
    
    const payload: any = {
      cmd: 'create-voucher',
      expire: minutes,
      n: count,
      quota: quota
    };
    
    if (note) payload.note = note.trim();
    if (up !== undefined) payload.up = up;
    if (down !== undefined) payload.down = down;
    if (megabytes !== undefined) payload.bytes = megabytes;
    
    return await this.makeRequest<any>({
      method: 'POST',
      url: '/api/s/{site}/cmd/hotspot',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async revokeVoucher(voucherId: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!voucherId || typeof voucherId !== 'string') {
      throw new Error('Parameter voucherId must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/hotspot',
      data: {
        cmd: 'delete-voucher',
        _id: voucherId
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Custom API request method
  async customApiRequest(path: string, method?: string, payload?: any, returnType?: string, options?: { signal?: AbortSignal }): Promise<any> {
    if (!path || typeof path !== 'string') {
      throw new Error('Parameter path must be a non-empty string');
    }
    return await this.makeRequest<any>({
      method: (method || 'GET') as any,
      url: path,
      ...(payload && { data: payload }),
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // User group management methods
  async listUsergroups(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/list/usergroup',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async createUsergroup(groupName: string, groupDn: number = -1, groupUp: number = -1, options?: { signal?: AbortSignal }): Promise<any> {
    if (!groupName || typeof groupName !== 'string') {
      throw new Error('Parameter groupName must be a non-empty string');
    }
    
    return await this.makeRequest<any>({
      method: 'POST',
      url: '/api/s/{site}/rest/usergroup',
      data: {
        name: groupName,
        qos_rate_max_down: groupDn,
        qos_rate_max_up: groupUp
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async editUsergroup(groupId: string, siteId: string, groupName: string, groupDn: number = -1, groupUp: number = -1, options?: { signal?: AbortSignal }): Promise<any> {
    if (!groupId || typeof groupId !== 'string') {
      throw new Error('Parameter groupId must be a non-empty string');
    }
    
    return await this.makeRequest<any>({
      method: 'PUT',
      url: `/api/s/{site}/rest/usergroup/${groupId.trim()}`,
      data: {
        _id: groupId,
        name: groupName,
        qos_rate_max_down: groupDn,
        qos_rate_max_up: groupUp,
        site_id: siteId
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async deleteUsergroup(groupId: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!groupId || typeof groupId !== 'string') {
      throw new Error('Parameter groupId must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'DELETE',
      url: `/api/s/{site}/rest/usergroup/${groupId.trim()}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setUsergroup(clientId: string, groupId: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!clientId || typeof clientId !== 'string') {
      throw new Error('Parameter clientId must be a non-empty string');
    }
    if (!groupId || typeof groupId !== 'string') {
      throw new Error('Parameter groupId must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/upd/user/${clientId.trim()}`,
      data: { usergroup_id: groupId },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Firewall management methods
  async listFirewallgroups(groupId?: string, options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: `/api/s/{site}/rest/firewallgroup/${groupId ? groupId.trim() : ''}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async createFirewallgroup(groupName: string, groupType: 'address-group' | 'ipv6-address-group' | 'port-group', groupMembers: string[] = [], options?: { signal?: AbortSignal }): Promise<any> {
    if (!groupName || typeof groupName !== 'string') {
      throw new Error('Parameter groupName must be a non-empty string');
    }
    if (!['address-group', 'ipv6-address-group', 'port-group'].includes(groupType)) {
      throw new Error('Parameter groupType must be one of: address-group, ipv6-address-group, port-group');
    }
    
    return await this.makeRequest<any>({
      method: 'POST',
      url: '/api/s/{site}/rest/firewallgroup',
      data: {
        name: groupName,
        group_type: groupType,
        group_members: groupMembers
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async editFirewallgroup(groupId: string, siteId: string, groupName: string, groupType: 'address-group' | 'ipv6-address-group' | 'port-group', groupMembers: string[] = [], options?: { signal?: AbortSignal }): Promise<any> {
    if (!groupId || typeof groupId !== 'string') {
      throw new Error('Parameter groupId must be a non-empty string');
    }
    if (!['address-group', 'ipv6-address-group', 'port-group'].includes(groupType)) {
      throw new Error('Parameter groupType must be one of: address-group, ipv6-address-group, port-group');
    }
    
    return await this.makeRequest<any>({
      method: 'PUT',
      url: `/api/s/{site}/rest/firewallgroup/${groupId.trim()}`,
      data: {
        _id: groupId,
        name: groupName,
        group_type: groupType,
        group_members: groupMembers,
        site_id: siteId
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async deleteFirewallgroup(groupId: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!groupId || typeof groupId !== 'string') {
      throw new Error('Parameter groupId must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'DELETE',
      url: `/api/s/{site}/rest/firewallgroup/${groupId.trim()}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listFirewallrules(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/rest/firewallrule',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Device tag management methods
  async listTags(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/rest/tag',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async createTag(name: string, macs?: string[], options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!name || typeof name !== 'string') {
      throw new Error('Parameter name must be a non-empty string');
    }
    
    const payload: any = { name };
    if (macs && Array.isArray(macs)) {
      payload.member_table = macs;
    }
    
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/rest/tag',
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setTaggedDevices(macs: string[], tagId: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!Array.isArray(macs)) {
      throw new Error('Parameter macs must be an array');
    }
    if (!tagId || typeof tagId !== 'string') {
      throw new Error('Parameter tagId must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/rest/tag/${tagId}`,
      data: { member_table: macs },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async getTag(tagId: string, options?: { signal?: AbortSignal }): Promise<any> {
    if (!tagId || typeof tagId !== 'string') {
      throw new Error('Parameter tagId must be a non-empty string');
    }
    
    return await this.makeRequest<any>({
      method: 'GET',
      url: `/api/s/{site}/rest/tag/${tagId}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async deleteTag(tagId: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!tagId || typeof tagId !== 'string') {
      throw new Error('Parameter tagId must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'DELETE',
      url: `/api/s/{site}/rest/tag/${tagId}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Advanced device management methods
  async advancedAdoptDevice(mac: string, ip: string, username: string, password: string, url: string, port: number = 22, sshKeyVerify: boolean = true, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/devmgr',
      data: {
        cmd: 'adv-adopt',
        mac: mac.toLowerCase(),
        ip,
        username,
        password,
        url,
        port,
        sshKeyVerify
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async migrateDevice(macs: string | string[], informUrl: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    const macArray = Array.isArray(macs) ? macs : [macs];
    if (!Array.isArray(macArray)) {
      throw new Error('Parameter macs must be an array');
    }
    
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/devmgr',
      data: {
        cmd: 'migrate',
        inform_url: informUrl,
        macs: macArray.map(mac => mac.toLowerCase())
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async cancelMigrateDevice(macs: string | string[], options?: { signal?: AbortSignal }): Promise<boolean> {
    const macArray = Array.isArray(macs) ? macs : [macs];
    if (!Array.isArray(macArray)) {
      throw new Error('Parameter macs must be an array');
    }
    
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/devmgr',
      data: {
        cmd: 'cancel-migrate',
        macs: macArray.map(mac => mac.toLowerCase())
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async rebootCloudkey(options?: { signal?: AbortSignal }): Promise<boolean> {
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/system',
      data: { cmd: 'reboot' },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setApRadiosettings(apId: string, radio: string, channel: number, ht: number, txPowerMode: string, txPower: number, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!apId || typeof apId !== 'string') {
      throw new Error('Parameter apId must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/upd/device/${apId.trim()}`,
      data: {
        radio_table: {
          radio,
          channel,
          ht,
          tx_power_mode: txPowerMode,
          tx_power: txPower
        }
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async setApWlangroup(typeId: 'ng' | 'na', deviceId: string, groupId: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!['ng', 'na'].includes(typeId)) {
      throw new Error('Parameter typeId must be either "ng" or "na"');
    }
    if (!deviceId || typeof deviceId !== 'string') {
      throw new Error('Parameter deviceId must be a non-empty string');
    }
    
    const payload: any = {
      wlan_overrides: []
    };
    payload[`wlangroup_id_${typeId}`] = groupId;
    
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/upd/device/${deviceId.trim()}`,
      data: payload,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async renameAp(apId: string, apName: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!apId || typeof apId !== 'string') {
      throw new Error('Parameter apId must be a non-empty string');
    }
    if (!apName || typeof apName !== 'string') {
      throw new Error('Parameter apName must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'PUT',
      url: `/api/s/{site}/upd/device/${apId.trim()}`,
      data: { name: apName },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async moveDevice(mac: string, siteId: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    if (!siteId || typeof siteId !== 'string') {
      throw new Error('Parameter siteId must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/sitemgr',
      data: {
        cmd: 'move-device',
        site: siteId,
        mac: mac.toLowerCase()
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async deleteDevice(mac: string, options?: { signal?: AbortSignal }): Promise<boolean> {
    if (!mac || typeof mac !== 'string') {
      throw new Error('Parameter mac must be a non-empty string');
    }
    
    return await this.makeRequest<boolean>({
      method: 'POST',
      url: '/api/s/{site}/cmd/sitemgr',
      data: {
        cmd: 'delete-device',
        mac: mac.toLowerCase()
      },
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Additional listing methods
  async listSettings(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/get/setting',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listPortforwarding(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/list/portforward',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listExtension(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/list/extension',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listWlanGroups(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/list/wlangroup',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listRouting(routeId?: string, options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: `/api/s/{site}/rest/routing/${routeId ? routeId.trim() : ''}`,
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listDynamicdns(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/rest/dynamicdns',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  async listCountryCodes(options?: { signal?: AbortSignal }): Promise<any[]> {
    return await this.makeRequest<any[]>({
      method: 'GET',
      url: '/api/s/{site}/stat/ccode',
      ...(options?.signal && { signal: options.signal }),
    });
    
  }

  // Note: This implementation includes a comprehensive set of UniFi API methods
  // converted from the original PHP client. Additional methods can be added as needed.
}