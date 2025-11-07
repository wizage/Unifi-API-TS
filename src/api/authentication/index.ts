/**
 * Authentication API module exports
 * 
 * This module provides authentication-related functionality for the UniFi API client,
 * including login, logout, session management, and authentication state checking.
 * 
 * @example
 * ```typescript
 * import { AuthenticationAPI } from 'unifi-api-ts/api/authentication';
 * 
 * const authAPI = new AuthenticationAPI(httpClient, sessionManager);
 * await authAPI.login();
 * ```
 * 
 * @since 1.0.0
 * @category Authentication
 */

export { AuthenticationAPI } from './AuthenticationAPI';
export type { SessionInfo } from '../../http/SessionManager';