---
layout: default
title: UniFi API TypeScript Client
---

# UniFi API TypeScript Client Documentation

Welcome to the comprehensive documentation for the UniFi API TypeScript Client library - a modern TypeScript client for managing UniFi Controllers with full type safety and extensive API coverage.

## 🚀 Quick Start

```bash
npm install unifi-api-typescript
```

```typescript
import { UniFiClient } from 'unifi-api-typescript';

const client = new UniFiClient({
  baseUrl: 'https://unifi.example.com:8443',
  username: 'admin',
  password: 'your-password',
  site: 'default'
});

// Authenticate and list devices
await client.login();
const devices = await client.listDevices();
console.log(`Found ${devices.length} devices`);
```

## 📚 Documentation Sections

### [📖 API Reference](./modules.html)
Complete TypeScript API documentation generated from source code with TypeDoc:
- Class and interface definitions
- Method signatures and parameters  
- Return types and examples
- JSDoc comments and usage notes

### [🔧 Examples](https://github.com/your-username/unifi-api-typescript/tree/main/examples)
Practical examples demonstrating common use cases:
- Basic authentication and device management
- Guest network operations
- Error handling patterns
- Request cancellation

### [📋 API Coverage](https://github.com/your-username/unifi-api-typescript/blob/main/API_COVERAGE_ANALYSIS.md)
Comprehensive analysis of supported UniFi Controller API endpoints

## ✨ Features

- 🔒 **Full Authentication Support** - Automatic session management and re-authentication
- 📡 **Complete API Coverage** - All UniFi Controller API endpoints supported  
- 🛡️ **Type Safety** - Full TypeScript definitions for all API responses
- 🔄 **Automatic Retries** - Built-in retry logic for network resilience
- 🍪 **Session Management** - Automatic cookie handling and session persistence
- ⚡ **Modern Async/Await** - Promise-based API with async/await support
- 🚫 **Request Cancellation** - AbortController support for request cancellation
- 🐛 **Debug Support** - Comprehensive logging for troubleshooting

## 🏗️ Architecture

The library is built with a modular architecture:

- **UniFiClient** - Main client class providing high-level API
- **HTTPClient** - Low-level HTTP client with retry logic and error handling
- **SessionManager** - Handles authentication and session management
- **Generated API Methods** - Auto-generated methods covering all UniFi endpoints
- **Type Definitions** - Comprehensive TypeScript types for all UniFi data structures

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/your-username/unifi-api-typescript/blob/main/CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/your-username/unifi-api-typescript/blob/main/LICENSE) file for details.

## 🚀 Quick Links

- **[Getting Started](../README.md#quick-start)** - Basic setup and first API calls
- **[Configuration Options](../README.md#configuration-options)** - All client configuration parameters
- **[Error Handling](../README.md#error-handling)** - Comprehensive error handling guide
- **[Examples](../examples/)** - Complete working examples for common scenarios

## 📖 Example Categories

### Basic Usage
- [Basic Usage Example](../examples/basic-usage.ts) - Authentication, device listing, client management
- Essential operations every developer needs

### Guest Management
- [Guest Management Example](../examples/guest-management.ts) - Guest authorization, bandwidth limits, access control
- Complete guest network management workflows

### Error Handling
- [Error Handling Example](../examples/error-handling.ts) - Comprehensive error handling patterns
- Retry strategies, request cancellation, graceful degradation

## 🔧 Development Resources

### Type Definitions
The library provides comprehensive TypeScript definitions for:
- **Configuration Types** - Client setup and request options
- **API Response Types** - Structured responses from UniFi Controller
- **UniFi Data Types** - Devices, clients, networks, and all UniFi entities
- **Error Types** - Specific error classes for different failure scenarios

### Key Classes

#### UniFiClient
Main client class providing access to all UniFi Controller functionality:
```typescript
const client = new UniFiClient(config);
await client.login();
const devices = await client.listDevices();
```

#### HTTPClient
Low-level HTTP client with session management and retry logic:
```typescript
const httpClient = client.getHttpClient();
const response = await httpClient.get('/api/s/default/stat/health');
```

#### SessionManager
Handles authentication, session lifecycle, and automatic re-authentication:
```typescript
const sessionManager = client.getSessionManager();
await sessionManager.ensureAuthenticated();
```

## 🛡️ Error Handling

The library provides specific error types for different scenarios:

- **ConfigurationError** - Invalid client configuration
- **AuthenticationError** - Login failures and credential issues
- **NetworkError** - Connection and network-related problems
- **TimeoutError** - Request timeout scenarios
- **APIError** - HTTP errors and API-specific failures

## 🎯 Best Practices

1. **Always authenticate first** before making API calls
2. **Handle errors appropriately** using specific error types
3. **Use request cancellation** for long-running operations
4. **Implement retry logic** for network resilience
5. **Always logout** when finished to clean up sessions
6. **Validate input parameters** (especially MAC addresses)
7. **Use TypeScript types** for better development experience

## 📋 API Coverage

This client provides complete coverage of the UniFi Controller API, including:

### Device Management
- List and manage UniFi devices (APs, switches, gateways)
- Device configuration and settings
- Firmware management and updates
- Device adoption and provisioning

### Client Management
- Connected client listing and details
- Client blocking and unblocking
- Force client reconnection
- Client statistics and history

### Network Configuration
- WLAN creation and management
- Network settings and policies
- Firewall rules and groups
- Port forwarding and routing

### Guest Network
- Guest authorization and access control
- Bandwidth and data limits
- Voucher management
- Guest portal configuration

### Monitoring and Statistics
- Real-time device and client statistics
- Historical data and reports
- Health monitoring and alerts
- Event logging and audit trails

## 🔗 Additional Resources

- **[GitHub Repository](https://github.com/your-repo/unifi-api-typescript)** - Source code and issue tracking
- **[NPM Package](https://www.npmjs.com/package/unifi-api-typescript)** - Package installation and versions
- **[UniFi Controller API](https://ubntwiki.com/products/software/unifi-controller/api)** - Official API documentation
- **[Community Forum](https://community.ui.com/)** - UniFi community discussions

---

**Note:** This library is not officially affiliated with Ubiquiti Inc. UniFi is a trademark of Ubiquiti Inc.