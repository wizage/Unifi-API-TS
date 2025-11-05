/**
 * Configuration types for UniFi API Client
 */

export interface UniFiClientConfig {
  /** Base URL of the UniFi Controller (e.g., 'https://unifi.example.com:8443') */
  baseUrl: string;
  /** Username for authentication */
  username: string;
  /** Password for authentication */
  password: string;
  /** Site name/ID (defaults to 'default') */
  site?: string;
  /** Request timeout in milliseconds (defaults to 30000) */
  timeout?: number;
  /** Whether to verify SSL certificates (defaults to true) */
  verifySsl?: boolean;
  /** Enable debug logging (defaults to false) */
  debug?: boolean;
  /** Custom headers to include with requests */
  headers?: Record<string, string>;
  /** Maximum number of retry attempts (defaults to 3) */
  maxRetries?: number;
  /** Retry delay in milliseconds (defaults to 1000) */
  retryDelay?: number;
  /** Whether to automatically re-authenticate on auth failures (defaults to true) */
  autoReauth?: boolean;
}

export interface RequestOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts for this specific request */
  retries?: number;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
  /** Custom headers for this specific request */
  headers?: Record<string, string>;
  /** Whether to skip authentication for this request */
  skipAuth?: boolean;
}

export interface SessionConfig {
  /** Whether the session is currently authenticated */
  isAuthenticated: boolean;
  /** Timestamp of last successful authentication */
  lastAuthTime?: number;
  /** Session cookies */
  cookies?: string[];
  /** Controller type detected during authentication */
  controllerType?: 'unifi' | 'unifi-os';
  /** Controller version */
  controllerVersion?: string;
}

export interface HTTPClientConfig {
  /** Base URL for requests */
  baseUrl: string;
  /** Default timeout for requests */
  timeout: number;
  /** Whether to verify SSL certificates */
  verifySsl: boolean;
  /** Default headers to include with all requests */
  headers: Record<string, string>;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Enable debug logging */
  debug: boolean;
}