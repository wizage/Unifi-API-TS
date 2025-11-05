# Design Document

## Overview

This design outlines a simplified approach for creating a TypeScript UniFi API client through a one-time conversion from the existing PHP client. Instead of building complex conversion tooling, we'll perform a manual conversion process guided by analysis of the PHP source code, then maintain the result as regular TypeScript code.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PHP Source    │───▶│  Manual Analysis │───▶│  TypeScript     │
│   (Reference)   │    │  & Conversion    │    │  Client Library │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Production      │
                       │  TypeScript Code │
                       └──────────────────┘
```

### Core Components

#### 1. UniFi Client (Main Entry Point)
```typescript
class UniFiClient {
  - config: UniFiClientConfig
  - httpClient: HTTPClient
  - sessionManager: SessionManager
  
  + login(): Promise<void>
  + logout(): Promise<void>
  + [API Methods]: Promise<T>
}
```

#### 2. HTTP Client Layer
```typescript
class HTTPClient {
  - axiosInstance: AxiosInstance
  - cookieJar: CookieJar
  
  + request<T>(config): Promise<APIResponse<T>>
  + get/post/put/delete methods
  + Request cancellation support
}
```

#### 3. Session Manager
```typescript
class SessionManager {
  - httpClient: HTTPClient
  - config: UniFiClientConfig
  - isAuthenticated: boolean
  
  + login(): Promise<void>
  + logout(): Promise<void>
  + ensureAuthenticated(): Promise<void>
}
```

#### 4. API Methods Collection
```typescript
// Core UniFi operations organized by category
interface UniFiAPIMethods {
  // Authentication
  login(): Promise<boolean>
  logout(): Promise<boolean>
  
  // Device Management
  listDevices(): Promise<UniFiDevice[]>
  adoptDevice(mac: string): Promise<boolean>
  restartDevice(mac: string): Promise<boolean>
  
  // Client Management  
  listUsers(): Promise<UniFiClient[]>
  blockSta(mac: string): Promise<boolean>
  authorizeGuest(mac: string, minutes: number): Promise<boolean>
  
  // WLAN Management
  listWlanconf(): Promise<UniFiWlan[]>
  createWlan(config: WlanConfig): Promise<boolean>
  deleteWlan(id: string): Promise<boolean>
  
  // Network Management
  listNetworkconf(): Promise<UniFiNetwork[]>
  createNetwork(config: NetworkConfig): Promise<boolean>
  
  // Site Management
  listSites(): Promise<UniFiSite[]>
  createSite(name: string): Promise<boolean>
  
  // Statistics & Monitoring
  statSysinfo(): Promise<SystemInfo>
  listEvents(): Promise<UniFiEvent[]>
  listAlarms(): Promise<UniFiAlarm[]>
}
```

## Components and Interfaces

### Data Models

#### UniFi Device
```typescript
interface UniFiDevice {
  _id: string;
  mac: string;
  model: string;
  name?: string;
  type: string;
  state: number;
  adopted: boolean;
  disabled?: boolean;
  ip?: string;
  version?: string;
}
```

#### UniFi Client
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
  ap_mac?: string;
  signal?: number;
  rx_bytes?: number;
  tx_bytes?: number;
}
```

#### Configuration Types
```typescript
interface UniFiClientConfig {
  baseUrl: string;
  username: string;
  password: string;
  site?: string;
  timeout?: number;
  verifySsl?: boolean;
  debug?: boolean;
}

interface WlanConfig {
  name: string;
  passphrase: string;
  security?: string;
  enabled?: boolean;
  hide_ssid?: boolean;
  is_guest?: boolean;
}
```

### Error Handling

