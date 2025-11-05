# UniFi API TypeScript Client

A comprehensive TypeScript client for the UniFi Controller API, providing type-safe access to all UniFi network management functionality. This library is a complete TypeScript port of the popular PHP UniFi-API-client, offering the same extensive feature set with modern TypeScript benefits.

[![npm version](https://badge.fury.io/js/unifi-api-typescript.svg)](https://badge.fury.io/js/unifi-api-typescript)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔒 **Full Authentication Support** - Automatic session management and re-authentication
- 📡 **Complete API Coverage** - All UniFi Controller API endpoints supported
- 🛡️ **Type Safety** - Full TypeScript definitions for all API responses
- 🔄 **Automatic Retries** - Built-in retry logic for network resilience
- 🍪 **Session Management** - Automatic cookie handling and session persistence
- ⚡ **Modern Async/Await** - Promise-based API with async/await support
- 🚫 **Request Cancellation** - AbortController support for request cancellation
- 🐛 **Debug Support** - Comprehensive logging for troubleshooting
- 📚 **Extensive Documentation** - Complete JSDoc documentation and examples

## Installation

```bash
npm install unifi-api-typescript
```

```bash
yarn add unifi-api-typescript
```

```bash
pnpm add unifi-api-typescript
```

## Quick Start

```typescript
import { UniFiClient } from 'unifi-api-typescript';

// Create client instance
const client = new UniFiClient({
  baseUrl: 'https://unifi.example.com:8443',
  username: 'admin',
  password: 'your-password',
  site: 'default', // optional, defaults to 'default'
  verifySsl: false // optional, useful for self-signed certificates
});

// Login and start using the API
async function main() {
  try {
    // Authenticate
    await client.login();
    
    // Get all devices
    const devices = await client.listDevices();
    console.log(`Found ${devices.length} devices`);
    
    // Get all connected clients
    const clients = await client.listUsers();
    console.log(`Found ${clients.length} connected clients`);
    
    // Logout when done
    await client.logout();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

## Configuration Options

The `UniFiClientConfig` interface supports the following options:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `baseUrl` | string | ✅ | - | Base URL of your UniFi Controller |
| `username` | string | ✅ | - | Username for authentication |
| `password` | string | ✅ | - | Password for authentication |
| `site` | string | ❌ | `'default'` | Site name to operate on |
| `timeout` | number | ❌ | `30000` | Request timeout in milliseconds |
| `verifySsl` | boolean | ❌ | `true` | Whether to verify SSL certificates |
| `debug` | boolean | ❌ | `false` | Enable debug logging |

### Example with All Options

```typescript
const client = new UniFiClient({
  baseUrl: 'https://192.168.1.1:8443',
  username: 'admin',
  password: 'mypassword',
  site: 'corporate',
  timeout: 15000,
  verifySsl: false,
  debug: true
});
```

## Core API Methods

### Authentication

```typescript
// Login (required before making API calls)
await client.login();

// Check authentication status
if (client.isAuthenticated()) {
  console.log('Client is authenticated');
}

// Get session information
const sessionInfo = client.getSessionInfo();
console.log(`Logged in as: ${sessionInfo.username}`);

// Logout
await client.logout();
```

### Device Management

```typescript
// List all UniFi devices (APs, switches, gateways)
const devices = await client.listDevices();

// Get specific device by MAC address
const device = await client.listDevices('aa:bb:cc:dd:ee:ff');

// Get basic device information (faster)
const basicDevices = await client.listDevicesBasic();
```

### Client Management

```typescript
// List all connected clients
const clients = await client.listUsers();

// Get specific client by MAC address
const client = await client.listUsers('aa:bb:cc:dd:ee:ff');

// Force client reconnection
await client.reconnectSta('aa:bb:cc:dd:ee:ff');

// Block a client
await client.blockSta('aa:bb:cc:dd:ee:ff');

// Unblock a client
await client.unblockSta('aa:bb:cc:dd:ee:ff');

// Forget a client (remove from controller memory)
await client.forgetSta('aa:bb:cc:dd:ee:ff');
```

### Guest Management

```typescript
// Authorize guest for 60 minutes
await client.authorizeGuest('aa:bb:cc:dd:ee:ff', 60);

// Authorize guest with bandwidth limits (5 Mbps up, 10 Mbps down)
await client.authorizeGuest('aa:bb:cc:dd:ee:ff', 60, 5000, 10000);

// Authorize guest with data limit (1 GB)
await client.authorizeGuest('aa:bb:cc:dd:ee:ff', 60, undefined, undefined, 1024);

// Revoke guest authorization
await client.unauthorizeGuest('aa:bb:cc:dd:ee:ff');
```

## Error Handling

The client provides specific error types for different failure scenarios:

```typescript
import { 
  AuthenticationError, 
  NetworkError, 
  APIError, 
  TimeoutError,
  ConfigurationError 
} from 'unifi-api-typescript';

try {
  await client.login();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid credentials');
  } else if (error instanceof NetworkError) {
    console.error('Network connectivity issue');
  } else if (error instanceof TimeoutError) {
    console.error('Request timed out');
  } else if (error instanceof APIError) {
    console.error(`API error: ${error.statusCode} - ${error.message}`);
  } else if (error instanceof ConfigurationError) {
    console.error('Configuration error:', error.message);
  }
}
```

## Request Cancellation

All API methods support request cancellation using AbortController:

```typescript
const controller = new AbortController();

// Cancel the request after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  const devices = await client.listDevices(undefined, {
    signal: controller.signal
  });
} catch (error) {
  if (error.message.includes('cancelled')) {
    console.log('Request was cancelled');
  }
}
```

## Advanced Usage

### Custom HTTP Client Access

```typescript
// Get the underlying HTTP client for custom requests
const httpClient = client.getHttpClient();

