# UniFi API TypeScript Client - Type Definitions

This document provides a comprehensive overview of all type definitions available in the UniFi API TypeScript client.

## Table of Contents

1. [Configuration Types](#configuration-types)
2. [API Response Types](#api-response-types)
3. [UniFi Data Structures](#unifi-data-structures)
4. [Configuration Interfaces](#configuration-interfaces)
5. [Error Types](#error-types)
6. [Utility Types](#utility-types)
7. [Type Guards](#type-guards)

## Configuration Types

### UniFiClientConfig
Main configuration interface for the UniFi client.

```typescript
interface UniFiClientConfig {
  baseUrl: string;           // Base URL of the UniFi Controller
  username: string;          // Username for authentication
  password: string;          // Password for authentication
  site?: string;            // Site name/ID (defaults to 'default')
  timeout?: number;         // Request timeout in milliseconds
  verifySsl?: boolean;      // Whether to verify SSL certificates
  debug?: boolean;          // Enable debug logging
  headers?: Record<string, string>;  // Custom headers
  maxRetries?: number;      // Maximum retry attempts
  retryDelay?: number;      // Retry delay in milliseconds
  autoReauth?: boolean;     // Auto re-authenticate on auth failures
}
```

### RequestOptions
Options for individual API requests.

```typescript
interface RequestOptions {
  timeout?: number;         // Request timeout
  retries?: number;         // Retry attempts
  signal?: AbortSignal;     // Cancellation signal
  headers?: Record<string, string>;  // Custom headers
  skipAuth?: boolean;       // Skip authentication
}
```

## API Response Types

### APIResponse<T>
Generic API response wrapper.

```typescript
interface APIResponse<T = any> {
  data: T;
  meta?: ResponseMeta;
}

interface ResponseMeta {
  rc: string;               // Response code
  msg?: string;             // Response message
}
```

### Specialized Response Types

```typescript
type ListResponse<T> = APIResponse<T[]>;
type SingleResponse<T> = APIResponse<T>;
type BooleanResponse = APIResponse<boolean>;
type StringResponse = APIResponse<string>;
type NumberResponse = APIResponse<number>;
```

## UniFi Data Structures

### UniFiDevice
Represents a UniFi device (Access Point, Switch, Gateway, etc.).

```typescript
interface UniFiDevice {
  _id: string;
  mac: string;
  model: string;
  name?: string;
  type: 'uap' | 'usw' | 'ugw' | 'usg' | 'udm' | 'uxg' | 'ubb' | 'ulte' | 'unvr' | 'uck' | 'uph';
  state: 0 | 1 | 2 | 3 | 4 | 5;  // Device state
  adopted: boolean;
  disabled?: boolean;
  ip?: string;
  version?: string;
  // ... many more fields for device-specific data
}
```

### UniFiClient
Represents a connected client/user.

```typescript
interface UniFiClient {
  _id: string;
  mac: string;
  ip?: string;
  hostname?: string;
  name?: string;
  is_guest?: boolean;
  first_seen?: number;
  last_seen?: number;
  is_wired?: boolean;
  usergroup_id?: string;
  ap_mac?: string;
  signal?: number;
  rx_bytes?: number;
  tx_bytes?: number;
  // ... additional client data
}
```

### UniFiSite
Represents a UniFi site.

```typescript
interface UniFiSite {
  _id: string;
  name: string;
  desc: string;
  role: 'admin' | 'readonly' | 'limited';
  health?: SiteHealth[];
  num_adopted?: number;
  num_ap?: number;
  num_sw?: number;
  num_gw?: number;
  // ... site statistics and health data
}
```

### UniFiWlan
Represents a WLAN configuration.

```typescript
interface UniFiWlan {
  _id: string;
  name: string;
  enabled: boolean;
  security: 'open' | 'wpapsk' | 'wpaeap';
  wpa_mode?: 'wpa' | 'wpa2' | 'wpa3';
  wpa_enc?: 'auto' | 'ccmp' | 'tkip';
  usergroup_id?: string;
  wlangroup_id?: string;
  is_guest?: boolean;
  hide_ssid?: boolean;
  // ... additional WLAN settings
}
```

### UniFiNetwork
Represents a network configuration.

```typescript
interface UniFiNetwork {
  _id: string;
  name: string;
  purpose: 'corporate' | 'guest' | 'wan' | 'vlan-only';
  vlan_enabled?: boolean;
  vlan?: number;
  ip_subnet?: string;
  dhcp_enabled?: boolean;
  dhcp_start?: string;
  dhcp_stop?: string;
  // ... network configuration options
}
```

## Configuration Interfaces

### WlanConfig
Configuration for creating/updating WLANs.

```typescript
interface WlanConfig {
  name: string;
  x_passphrase: string;
  usergroup_id?: string;
  wlangroup_id?: string;
  enabled?: boolean;
  hide_ssid?: boolean;
  is_guest?: boolean;
  security?: 'open' | 'wpapsk' | 'wpaeap';
  wpa_mode?: 'wpa' | 'wpa2' | 'wpa3';
  wpa_enc?: 'auto' | 'ccmp' | 'tkip';
  // ... additional WLAN configuration options
}
```

### NetworkConfig
Configuration for creating/updating networks.

```typescript
interface NetworkConfig {
  name: string;
  purpose: 'corporate' | 'guest' | 'wan' | 'vlan-only';
  vlan_enabled?: boolean;
  vlan?: number;
  ip_subnet?: string;
  dhcp_enabled?: boolean;
  dhcp_start?: string;
  dhcp_stop?: string;
  dhcp_lease?: number;
  // ... additional network configuration options
}
```

### UserGroupConfig
Configuration for user groups.

```typescript
interface UserGroupConfig {
  name: string;
  qos_rate_max_down?: number;
  qos_rate_max_up?: number;
  site_id?: string;
}
```

### FirewallGroupConfig
Configuration for firewall groups.

```typescript
interface FirewallGroupConfig {
  name: string;
  group_type: 'address-group' | 'ipv6-address-group' | 'port-group';
  group_members?: string[];
  site_id?: string;
}
```

### VoucherConfig
Configuration for creating vouchers.

```typescript
interface VoucherConfig {
  minutes: number;
  count?: number;
  quota?: number;
  note?: string;
  up?: number;
  down?: number;
  megabytes?: number;
}
```

### GuestAuthorizationConfig
Configuration for guest authorization.

```typescript
interface GuestAuthorizationConfig {
  mac: string;
  minutes: number;
  up?: number;
  down?: number;
  megabytes?: number;
  ap_mac?: string;
}
```

## Error Types

### UniFiError
Base error interface.

```typescript
interface UniFiError {
  code: string;
  message: string;
  details?: any;
}
```

### Specialized Error Types

```typescript
interface AuthenticationError extends UniFiError {
  code: 'AUTHENTICATION_ERROR';
  statusCode: 401;
}

interface NetworkError extends UniFiError {
  code: 'NETWORK_ERROR';
  cause?: Error;
}

interface APIError extends UniFiError {
  code: 'API_ERROR';
  statusCode: number;
  response?: any;
}

interface ValidationError extends UniFiError {
  code: 'VALIDATION_ERROR';
  field?: string;
}
```

## Utility Types

### Type Aliases
Convenient type aliases for common values.

```typescript
type UniFiDeviceType = 'uap' | 'usw' | 'ugw' | 'usg' | 'udm' | 'uxg' | 'ubb' | 'ulte' | 'unvr' | 'uck' | 'uph';
type UniFiDeviceState = 0 | 1 | 2 | 3 | 4 | 5;
type UniFiRadioType = 'ng' | 'na' | '6g';
type UniFiSecurityType = 'open' | 'wpapsk' | 'wpaeap';
type UniFiWpaMode = 'wpa' | 'wpa2' | 'wpa3';
type UniFiWpaEncryption = 'auto' | 'ccmp' | 'tkip';
type UniFiNetworkPurpose = 'corporate' | 'guest' | 'wan' | 'vlan-only';
type UniFiSiteRole = 'admin' | 'readonly' | 'limited';
type UniFiSubsystem = 'wlan' | 'lan' | 'wan' | 'www' | 'vpn';
type UniFiHealthStatus = 'ok' | 'warning' | 'error';
```

### Generic Response Wrappers

```typescript
type UniFiListResponse<T> = APIResponse<T[]>;
type UniFiSingleResponse<T> = APIResponse<T>;
type UniFiBooleanResponse = APIResponse<boolean>;
type UniFiStringResponse = APIResponse<string>;
type UniFiNumberResponse = APIResponse<number>;
```

## Type Guards

Type guard functions for runtime type checking.

```typescript
function isUniFiDevice(obj: any): obj is UniFiDevice;
function isUniFiClient(obj: any): obj is UniFiClient;
function isUniFiSite(obj: any): obj is UniFiSite;
function isUniFiWlan(obj: any): obj is UniFiWlan;
function isUniFiNetwork(obj: any): obj is UniFiNetwork;
```

## Usage Examples

### Basic Client Setup

```typescript
import { UniFiClient, UniFiClientConfig } from 'unifi-api-ts';

const config: UniFiClientConfig = {
  baseUrl: 'https://unifi.example.com:8443',
  username: 'admin',
  password: 'password',
  site: 'default',
  verifySsl: false
};

const client = new UniFiClient(config);
```

### Using Type-Safe API Methods

```typescript
// List devices with proper typing
const devices: UniFiDevice[] = await client.listDevices();

// List clients with proper typing
const clients: UniFiClient[] = await client.listUsers();

// Create WLAN with configuration
const wlanConfig: WlanConfig = {
  name: 'Guest Network',
  x_passphrase: 'guestpassword',
  is_guest: true,
  security: 'wpapsk',
  wpa_mode: 'wpa2'
};

const success: boolean = await client.createWlan(
  wlanConfig.name,
  wlanConfig.x_passphrase,
  wlanConfig.usergroup_id || '',
  wlanConfig.wlangroup_id || '',
  wlanConfig.enabled,
  wlanConfig.hide_ssid,
  wlanConfig.is_guest,
  wlanConfig.security,
  wlanConfig.wpa_mode,
  wlanConfig.wpa_enc
);
```

### Request Cancellation

```typescript
const controller = new AbortController();

// Cancel request after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  const devices = await client.listDevices(undefined, {
    signal: controller.signal
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
  }
}
```

This comprehensive type system ensures type safety throughout your UniFi API interactions while providing excellent IntelliSense support in TypeScript-aware editors.