---
layout: default
title: UniFi API TypeScript Client
---

# UniFi API TypeScript Client Documentation

Welcome to the comprehensive documentation for the UniFi API TypeScript Client library - a modern TypeScript client for managing UniFi Controllers with full type safety and extensive API coverage.

## 🚀 Quick Start

```bash
npm install unifi-api-ts
```

```typescript
import { UniFiClient } from 'unifi-api-ts';

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

### [📖 API Reference](./api/modules.html)
Complete TypeScript API documentation generated from source code with TypeDoc:
- Class and interface definitions
- Method signatures and parameters  
- Return types and examples
- JSDoc comments and usage notes

### [🔧 Examples](https://github.com/wizage/Unifi-API-TS/tree/main/examples)
Practical examples demonstrating common use cases:
- Basic authentication and device management
- Guest network operations
- Error handling patterns
- Request cancellation

### [📋 API Coverage](https://github.com/wizage/Unifi-API-TS/blob/main/API_COVERAGE_ANALYSIS.md)
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

Contributions are welcome! Please see our [Contributing Guide](https://github.com/wizage/Unifi-API-TS/blob/main/CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/wizage/Unifi-API-TS/blob/main/LICENSE) file for details.