// Make a custom API call
const response = await httpClient.get('/api/s/default/stat/health');
```

### Session Management

```typescript
// Get the session manager for advanced session control
const sessionManager = client.getSessionManager();

// Wrap API calls with automatic authentication
const result = await sessionManager.withAuth(async () => {
  return httpClient.get('/api/s/default/stat/device');
});
```

### Multiple Sites

```typescript
// Create clients for different sites
const defaultSite = new UniFiClient({
  baseUrl: 'https://controller.example.com:8443',
  username: 'admin',
  password: 'password',
  site: 'default'
});

const corporateSite = new UniFiClient({
  baseUrl: 'https://controller.example.com:8443',
  username: 'admin',
  password: 'password',
  site: 'corporate'
});
```

## TypeScript Support

This library is written in TypeScript and provides comprehensive type definitions:

```typescript
import { UniFiDevice, UniFiClient, DeviceConfig } from 'unifi-api-typescript';

// All API responses are fully typed
const devices: UniFiDevice[] = await client.listDevices();
const clients: UniFiClient[] = await client.listUsers();

// Configuration objects are also typed
const deviceConfig: DeviceConfig = {
  name: 'Living Room AP',
  // ... other typed properties
};
```

## Debugging

Enable debug mode to see detailed request/response information:

```typescript
const client = new UniFiClient({
  baseUrl: 'https://unifi.example.com:8443',
  username: 'admin',
  password: 'password',
  debug: true // Enable debug logging
});
```

Debug output includes:
- HTTP request details (method, URL, headers)
- Request and response data
- Authentication flow
- Error details

## SSL Certificate Issues

For controllers with self-signed certificates:

```typescript
const client = new UniFiClient({
  baseUrl: 'https://192.168.1.1:8443',
  username: 'admin',
  password: 'password',
  verifySsl: false // Disable SSL verification
});
```

**Note:** Only disable SSL verification in trusted environments.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Based on the excellent [PHP UniFi-API-client](https://github.com/Art-of-WiFi/UniFi-API-client) by Art of WiFi
- Thanks to the UniFi community for API documentation and examples

## Support

- 📖 [API Documentation](https://your-docs-url.com)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

---

**Note:** This library is not officially affiliated with Ubiquiti Inc. UniFi is a trademark of Ubiquiti Inc.