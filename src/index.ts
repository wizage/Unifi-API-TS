/**
 * UniFi API TypeScript Client
 * 
 * A TypeScript implementation of the UniFi Controller API client,
 * converted from the PHP UniFi-API-client library.
 */

export { UniFiClient } from './client/UniFiClient';
export * from './types';
export * from './errors';

// Export specific HTTP classes to avoid conflicts
export { HTTPClient, SessionManager } from './http';