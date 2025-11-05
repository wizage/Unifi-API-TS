/**
 * UniFi API TypeScript Client Examples
 * 
 * This directory contains comprehensive examples demonstrating various
 * aspects of the UniFi API TypeScript client library.
 */

export * from './basic-usage';
export * from './guest-management';
export * from './error-handling';

/**
 * Example Categories:
 * 
 * 1. **Basic Usage** (`basic-usage.ts`)
 *    - Authentication and session management
 *    - Listing devices and clients
 *    - Basic error handling
 * 
 * 2. **Guest Management** (`guest-management.ts`)
 *    - Guest authorization with various options
 *    - Client management operations
 *    - MAC address validation
 * 
 * 3. **Error Handling** (`error-handling.ts`)
 *    - Comprehensive error handling patterns
 *    - Retry strategies with exponential backoff
 *    - Request cancellation
 *    - Graceful degradation
 * 
 * ## Running Examples
 * 
 * To run any example, first ensure you have the correct configuration:
 * 
 * ```typescript
 * const client = new UniFiClient({
 *   baseUrl: 'https://your-controller.example.com:8443',
 *   username: 'your-username',
 *   password: 'your-password',
 *   site: 'your-site', // usually 'default'
 *   verifySsl: false   // set to true with valid certificates
 * });
 * ```
 * 
 * Then run with ts-node or compile and run:
 * 
 * ```bash
 * # Using ts-node
 * npx ts-node examples/basic-usage.ts
 * 
 * # Or compile and run
 * npm run build
 * node dist/examples/basic-usage.js
 * ```
 * 
 * ## Best Practices Demonstrated
 * 
 * - Always authenticate before making API calls
 * - Handle different error types appropriately
 * - Use request cancellation for long-running operations
 * - Implement retry logic for network resilience
 * - Always logout when finished to clean up sessions
 * - Validate input parameters (like MAC addresses)
 * - Use TypeScript types for better development experience
 */