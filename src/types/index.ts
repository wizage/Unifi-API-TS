/**
 * Type definitions for UniFi API Client
 * 
 * This module exports all type definitions including:
 * - Configuration types for client setup
 * - API response and request types
 * - Comprehensive UniFi data structures
 * - Method parameter interfaces
 * - Error types and validation helpers
 */

export * from './config';
export * from './api';

// Export specific types from generated types to avoid conflicts
export type {
  // UniFi data structures
  UniFiNetwork,
  NetworkConfig,
  UniFiSite,
  SystemInfo,
  UniFiEvent,
  UniFiAlarm,
  HealthMetric,
  DPIStats,
  UniFiDevice,
  UniFiClient,
  UniFiWlan,
  WlanConfig,
  UniFiUserGroup,
  UserGroupConfig,
  UniFiFirewallGroup,
  FirewallGroupConfig,
  UniFiTag,
  TagConfig,
  UniFiVoucher,
  VoucherConfig,
  GuestAuthorizationConfig,
  ClientConfig,
  DeviceConfig,
  UniFiPortConfig,
  UniFiRoute,
  UniFiDynamicDns,
  UniFiCountryCode,
  UniFiSpectrumScan,
  UniFiNeighborAp,
  UniFiRogueAp,
  UniFiReport,
  UniFiSetting,
  AdvancedAdoptConfig,
  DeviceMigrationConfig
} from './generated';