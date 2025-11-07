/**
 * API modules exports
 * 
 * This module provides organized access to all UniFi API functionality,
 * grouped by functional area for better code organization and maintainability.
 * 
 * ## Available API Modules
 * 
 * - {@link AuthenticationAPI} - Login, logout, and session management
 * - {@link DeviceManagementAPI} - Device adoption, configuration, and maintenance
 * - {@link ClientManagementAPI} - Client device management and guest authorization
 * - {@link NetworkManagementAPI} - Network configuration and VLAN management
 * - {@link SiteManagementAPI} - Site creation, configuration, and statistics
 * - {@link UserManagementAPI} - User, user group, and administrator management
 * - {@link SecurityAPI} - Firewall, IPS/IDS, and security settings
 * - {@link StatisticsAPI} - System monitoring and statistical data
 * 
 * @example
 * ```typescript
 * import { AuthenticationAPI } from 'unifi-api-ts/api';
 * 
 * // Or import specific modules
 * import { AuthenticationAPI } from 'unifi-api-ts/api/authentication';
 * ```
 * 
 * @since 1.0.0
 * @category API
 */

// Authentication module
export { AuthenticationAPI } from './authentication';
export type { SessionInfo } from './authentication';

// Device management module
export { DeviceManagementAPI } from './device-management';

// Client management module
export { ClientManagementAPI } from './client-management';

// Network management module
export { NetworkManagementAPI } from './network-management';

// Site management module
export { SiteManagementAPI } from './site-management';

// User management module
export { UserManagementAPI } from './user-management';

// Security module
export { SecurityAPI } from './security';

// Statistics module
export { StatisticsAPI } from './statistics';

// Utility module
export { UtilityAPI } from './utility';