#### Error Types
```typescript
class UniFiError extends Error {
  constructor(message: string, public code?: string) {}
}

class AuthenticationError extends UniFiError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR');
  }
}

class NetworkError extends UniFiError {
  constructor(message: string, public cause?: Error) {
    super(message, 'NETWORK_ERROR');
  }
}

class APIError extends UniFiError {
  constructor(
    message: string, 
    public statusCode: number,
    public response?: any
  ) {
    super(message, 'API_ERROR');
  }
}
```

## Conversion Strategy

### Phase 1: Analysis
1. **Method Inventory**: Catalog all public methods in the PHP client
2. **Endpoint Mapping**: Identify the API endpoints each method calls
3. **Parameter Analysis**: Document parameter types and requirements
4. **Response Analysis**: Understand return value structures

### Phase 2: Core Implementation
1. **HTTP Foundation**: Implement HTTPClient with cookie support
2. **Session Management**: Create authentication handling
3. **Error Framework**: Implement error types and handling
4. **Base Client**: Create main UniFiClient class structure

### Phase 3: API Methods
1. **Essential Methods**: Implement core operations first
   - Authentication (login/logout)
   - Device listing and management
   - Client management
   - Basic WLAN operations
2. **Extended Methods**: Add remaining functionality
   - Advanced WLAN configuration
   - Network management
   - Site management
   - Statistics and monitoring
3. **Specialized Methods**: Implement edge cases and advanced features

### Phase 4: Polish & Documentation
1. **Type Definitions**: Ensure comprehensive TypeScript types
2. **Documentation**: Add JSDoc comments and usage examples
3. **Testing**: Create comprehensive test suite
4. **Package Setup**: Configure for npm publishing

## Method Conversion Patterns

### Simple GET Request
```php
// PHP
public function list_devices($device_mac = '') {
    return $this->fetch_results('/api/s/'.$this->site.'/stat/device');
}
```

```typescript
// TypeScript
async listDevices(deviceMac?: string): Promise<UniFiDevice[]> {
  const url = deviceMac 
    ? `/api/s/${this.site}/stat/device/${deviceMac}`
    : `/api/s/${this.site}/stat/device`;
    
  const response = await this.httpClient.get<UniFiDevice[]>(url);
  return response.data;
}
```

### POST with Data
```php
// PHP  
public function authorize_guest($mac, $minutes, $up = null, $down = null) {
    $payload = ['cmd' => 'authorize-guest', 'mac' => $mac, 'minutes' => $minutes];
    if ($up) $payload['up'] = $up;
    if ($down) $payload['down'] = $down;
    return $this->fetch_results_boolean('/api/s/'.$this->site.'/cmd/stamgr', $payload);
}
```

```typescript
// TypeScript
async authorizeGuest(
  mac: string, 
  minutes: number, 
  up?: number, 
  down?: number
): Promise<boolean> {
  const payload = {
    cmd: 'authorize-guest',
    mac,
    minutes,
    ...(up && { up }),
    ...(down && { down })
  };
  
  const response = await this.httpClient.post<boolean>(
    `/api/s/${this.site}/cmd/stamgr`, 
    payload
  );
  return response.data;
}
```

## Testing Strategy

### Unit Tests
- HTTP client functionality
- Session management
- Error handling
- Parameter validation

### Integration Tests  
- Authentication flow
- Core API operations
- Error scenarios

### Mock Testing
- UniFi Controller responses
- Network failure scenarios
- Authentication failures

## Deployment and Distribution

### Package Structure
```
unifi-api-typescript/
├── dist/
│   ├── cjs/           # CommonJS build
│   ├── esm/           # ES modules build  
│   └── types/         # TypeScript declarations
├── src/
│   ├── client/        # Main client classes
│   ├── http/          # HTTP and session management
│   ├── types/         # Type definitions
│   └── errors/        # Error classes
├── tests/
└── docs/
```

### Build Process
1. TypeScript compilation to multiple formats
2. Type declaration generation
3. Documentation generation
4. Package validation

This design provides a clean, maintainable TypeScript client that can be developed and maintained as regular source code, without the complexity of automated conversion tooling.