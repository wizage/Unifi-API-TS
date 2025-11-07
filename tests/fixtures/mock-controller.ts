/**
 * Mock UniFi Controller for end-to-end testing
 * Simulates a real UniFi Controller with realistic behavior
 */

import { MockResponses, createMockResponse, createMockErrorResponse } from './mock-responses';

export interface MockControllerOptions {
  baseUrl?: string;
  username?: string;
  password?: string;
  site?: string;
  simulateNetworkDelay?: boolean;
  simulateErrors?: boolean;
  errorRate?: number;
}

export class MockUniFiController {
  private options: MockControllerOptions;
  private isAuthenticated = false;
  private sessionCookies: string[] = [];
  private requestCount = 0;

  constructor(options: MockControllerOptions = {}) {
    this.options = {
      baseUrl: 'https://test.local:8443',
      username: 'admin',
      password: 'password',
      site: 'default',
      simulateNetworkDelay: false,
      simulateErrors: false,
      errorRate: 0.1,
      ...options
    };
  }

  /**
   * Mock HTTP request handler
   */
  async handleRequest(method: string, url: string, data?: any, headers?: any): Promise<any> {
    this.requestCount++;

    // Simulate network delay if enabled
    if (this.options.simulateNetworkDelay) {
      await this.delay(100 + Math.random() * 200);
    }

    // Simulate random errors if enabled
    if (this.options.simulateErrors && Math.random() < this.options.errorRate!) {
      throw new Error('Simulated network error');
    }

    // Route the request
    return this.routeRequest(method, url, data, headers);
  }

  private async routeRequest(method: string, url: string, data?: any, headers?: any): Promise<any> {
    // Authentication endpoints
    if ((url === '/api/login' || url === '/api/auth/login' || url === '/api/auth') && method === 'POST') {
      return this.handleLogin(data);
    }

    if (url === '/api/logout' && method === 'POST') {
      return this.handleLogout();
    }

    // Check authentication for protected endpoints
    if (!this.isAuthenticated && !url.startsWith('/api/login') && !url.startsWith('/api/auth')) {
      throw new Error('Authentication required');
    }

    // Site endpoints
    if (url === '/api/self/sites' && method === 'GET') {
      return createMockResponse(MockResponses.sites);
    }

    // Device endpoints
    if (url.includes('/stat/device') && method === 'GET') {
      return createMockResponse(MockResponses.devices);
    }

    if (url.includes('/cmd/devmgr') && method === 'POST') {
      return this.handleDeviceCommand(data);
    }

    // Client endpoints - handle both /stat/sta, /stat/user, and /list/user
    if ((url.includes('/stat/sta') || url.includes('/stat/user') || url.includes('/list/user')) && method === 'GET') {
      return createMockResponse(MockResponses.clients);
    }

    if (url.includes('/cmd/stamgr') && method === 'POST') {
      return this.handleClientCommand(data);
    }

    // WLAN endpoints
    if ((url.includes('/rest/wlanconf') || url.includes('/list/wlanconf')) && method === 'GET') {
      return createMockResponse(MockResponses.wlans);
    }

    if ((url.includes('/rest/wlanconf') || url.includes('/add/wlanconf')) && method === 'POST') {
      return this.handleCreateWlan(data);
    }

    // Network endpoints
    if (url.includes('/rest/networkconf') && method === 'GET') {
      return createMockResponse(MockResponses.networks);
    }

    if (url.includes('/rest/networkconf') && method === 'POST') {
      return this.handleCreateNetwork(data);
    }

    // System info
    if (url.includes('/stat/sysinfo') && method === 'GET') {
      return {
        data: [MockResponses.sysinfo], // Wrap in array as expected by the API
        meta: { rc: 'ok' }
      };
    }

    // Events - handle both GET and POST
    if (url.includes('/stat/event') && (method === 'GET' || method === 'POST')) {
      return createMockResponse(MockResponses.events);
    }

    // Alarms - handle both /stat/alarm and /list/alarm
    if ((url.includes('/stat/alarm') || url.includes('/list/alarm')) && method === 'GET') {
      return createMockResponse(MockResponses.alarms);
    }

    // Site management
    if (url.includes('/cmd/sitemgr') && method === 'POST') {
      return this.handleSiteCommand(data);
    }

    // Default 404 response
    throw new Error(`Not found: ${method} ${url}`);
  }

