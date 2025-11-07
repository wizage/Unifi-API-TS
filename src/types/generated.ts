/**
 * Comprehensive type definitions for UniFi API client
 * This file contains all UniFi data structures, configuration interfaces, and API response types
 */

// ============================================================================
// GENERIC API TYPES
// ============================================================================

export interface APIResponse<T = any> {
  data: T;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  rc: string;
  msg?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface UniFiError {
  code: string;
  message: string;
  details?: any;
}

export interface AuthenticationError extends UniFiError {
  code: 'AUTHENTICATION_ERROR';
  statusCode: 401;
}

export interface NetworkError extends UniFiError {
  code: 'NETWORK_ERROR';
  cause?: Error;
}

export interface APIError extends UniFiError {
  code: 'API_ERROR';
  statusCode: number;
  response?: any;
}

export interface ValidationError extends UniFiError {
  code: 'VALIDATION_ERROR';
  field?: string;
}

// ============================================================================
// REQUEST OPTIONS AND CONFIGURATION TYPES
// ============================================================================

export interface RequestOptions {
  signal?: AbortSignal;
  timeout?: number;
  retries?: number;
}

export interface UniFiClientConfig {
  baseUrl: string;
  username: string;
  password: string;
  site?: string;
  timeout?: number;
  verifySsl?: boolean;
  debug?: boolean;
}

// ============================================================================
// WLAN CONFIGURATION TYPES
// ============================================================================

export interface WlanConfig {
  name: string;
  x_passphrase: string;
  usergroup_id?: string;
  wlangroup_id?: string;
  enabled?: boolean;
  hide_ssid?: boolean;
  is_guest?: boolean;
  security?: 'open' | 'wpapsk' | 'wpaeap';
  wpa_mode?: 'wpa' | 'wpa2' | 'wpa3';
  wpa_enc?: 'auto' | 'ccmp' | 'tkip';
  vlan_enabled?: boolean;
  vlan?: number;
  uapsd_enabled?: boolean;
  schedule_enabled?: boolean;
  schedule?: string[];
  ap_group_ids?: string[];
  no2ghz_oui?: boolean;
  mac_filter_enabled?: boolean;
  mac_filter_policy?: 'allow' | 'deny';
  mac_filter_list?: string[];
  radius_das_enabled?: boolean;
  radius_mac_auth_enabled?: boolean;
  minrate_ng_enabled?: boolean;
  minrate_ng_data_rate_kbps?: number;
  minrate_na_enabled?: boolean;
  minrate_na_data_rate_kbps?: number;
  bc_filter_enabled?: boolean;
  bc_filter_list?: string[];
  group_rekey?: number;
  wpa3_support?: boolean;
  wpa3_transition?: boolean;
  pmf_mode?: 'disabled' | 'optional' | 'required';
  dtim_mode?: 'default' | 'custom';
  dtim_ng?: number;
  dtim_na?: number;
}

export interface WlanUpdateConfig extends Partial<WlanConfig> {
  _id?: string;
}

// ============================================================================
// NETWORK CONFIGURATION TYPES
// ============================================================================

export interface NetworkConfig {
  name: string;
  purpose: 'corporate' | 'guest' | 'wan' | 'vlan-only';
  vlan_enabled?: boolean;
  vlan?: number;
  ip_subnet?: string;
  networkgroup?: string;
  dhcp_enabled?: boolean;
  dhcp_start?: string;
  dhcp_stop?: string;
  dhcp_lease?: number;
  dhcp_dns?: string[];
  dhcp_ntp?: string[];
  domain_name?: string;
  igmp_snooping?: boolean;
  upnp_lan_enabled?: boolean;
  dhcp_relay_enabled?: boolean;
  dhcp_tftp_server?: string;
  dhcp_boot_filename?: string;
  ipv6_interface_type?: 'none' | 'static' | 'pd';
  ipv6_pd_interface?: string;
  ipv6_pd_prefixid?: string;
  ipv6_pd_start?: string;
  ipv6_pd_stop?: string;
  ipv6_ra_enabled?: boolean;
  ipv6_ra_priority?: 'high' | 'medium' | 'low';
  ipv6_ra_valid_lifetime?: number;
  ipv6_ra_preferred_lifetime?: number;
  wan_networkgroup?: string;
  wan_type?: 'dhcp' | 'static' | 'pppoe';
  wan_ip?: string;
  wan_netmask?: string;
  wan_gateway?: string;
  wan_dns1?: string;
  wan_dns2?: string;
  wan_username?: string;
  wan_password?: string;
  wan_egress_qos?: number;
  wan_smartq_enabled?: boolean;
}

export interface NetworkUpdateConfig extends Partial<NetworkConfig> {
  _id?: string;
}

// ============================================================================
// USER GROUP CONFIGURATION TYPES
// ============================================================================

export interface UserGroupConfig {
  name: string;
  qos_rate_max_down?: number;
  qos_rate_max_up?: number;
  site_id?: string;
}

export interface UserGroupUpdateConfig extends Partial<UserGroupConfig> {
  _id?: string;
}

// ============================================================================
// FIREWALL GROUP CONFIGURATION TYPES
// ============================================================================

export type FirewallGroupType = 'address-group' | 'ipv6-address-group' | 'port-group';

export interface FirewallGroupConfig {
  name: string;
  group_type: FirewallGroupType;
  group_members?: string[];
  site_id?: string;
}

export interface FirewallGroupUpdateConfig extends Partial<FirewallGroupConfig> {
  _id?: string;
}

// ============================================================================
// DEVICE CONFIGURATION TYPES
// ============================================================================

export interface DeviceConfig {
  name?: string;
  disabled?: boolean;
  led_override?: 'default' | 'on' | 'off';
  led_override_color?: string;
  led_override_color_brightness?: number;
  outlet_overrides?: OutletOverride[];
  port_overrides?: PortOverride[];
  radio_table?: RadioConfig[];
  wlan_overrides?: WlanOverride[];
  wlangroup_id_ng?: string;
  wlangroup_id_na?: string;
}

export interface OutletOverride {
  index: number;
  name?: string;
  relay_state?: boolean;
}

export interface PortOverride {
  port_idx: number;
  portconf_id?: string;
  name?: string;
  poe_mode?: 'auto' | 'pasv24' | 'passthrough' | 'off';
  op_mode?: 'switch' | 'mirror' | 'aggregate';
  autoneg?: boolean;
  isolation?: boolean;
  storm_ctrl_ucast_enabled?: boolean;
  storm_ctrl_mcast_enabled?: boolean;
  storm_ctrl_bcast_enabled?: boolean;
  stp_port_mode?: boolean;
  egress_rate_limit_kbps_enabled?: boolean;
  egress_rate_limit_kbps?: number;
}

export interface RadioConfig {
  radio: 'ng' | 'na' | '6g';
  channel?: number | 'auto';
  ht?: 20 | 40 | 80 | 160;
  tx_power_mode?: 'auto' | 'medium' | 'high' | 'low' | 'custom';
  tx_power?: number;
  min_rssi_enabled?: boolean;
  min_rssi?: number;
  sens_level?: number;
  antenna_gain?: number;
  hard_noise_floor_enabled?: boolean;
  hard_noise_floor_2g?: number;
  hard_noise_floor_5g?: number;
}

export interface WlanOverride {
  radio: 'ng' | 'na' | '6g';
  wlan_id: string;
  enabled?: boolean;
}

// ============================================================================
// VOUCHER CONFIGURATION TYPES
// ============================================================================

export interface VoucherConfig {
  minutes: number;
  count?: number;
  quota?: number;
  note?: string;
  up?: number;
  down?: number;
  megabytes?: number;
}

// ============================================================================
// STATISTICS QUERY TYPES
// ============================================================================

export interface StatisticsQuery {
  start?: number;
  end?: number;
  mac?: string;
  attribs?: string[];
}

export interface SiteStatisticsQuery extends StatisticsQuery {
  scale?: '5minutes' | 'hourly' | 'daily' | 'monthly';
}

export interface UserStatisticsQuery extends StatisticsQuery {
  type?: 'all' | 'guest' | 'user';
  conn?: 'all' | 'wireless' | 'wired';
  within?: number;
}

// ============================================================================
// CLIENT MANAGEMENT TYPES
// ============================================================================

export interface ClientConfig {
  mac: string;
  usergroup_id?: string;
  name?: string;
  note?: string;
  is_guest?: boolean;
  is_wired?: boolean;
  blocked?: boolean;
  use_fixedip?: boolean;
  fixed_ip?: string;
  network_id?: string;
}

export interface GuestAuthorizationConfig {
  mac: string;
  minutes: number;
  up?: number;
  down?: number;
  megabytes?: number;
  ap_mac?: string;
}

// ============================================================================
// TAG CONFIGURATION TYPES
// ============================================================================

export interface TagConfig {
  name: string;
  member_table?: string[];
}

export interface TagUpdateConfig extends Partial<TagConfig> {
  _id?: string;
}

// ============================================================================
// UNIFI DATA STRUCTURES
// ============================================================================

export interface UniFiDevice {
  _id: string;
  mac: string;
  model: string;
  name?: string;
  type: 'uap' | 'usw' | 'ugw' | 'usg' | 'udm' | 'uxg' | 'ubb' | 'ulte' | 'unvr' | 'uck' | 'uph';
  state: 0 | 1 | 2 | 3 | 4 | 5; // 0=offline, 1=connected, 2=pending, 3=disconnected, 4=upgrading, 5=provisioning
  adopted: boolean;
  disabled?: boolean;
  ip?: string;
  version?: string;
  serial?: string;
  firmware_version?: string;
  upgrade_to_firmware?: string;
  uptime?: number;
  last_seen?: number;
  next_heartbeat_at?: number;
  cfgversion?: string;
  config_network?: {
    type: string;
    ip: string;
  };
  vlan_enabled?: boolean;
  jumboframe_enabled?: boolean;
  flowctrl_enabled?: boolean;
  stp_version?: string;
  stp_priority?: string;
  mgmt_network_id?: string;
  led_override?: 'default' | 'on' | 'off';
  led_override_color?: string;
  led_override_color_brightness?: number;
  outdoor_mode_override?: 'default' | 'on' | 'off';
  lcm_brightness_override?: boolean;
  lcm_brightness?: number;
  lcm_idle_timeout_override?: boolean;
  lcm_idle_timeout?: number;
  power_source_ctrl_enabled?: boolean;
  
