# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial TypeScript UniFi API client implementation
- Complete API method coverage from PHP UniFi-API-client
- TypeScript type definitions for all UniFi data structures
- Request cancellation support using AbortController
- Comprehensive error handling with custom error types
- Session management with automatic re-authentication
- Multi-format builds (CommonJS, ES modules, TypeScript declarations)
- Comprehensive test suite with unit, integration, and E2E tests
- Complete API documentation with TypeDoc

### Features
- **Authentication**: Login/logout with session management
- **Device Management**: List, adopt, restart, and configure devices
- **Client Management**: Block/unblock clients, guest authorization
- **WLAN Management**: Create, update, and delete wireless networks
- **Network Management**: Configure network settings and routing
- **Site Management**: Multi-site support and configuration
- **Monitoring**: System information, events, and alarms
- **Statistics**: Comprehensive reporting and analytics

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of TypeScript UniFi API client
- Full feature parity with PHP UniFi-API-client
- Production-ready build system and CI/CD pipeline