  private handleLogin(data: any): any {
    if (data.username === this.options.username && data.password === this.options.password) {
      this.isAuthenticated = true;
      this.sessionCookies = ['unifises=mock-session-id'];
      return MockResponses.loginSuccess;
    } else {
      return MockResponses.loginFailure;
    }
  }

  private handleLogout(): any {
    this.isAuthenticated = false;
    this.sessionCookies = [];
    return MockResponses.logoutSuccess;
  }

  private handleDeviceCommand(data: any): any {
    const { cmd, mac, macs } = data;
    const macToCheck = mac || (macs && macs[0]);

    switch (cmd) {
      case 'adopt':
        if (!macToCheck || !this.isValidMac(macToCheck)) {
          return createMockErrorResponse('Invalid MAC address');
        }
        return MockResponses.success;

      case 'restart':
        if (!macToCheck || !this.isValidMac(macToCheck)) {
          return createMockErrorResponse('Invalid MAC address');
        }
        return MockResponses.success;

      case 'set-locate':
        return MockResponses.success;

      default:
        return createMockErrorResponse(`Unknown device command: ${cmd}`);
    }
  }

  private handleClientCommand(data: any): any {
    const { cmd, mac } = data;

    switch (cmd) {
      case 'block-sta':
      case 'unblock-sta':
      case 'kick-sta':
        if (!this.isValidMac(mac)) {
          return createMockErrorResponse('Invalid MAC address');
        }
        return MockResponses.success;

      case 'authorize-guest':
      case 'unauthorize-guest':
        if (!this.isValidMac(mac)) {
          return createMockErrorResponse('Invalid MAC address');
        }
        return MockResponses.success;

      default:
        return createMockErrorResponse(`Unknown client command: ${cmd}`);
    }
  }

  private handleCreateWlan(data: any): any {
    if (!data.name) {
      return createMockErrorResponse('Name is required');
    }
    // Only require passphrase for secured networks
    if (data.security && data.security !== 'open' && !data.x_passphrase) {
      return createMockErrorResponse('Passphrase is required for secured networks');
    }
    return MockResponses.success;
  }

  private handleCreateNetwork(data: any): any {
    if (!data.name || !data.purpose) {
      return createMockErrorResponse('Name and purpose are required');
    }
    return MockResponses.success;
  }

  private handleSiteCommand(data: any): any {
    const { cmd } = data;

    switch (cmd) {
      case 'add-site':
        if (!data.desc) {
          return createMockErrorResponse('Site description is required');
        }
        return MockResponses.success;

      case 'delete-site':
        if (!data.name) {
          return createMockErrorResponse('Site name is required');
        }
        return MockResponses.success;

      default:
        return createMockErrorResponse(`Unknown site command: ${cmd}`);
    }
  }

  private isValidMac(mac: string): boolean {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods for testing
  getRequestCount(): number {
    return this.requestCount;
  }

  isSessionActive(): boolean {
    return this.isAuthenticated;
  }

  getSessionCookies(): string[] {
    return [...this.sessionCookies];
  }

  reset(): void {
    this.isAuthenticated = false;
    this.sessionCookies = [];
    this.requestCount = 0;
  }

  simulateSessionExpiry(): void {
    this.isAuthenticated = false;
    this.sessionCookies = [];
  }

  setErrorRate(rate: number): void {
    this.options.errorRate = Math.max(0, Math.min(1, rate));
  }

  enableNetworkDelay(enabled: boolean): void {
    this.options.simulateNetworkDelay = enabled;
  }

  enableErrorSimulation(enabled: boolean): void {
    this.options.simulateErrors = enabled;
  }
}