  // Access Point specific fields
  radio_table?: DeviceRadio[];
  radio_table_stats?: DeviceRadioStats[];
  antenna_table?: DeviceAntenna[];
  scan_radio_table?: DeviceScanRadio[];
  
  // Switch specific fields
  port_table?: DevicePort[];
  ethernet_table?: DeviceEthernet[];
  
  // Gateway specific fields
  wan1?: DeviceWan;
  wan2?: DeviceWan;
  speedtest_status?: DeviceSpeedtest;
  
  // Statistics
  stat?: DeviceStats;
  tx_bytes?: number;
  rx_bytes?: number;
  bytes?: number;
  num_sta?: number;
  user_num_sta?: number;
  guest_num_sta?: number;
  
  // System info
  board_rev?: number;
  device_id?: string;
  hash_id?: string;
  in_router_mode?: boolean;
  inform_ip?: string;
  inform_url?: string;
  kernel_version?: string;
  architecture?: string;
  
  // Adoption info
  adoption_completed?: boolean;
  provisioned_at?: number;
  
  // Location
  x?: number;
  y?: number;
  map_id?: string;
  
  // Tags and groups
  device_tag_ids?: string[];
  wlangroup_id_ng?: string;
  wlangroup_id_na?: string;
}

export interface DeviceRadio {
  radio: 'ng' | 'na' | '6g';
  name: string;
  ht?: 20 | 40 | 80 | 160;
  channel?: number;
  tx_power?: number;
  tx_power_mode?: 'auto' | 'medium' | 'high' | 'low' | 'custom';
  min_rssi_enabled?: boolean;
  min_rssi?: number;
  sens_level?: number;
  antenna_gain?: number;
  builtin_antenna?: boolean;
  builtin_ant_gain?: number;
  max_txpower?: number;
  min_txpower?: number;
  nss?: number;
  radio_caps?: number;
  has_dfs?: boolean;
  has_fccdfs?: boolean;
  has_ht40?: boolean;
  has_ht80?: boolean;
  has_ht160?: boolean;
  current_antenna_gain?: number;
}

export interface DeviceRadioStats {
  radio: 'ng' | 'na' | '6g';
  name: string;
  channel?: number;
  tx_power?: number;
  tx_packets?: number;
  tx_bytes?: number;
  tx_retries?: number;
  tx_dropped?: number;
  rx_packets?: number;
  rx_bytes?: number;
  rx_errors?: number;
  rx_dropped?: number;
  rx_crypts?: number;
  rx_frags?: number;
  satisfaction?: number;
  num_sta?: number;
  cu_total?: number;
  cu_self_rx?: number;
  cu_self_tx?: number;
  extchannel?: number;
  state?: string;
  ast_txto?: number;
  ast_cst?: number;
  ast_be_xmit?: number;
}

export interface DeviceAntenna {
  default?: boolean;
  id: number;
  name: string;
  wifi0_gain?: number;
  wifi1_gain?: number;
}

export interface DeviceScanRadio {
  radio: 'ng' | 'na' | '6g';
  bssid: string;
  essid: string;
  freq: number;
  rssi: number;
  age: number;
  is_adhoc?: boolean;
}

export interface DevicePort {
  port_idx: number;
  media?: string;
  port_poe?: boolean;
  poe_caps?: number;
  poe_class?: string;
  poe_enable?: boolean;
  poe_mode?: 'auto' | 'pasv24' | 'passthrough' | 'off';
  poe_power?: number;
  poe_voltage?: number;
  portconf_id?: string;
  autoneg?: boolean;
  enable?: boolean;
  flowctrl_rx?: boolean;
  flowctrl_tx?: boolean;
  full_duplex?: boolean;
  is_uplink?: boolean;
  mac_table?: DevicePortMac[];
  name?: string;
  op_mode?: 'switch' | 'mirror' | 'aggregate';
  rx_broadcast?: number;
  rx_bytes?: number;
  rx_dropped?: number;
  rx_errors?: number;
  rx_multicast?: number;
  rx_packets?: number;
  speed?: number;
  stp_pathcost?: number;
  stp_state?: string;
  tx_broadcast?: number;
  tx_bytes?: number;
  tx_dropped?: number;
  tx_errors?: number;
  tx_multicast?: number;
  tx_packets?: number;
  type?: string;
  up?: boolean;
  ifname?: string;
  ip?: string;
  netmask?: string;
  dns?: string[];
  gateway?: string;
}

export interface DevicePortMac {
  mac: string;
  vlan: number;
  uptime: number;
  age: number;
  static: boolean;
}

export interface DeviceEthernet {
  mac: string;
  num_port: number;
  name: string;
}

export interface DeviceWan {
  ifname: string;
  name: string;
  type: 'dhcp' | 'static' | 'pppoe';
  ip?: string;
  netmask?: string;
  gateway?: string;
  dns?: string[];
  up?: boolean;
  enable?: boolean;
  full_duplex?: boolean;
  is_up?: boolean;
  mac?: string;
  max_speed?: number;
  rx_bytes?: number;
  rx_dropped?: number;
  rx_errors?: number;
  rx_multicast?: number;
  rx_packets?: number;
  speed?: number;
  tx_bytes?: number;
  tx_dropped?: number;
  tx_errors?: number;
  tx_packets?: number;
}

export interface DeviceSpeedtest {
  lastrun?: number;
  ping?: number;
  rundate?: number;
  runtime?: number;
  source_interface?: string;
  status_download?: number;
  status_ping?: number;
  status_summary?: number;
  status_upload?: number;
  xput_download?: number;
  xput_upload?: number;
}

export interface DeviceStats {
  'o-tx_bytes'?: number;
  'o-rx_bytes'?: number;
  'o-tx_packets'?: number;
  'o-rx_packets'?: number;
  'o-tx_errors'?: number;
  'o-rx_errors'?: number;
  'o-tx_dropped'?: number;
  'o-rx_dropped'?: number;
}

export interface UniFiClient {
  _id: string;
  mac: string;
  ip?: string;
  hostname?: string;
  name?: string;
  oui?: string;
  is_guest?: boolean;
  first_seen?: number;
  last_seen?: number;
  is_wired?: boolean;
  usergroup_id?: string;
  ap_mac?: string;
  sw_mac?: string;
  sw_port?: number;
  sw_depth?: number;
  gw_mac?: string;
  channel?: number;
  radio?: 'ng' | 'na' | '6g';
  radio_proto?: string;
  signal?: number;
  noise?: number;
  rssi?: number;
  rx_bytes?: number;
  tx_bytes?: number;
  rx_packets?: number;
  tx_packets?: number;
  rx_bytes_r?: number;
  tx_bytes_r?: number;
  wifi_tx_attempts?: number;
  satisfaction?: number;
  anomalies?: number;
  vlan?: number;
  network?: string;
  network_id?: string;
  essid?: string;
  bssid?: string;
  powersave_enabled?: boolean;
  is_11r?: boolean;
  user_id?: string;
  uptime?: number;
  tx_rate?: number;
  rx_rate?: number;
  tx_power?: number;
  idletime?: number;
  dhcp_end_time?: number;
  assoc_time?: number;
  latest_assoc_time?: number;
  roam_count?: number;
  disconnect_timestamp?: number;
  _uptime_by_uap?: number;
  _last_seen_by_uap?: number;
  _is_guest_by_uap?: boolean;
  authorized?: boolean;
  qos_policy_applied?: boolean;
  blocked?: boolean;
  noted?: boolean;
  use_fixedip?: boolean;
  fixed_ip?: string;
  fingerprint_override?: boolean;
  dev_id_override?: number;
  device_name?: string;
  fw_version?: string;
  score?: number;
  nss?: number;
  ccq?: number;
  dhcp_vendor?: string;
  dhcp_hostname?: string;
}

export interface UniFiSite {
  _id: string;
  name: string;
  desc: string;
  role: 'admin' | 'readonly' | 'limited';
  num_new_alarms?: number;
  health?: SiteHealth[];
  subsystem_health?: SubsystemHealth[];
  num_adopted?: number;
  num_ap?: number;
  num_sw?: number;
  num_gw?: number;
  num_disconnected?: number;
  num_pending?: number;
  num_guest?: number;
  num_user?: number;
  rx_bytes?: number;
  tx_bytes?: number;
  uptime?: number;
  wan_ip?: string;
  time_series?: SiteTimeSeries;
  attr_hidden_id?: string;
  attr_no_delete?: boolean;
  attr_no_edit?: boolean;
}

export interface SiteHealth {
  subsystem: 'wlan' | 'lan' | 'wan' | 'www' | 'vpn';
  num_user: number;
  num_guest: number;
  num_iot: number;
  tx_bytes_r: number;
  rx_bytes_r: number;
  status: 'ok' | 'warning' | 'error';
  gateways?: string[];
  netmask?: string;
  nameservers?: string[];
  num_sta?: number;
  num_adopted?: number;
  num_disconnected?: number;
  num_pending?: number;
  num_disabled?: number;
}

export interface SubsystemHealth {
  subsystem: 'wlan' | 'lan' | 'wan' | 'www' | 'vpn';
  num_adopted: number;
  num_disconnected: number;
  num_pending: number;
  num_disabled: number;
}

export interface SiteTimeSeries {
  [key: string]: any;
}

export interface SiteStats {
  bytes: number;
  num_sta: number;
  'rx_bytes-r': number;
  'tx_bytes-r': number;
  time: number;
  datetime: string;
  wan_tx_bytes?: number;
  wan_rx_bytes?: number;
  wlan_bytes?: number;
  lan_bytes?: number;
  'wan-tx_bytes'?: number;
  'wan-rx_bytes'?: number;
  'lan-num_sta'?: number;
  'wlan-num_sta'?: number;
}

export interface SystemInfo {
  autobackup: boolean;
  build: string;
  console_display_version: string;
  data_retention_days: number;
  data_retention_time_in_hours_for_5minutes_scale: number;
  data_retention_time_in_hours_for_hourly_scale: number;
  data_retention_time_in_hours_for_daily_scale: number;
  data_retention_time_in_hours_for_monthly_scale: number;
  debug_device: string;
  debug_mgmt: string;
  debug_setting_preference: string;
  debug_sdn: string;
  debug_system: string;
  hostname: string;
  https_port: number;
  ip_addrs: string[];
  live_chat: string;
  name: string;
  previous_version: string;
  timezone: string;
  ubnt_device_type: string;
  udm_version: string;
  unifi_go_enabled: boolean;
  unsupported_device_count: number;
  unsupported_device_list: any[];
  update_available: boolean;
  update_downloaded: boolean;
  uptime: number;
  version: string;
}

export interface UniFiEvent {
  _id: string;
  datetime: string;
  time: number;
  key: string;
  msg: string;
  subsystem: string;
  site_id: string;
  admin?: string;
  ap?: string;
  ap_name?: string;
  channel_from?: number;
  channel_to?: number;
  duration?: number;
  guest?: string;
  hostname?: string;
  ip?: string;
  mac?: string;
  radio?: string;
  ssid?: string;
  user?: string;
  version_from?: string;
  version_to?: string;
  sw?: string;
  sw_name?: string;
  gw?: string;
  gw_name?: string;
  network?: string;
  port?: number;
  port_idx?: number;
  speed?: number;
  bytes?: number;
  rx_bytes?: number;
  tx_bytes?: number;
  num_sta?: number;
  satisfaction?: number;
}

export interface UniFiAlarm {
  _id: string;
  datetime: string;
  time: number;
  key: string;
  msg: string;
  subsystem: string;
  site_id: string;
  archived: boolean;
  handled: boolean;
  handled_admin?: string;
  handled_time?: number;
  ap?: string;
  ap_name?: string;
  sw?: string;
  sw_name?: string;
  gw?: string;
  gw_name?: string;
  usg?: string;
  usg_name?: string;
  categ?: string;
  inner_alert_type?: string;
  source?: string;
  dest?: string;
  dpi_app?: string;
  dpi_cat?: string;
  proto?: string;
  src_port?: number;
  dst_port?: number;
  flow_id?: number;
  in_iface?: string;
  out_iface?: string;
}

export interface HealthMetric {
  subsystem: string;
  num_user: number;
  num_guest: number;
  num_iot: number;
  tx_bytes_r: number;
  rx_bytes_r: number;
  status: string;
  num_adopted?: number;
  num_disconnected?: number;
  num_pending?: number;
  num_disabled?: number;
}

export interface DPIStats {
  time: number;
  rx_bytes: number;
  tx_bytes: number;
  rx_packets: number;
  tx_packets: number;
  app?: string;
  cat?: string;
  known_clients?: number;
}

export interface PortStats {
  port_idx: number;
  rx_bytes: number;
  tx_bytes: number;
  rx_packets: number;
  tx_packets: number;
  rx_dropped: number;
  tx_dropped: number;
  rx_errors: number;
  tx_errors: number;
  speed: number;
  full_duplex: boolean;
  up: boolean;
}

export interface UniFiWlan {
  _id: string;
  name: string;
  enabled: boolean;
  security: 'open' | 'wpapsk' | 'wpaeap';
  wpa_mode?: 'wpa' | 'wpa2' | 'wpa3';
  wpa_enc?: 'auto' | 'ccmp' | 'tkip';
  usergroup_id?: string;
  wlangroup_id?: string;
  is_guest?: boolean;
  hide_ssid?: boolean;
  x_passphrase?: string;
  vlan_enabled?: boolean;
  vlan?: number;
  uapsd_enabled?: boolean;
  schedule_enabled?: boolean;
  schedule?: string[];
  ap_group_ids?: string[];
  no2ghz_oui?: boolean;
  mac_filter_enabled?: boolean;
  mac_filter_policy?: 'allow' | 'deny';
  mac_filter_list?: string[];
  radius_das_enabled?: boolean;
  radius_mac_auth_enabled?: boolean;
  minrate_ng_enabled?: boolean;
  minrate_ng_data_rate_kbps?: number;
  minrate_na_enabled?: boolean;
  minrate_na_data_rate_kbps?: number;
  bc_filter_enabled?: boolean;
  bc_filter_list?: string[];
  group_rekey?: number;
  wpa3_support?: boolean;
  wpa3_transition?: boolean;
  pmf_mode?: 'disabled' | 'optional' | 'required';
  dtim_mode?: 'default' | 'custom';
  dtim_ng?: number;
  dtim_na?: number;
  site_id?: string;
  attr_hidden_id?: string;
  attr_no_delete?: boolean;
  attr_no_edit?: boolean;
}

export interface UniFiNetwork {
  _id: string;
  name: string;
  purpose: 'corporate' | 'guest' | 'wan' | 'vlan-only';
  vlan_enabled?: boolean;
  vlan?: number;
  ip_subnet?: string;
  networkgroup?: string;
  dhcp_enabled?: boolean;
  dhcp_start?: string;
  dhcp_stop?: string;
  dhcp_lease?: number;
  dhcp_dns?: string[];
  dhcp_ntp?: string[];
  domain_name?: string;
  igmp_snooping?: boolean;
  upnp_lan_enabled?: boolean;
  dhcp_relay_enabled?: boolean;
  dhcp_tftp_server?: string;
  dhcp_boot_filename?: string;
  ipv6_interface_type?: 'none' | 'static' | 'pd';
  ipv6_pd_interface?: string;
  ipv6_pd_prefixid?: string;
  ipv6_pd_start?: string;
  ipv6_pd_stop?: string;
  ipv6_ra_enabled?: boolean;
  ipv6_ra_priority?: 'high' | 'medium' | 'low';
  ipv6_ra_valid_lifetime?: number;
  ipv6_ra_preferred_lifetime?: number;
  wan_networkgroup?: string;
  wan_type?: 'dhcp' | 'static' | 'pppoe';
  wan_ip?: string;
  wan_netmask?: string;
  wan_gateway?: string;
  wan_dns1?: string;
  wan_dns2?: string;
  wan_username?: string;
  wan_password?: string;
  wan_egress_qos?: number;
  wan_smartq_enabled?: boolean;
  site_id?: string;
  attr_hidden_id?: string;
  attr_no_delete?: boolean;
  attr_no_edit?: boolean;
}

// ============================================================================
// USER GROUP TYPES
// ============================================================================

export interface UniFiUserGroup {
  _id: string;
  name: string;
  qos_rate_max_down?: number;
  qos_rate_max_up?: number;
  site_id?: string;
  attr_hidden_id?: string;
  attr_no_delete?: boolean;
  attr_no_edit?: boolean;
}

// ============================================================================
// FIREWALL GROUP TYPES
// ============================================================================

export interface UniFiFirewallGroup {
  _id: string;
  name: string;
  group_type: FirewallGroupType;
  group_members?: string[];
  site_id?: string;
  attr_hidden_id?: string;
  attr_no_delete?: boolean;
  attr_no_edit?: boolean;
}

export interface UniFiFirewallRule {
  _id: string;
  name: string;
  enabled: boolean;
  action: 'accept' | 'drop' | 'reject';
  ruleset: 'WAN_IN' | 'WAN_OUT' | 'WAN_LOCAL' | 'LAN_IN' | 'LAN_OUT' | 'LAN_LOCAL' | 'GUEST_IN' | 'GUEST_OUT' | 'GUEST_LOCAL' | 'WANv6_IN' | 'WANv6_OUT' | 'WANv6_LOCAL' | 'LANv6_IN' | 'LANv6_OUT' | 'LANv6_LOCAL' | 'GUESTv6_IN' | 'GUESTv6_OUT' | 'GUESTv6_LOCAL';
  rule_index: number;
  protocol?: 'all' | 'tcp' | 'udp' | 'icmp';
  icmp_typename?: string;
  src_firewallgroup_ids?: string[];
  src_mac_address?: string;
  src_address?: string;
  src_networkconf_id?: string;
  src_networkconf_type?: string;
  dst_firewallgroup_ids?: string[];
  dst_address?: string;
  dst_networkconf_id?: string;
  dst_networkconf_type?: string;
  dst_port?: string;
  logging?: boolean;
  state_established?: boolean;
  state_invalid?: boolean;
  state_new?: boolean;
  state_related?: boolean;
  ipsec?: string;
  site_id?: string;
}

// ============================================================================
// TAG TYPES
// ============================================================================

export interface UniFiTag {
  _id: string;
  name: string;
  member_table?: string[];
  site_id?: string;
  attr_hidden_id?: string;
  attr_no_delete?: boolean;
  attr_no_edit?: boolean;
}

// ============================================================================
// VOUCHER TYPES
// ============================================================================

export interface UniFiVoucher {
  _id: string;
  admin_name?: string;
  code: string;
  create_time: number;
  duration: number;
  end_time?: number;
  for_hotspot?: boolean;
  note?: string;
  qos_overwrite?: boolean;
  qos_rate_max_down?: number;
  qos_rate_max_up?: number;
  qos_usage_quota?: number;
  quota?: number;
  start_time?: number;
  status?: 'VALID_ONE' | 'VALID_MULTI' | 'EXPIRED' | 'USED';
  status_expires?: number;
  used?: number;
  site_id?: string;
}

// ============================================================================
// PORT CONFIGURATION TYPES
// ============================================================================

export interface UniFiPortConfig {
  _id: string;
  name: string;
  forward: 'customize' | 'native' | 'all';
  native_networkconf_id?: string;
  tagged_networkconf_ids?: string[];
  port_security_enabled?: boolean;
  port_security_mac_address?: string[];
  storm_ctrl_ucast_enabled?: boolean;
  storm_ctrl_mcast_enabled?: boolean;
  storm_ctrl_bcast_enabled?: boolean;
  storm_ctrl_ucast_rate?: number;
  storm_ctrl_mcast_rate?: number;
  storm_ctrl_bcast_rate?: number;
  stp_port_mode?: boolean;
  egress_rate_limit_kbps_enabled?: boolean;
  egress_rate_limit_kbps?: number;
  isolation?: boolean;
  op_mode?: 'switch' | 'mirror' | 'aggregate';
  mirror_port_idx?: number;
  aggregate_num_ports?: number;
  autoneg?: boolean;
  poe_mode?: 'auto' | 'pasv24' | 'passthrough' | 'off';
  site_id?: string;
  attr_hidden_id?: string;
  attr_no_delete?: boolean;
  attr_no_edit?: boolean;
}

// ============================================================================
// WLAN GROUP TYPES
// ============================================================================

export interface UniFiWlanGroup {
  _id: string;
  name: string;
  attr_hidden_id?: string;
  attr_no_delete?: boolean;
  attr_no_edit?: boolean;
  site_id?: string;
}

// ============================================================================
// ROUTING TYPES
// ============================================================================

export interface UniFiRoute {
  _id: string;
  name: string;
  enabled: boolean;
  static_route_distance?: number;
  static_route_interface?: string;
  static_route_nexthop?: string;
  static_route_network?: string;
  static_route_type?: 'nexthop-route' | 'interface-route' | 'blackhole';
  pfx_len?: number;
  site_id?: string;
  attr_hidden_id?: string;
  attr_no_delete?: boolean;
  attr_no_edit?: boolean;
}

// ============================================================================
// DYNAMIC DNS TYPES
// ============================================================================

export interface UniFiDynamicDns {
  _id: string;
  enabled: boolean;
  interface: string;
  service: 'afraid' | 'changeip' | 'dnspark' | 'dslreports' | 'dyndns' | 'easydns' | 'namecheap' | 'noip' | 'zoneedit' | 'custom';
  host_name: string;
  server?: string;
  login?: string;
  password?: string;
  site_id?: string;
  attr_hidden_id?: string;
  attr_no_delete?: boolean;
  attr_no_edit?: boolean;
}

// ============================================================================
// EXTENSION TYPES
// ============================================================================

export interface UniFiExtension {
  _id: string;
  name: string;
  enabled: boolean;
  extension: string;
  site_id?: string;
}

// ============================================================================
// COUNTRY CODE TYPES
// ============================================================================

export interface UniFiCountryCode {
  key: number;
  name: string;
  code: string;
}

// ============================================================================
// SPECTRUM SCAN TYPES
// ============================================================================

export interface UniFiSpectrumScan {
  freq: number;
  width: number;
  rssi: number;
  utilization: number;
}

// ============================================================================
// NEIGHBOR AP TYPES
// ============================================================================

export interface UniFiNeighborAp {
  age: number;
  ap_mac: string;
  bssid: string;
  ccq: number;
  channel: number;
  essid: string;
  freq: number;
  is_adhoc: boolean;
  is_rogue: boolean;
  is_ubnt: boolean;
  last_seen: number;
  noise: number;
  oui: string;
  radio: 'ng' | 'na' | '6g';
  radio_name: string;
  report_time: number;
  rssi: number;
  security: string;
  signal: number;
}

// ============================================================================
// ROGUE AP TYPES
// ============================================================================

export interface UniFiRogueAp {
  _id: string;
  age: number;
  ap_mac: string;
  band: 'ng' | 'na';
  bssid: string;
  bw: number;
  ccq: number;
  channel: number;
  essid: string;
  freq: number;
  is_adhoc: boolean;
  is_rogue: boolean;
  is_ubnt: boolean;
  last_seen: number;
  noise: number;
  oui: string;
  radio: 'ng' | 'na' | '6g';
  radio_name: string;
  report_time: number;
  rssi: number;
  security: string;
  signal: number;
  site_id?: string;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface UniFiReport {
  time: number;
  datetime: string;
  [key: string]: any;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface UniFiSetting {
  _id: string;
  key: string;
  site_id?: string;
  [key: string]: any;
}

export interface UniFiMgmtSetting extends UniFiSetting {
  key: 'mgmt';
  auto_upgrade?: boolean;
  led_enabled?: boolean;
  alert_enabled?: boolean;
  x_ssh_enabled?: boolean;
  x_ssh_bind_wildcard?: boolean;
  x_ssh_auth_password_enabled?: boolean;
  x_ssh_keys?: string[];
  unifi_idp_enabled?: boolean;
  override_inform_host?: boolean;
  override_inform_host_location?: string;
  x_mgmt_key?: string;
  x_ssh_hostkey_rsa?: string;
  x_ssh_hostkey_ecdsa?: string;
  x_ssh_hostkey_ed25519?: string;
}

export interface UniFiConnectivitySetting extends UniFiSetting {
  key: 'connectivity';
  enabled?: boolean;
  uplink_type?: 'gateway' | 'wireless';
  x_mesh_essid?: string;
  x_mesh_psk?: string;
}

export interface UniFiCountrySetting extends UniFiSetting {
  key: 'country';
  code?: number;
}

export interface UniFiLocaleSetting extends UniFiSetting {
  key: 'locale';
  timezone?: string;
}

export interface UniFiSnmpSetting extends UniFiSetting {
  key: 'snmp';
  community?: string;
  contact?: string;
  location?: string;
}

export interface UniFiNtpSetting extends UniFiSetting {
  key: 'ntp';
  ntp_server_1?: string;
  ntp_server_2?: string;
  ntp_server_3?: string;
  ntp_server_4?: string;
}

// ============================================================================
// ADVANCED DEVICE MANAGEMENT TYPES
// ============================================================================

export interface AdvancedAdoptConfig {
  mac: string;
  ip: string;
  username: string;
  password: string;
  url: string;
  port?: number;
  sshKeyVerify?: boolean;
}

export interface DeviceMigrationConfig {
  macs: string | string[];
  inform_url: string;
}

// ============================================================================
// UTILITY TYPES FOR API METHODS
// ============================================================================

export type UniFiDeviceType = UniFiDevice['type'];
export type UniFiDeviceState = UniFiDevice['state'];
export type UniFiRadioType = 'ng' | 'na' | '6g';
export type UniFiSecurityType = 'open' | 'wpapsk' | 'wpaeap';
export type UniFiWpaMode = 'wpa' | 'wpa2' | 'wpa3';
export type UniFiWpaEncryption = 'auto' | 'ccmp' | 'tkip';
export type UniFiNetworkPurpose = 'corporate' | 'guest' | 'wan' | 'vlan-only';
export type UniFiSiteRole = 'admin' | 'readonly' | 'limited';
export type UniFiSubsystem = 'wlan' | 'lan' | 'wan' | 'www' | 'vpn';
export type UniFiHealthStatus = 'ok' | 'warning' | 'error';

// ============================================================================
// GENERIC RESPONSE WRAPPERS
// ============================================================================

export type UniFiListResponse<T> = APIResponse<T[]>;
export type UniFiSingleResponse<T> = APIResponse<T>;
export type UniFiBooleanResponse = APIResponse<boolean>;
export type UniFiStringResponse = APIResponse<string>;
export type UniFiNumberResponse = APIResponse<number>;

// ============================================================================
// METHOD PARAMETER TYPES
// ============================================================================

export interface ListOptions extends RequestOptions {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface StatisticsOptions extends RequestOptions {
  start?: number;
  end?: number;
  scale?: '5minutes' | 'hourly' | 'daily' | 'monthly';
  attributes?: string[];
}

export interface EventListOptions extends RequestOptions {
  historyhours?: number;
  start?: number;
  limit?: number;
}

export interface AlarmListOptions extends RequestOptions {
  archived?: boolean;
}

// ============================================================================
// TYPE GUARDS AND VALIDATION HELPERS
// ============================================================================

export function isUniFiDevice(obj: any): obj is UniFiDevice {
  return obj && typeof obj === 'object' && 
         typeof obj._id === 'string' && 
         typeof obj.mac === 'string' && 
         typeof obj.model === 'string';
}

export function isUniFiClient(obj: any): obj is UniFiClient {
  return obj && typeof obj === 'object' && 
         typeof obj._id === 'string' && 
         typeof obj.mac === 'string';
}

export function isUniFiSite(obj: any): obj is UniFiSite {
  return obj && typeof obj === 'object' && 
         typeof obj._id === 'string' && 
         typeof obj.name === 'string' && 
         typeof obj.desc === 'string';
}

export function isUniFiWlan(obj: any): obj is UniFiWlan {
  return obj && typeof obj === 'object' && 
         typeof obj._id === 'string' && 
         typeof obj.name === 'string' && 
         typeof obj.enabled === 'boolean';
}

export function isUniFiNetwork(obj: any): obj is UniFiNetwork {
  return obj && typeof obj === 'object' && 
         typeof obj._id === 'string' && 
         typeof obj.name === 'string' && 
         typeof obj.purpose === 'string';
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// All types are already exported above, no need for additional exports