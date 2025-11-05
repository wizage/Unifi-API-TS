/**
 * Mock responses for UniFi Controller API
 * Provides realistic response data for testing
 */

export const MockResponses = {
  // Authentication responses
  loginSuccess: {
    data: [],
    meta: { rc: 'ok', msg: 'Login successful' }
  },

  loginFailure: {
    data: [],
    meta: { rc: 'error', msg: 'Invalid username or password' }
  },

  logoutSuccess: {
    data: [],
    meta: { rc: 'ok' }
  },

  // Device responses
  devices: [
    {
      _id: '507f1f77bcf86cd799439011',
      mac: '00:11:22:33:44:55',
      model: 'U6-Lite',
      name: 'Living Room AP',
      type: 'uap',
      state: 1,
      adopted: true,
      disabled: false,
      ip: '192.168.1.100',
      version: '6.0.14.13265',
      uptime: 86400,
      bytes: 1024000,
      num_sta: 5,
      user_num_sta: 3,
      guest_num_sta: 2,
      rx_bytes: 512000,
      tx_bytes: 512000,
      satisfaction: 98
    },
    {
      _id: '507f1f77bcf86cd799439012',
      mac: 'aa:bb:cc:dd:ee:ff',
      model: 'USW-24-POE',
      name: 'Main Switch',
      type: 'usw',
      state: 1,
      adopted: true,
      disabled: false,
      ip: '192.168.1.101',
      version: '6.0.14.13265',
      uptime: 172800,
      port_overrides: []
    }
  ],

  // Client/User responses
  clients: [
    {
      _id: '507f1f77bcf86cd799439013',
      mac: 'bb:cc:dd:ee:ff:00',
      ip: '192.168.1.50',
      hostname: 'laptop',
      name: 'John\'s Laptop',
      is_guest: false,
      is_wired: false,
      first_seen: 1640995200,
      last_seen: 1640995800,
      uptime: 3600,
      ap_mac: '00:11:22:33:44:55',
      channel: 36,
      radio: 'na',
      signal: -45,
      noise: -95,
      rx_bytes: 1024000,
      tx_bytes: 512000,
      satisfaction: 95
    },
    {
      _id: '507f1f77bcf86cd799439014',
      mac: 'cc:dd:ee:ff:00:11',
      ip: '192.168.1.51',
      hostname: 'phone',
      name: 'iPhone',
      is_guest: true,
      is_wired: false,
      first_seen: 1640995500,
      last_seen: 1640995900,
      uptime: 1800,
      ap_mac: '00:11:22:33:44:55',
      channel: 36,
      radio: 'na',
      signal: -55,
      noise: -95,
      rx_bytes: 512000,
      tx_bytes: 256000,
      satisfaction: 85
    }
  ],

  // WLAN responses
  wlans: [
    {
      _id: '507f1f77bcf86cd799439015',
      name: 'MyNetwork',
      enabled: true,
      security: 'wpapsk',
      wpa_enc: 'ccmp',
      wpa_mode: 'wpa2',
      x_passphrase: 'password123',
      usergroup_id: '507f1f77bcf86cd799439020',
      schedule: [],
      mac_filter_enabled: false,
      mac_filter_policy: 'allow',
      mac_filter_list: []
    },
    {
      _id: '507f1f77bcf86cd799439016',
      name: 'Guest-Network',
      enabled: true,
      security: 'open',
      is_guest: true,
      schedule: [],
      mac_filter_enabled: false,
      mac_filter_policy: 'allow',
      mac_filter_list: []
    }
  ],

  // Network responses
  networks: [
    {
      _id: '507f1f77bcf86cd799439017',
      name: 'LAN',
      purpose: 'corporate',
      ip_subnet: '192.168.1.1/24',
      networkgroup: 'LAN',
      enabled: true,
      is_nat: true,
      dhcp_enabled: true,
      dhcp_start: '192.168.1.100',
      dhcp_stop: '192.168.1.200',
      dhcp_lease: 86400
    },
    {
      _id: '507f1f77bcf86cd799439018',
      name: 'Guest',
      purpose: 'guest',
      ip_subnet: '192.168.100.1/24',
      networkgroup: 'LAN2',
      enabled: true,
      is_nat: true,
      dhcp_enabled: true,
      dhcp_start: '192.168.100.100',
      dhcp_stop: '192.168.100.200',
      dhcp_lease: 3600
    }
  ],

  // Site responses
  sites: [
    {
      _id: '507f1f77bcf86cd799439019',
      name: 'default',
      desc: 'Default Site',
      role: 'admin',
      num_new_alarms: 0
    }
  ],

  // System info response
  sysinfo: {
    hostname: 'UniFi-Dream-Machine',
    version: '1.12.22',
    uptime: 86400,
    mem: '16384',
    cpu: '4',
    loadavg_1: '0.5',
    loadavg_5: '0.3',
    loadavg_15: '0.2'
  },

  // Events response
  events: [
    {
      _id: '507f1f77bcf86cd79943901a',
      key: 'EVT_AP_Connected',
      datetime: '2024-01-01T12:00:00Z',
      time: 1704110400000,
      msg: 'Access Point connected',
      ap: '00:11:22:33:44:55',
      ap_name: 'Living Room AP'
    },
    {
      _id: '507f1f77bcf86cd79943901b',
      key: 'EVT_LU_Connected',
      datetime: '2024-01-01T12:05:00Z',
      time: 1704110700000,
      msg: 'User connected',
      user: 'bb:cc:dd:ee:ff:00',
      hostname: 'laptop'
    }
  ],

  // Alarms response
  alarms: [
    {
      _id: '507f1f77bcf86cd79943901c',
      key: 'EVT_AP_Disconnected',
      datetime: '2024-01-01T11:00:00Z',
      time: 1704106800000,
      msg: 'Access Point disconnected',
      ap: 'aa:bb:cc:dd:ee:ff',
      ap_name: 'Kitchen AP',
      archived: false
    }
  ],

  // Generic success response
  success: {
    data: true,
    meta: { rc: 'ok' }
  },

  // Generic error response
  error: {
    data: [],
    meta: { rc: 'error', msg: 'Operation failed' }
  }
};

export const createMockResponse = <T>(data: T) => ({
  data: Array.isArray(data) ? data : [data],
  meta: { rc: 'ok' }
});

export const createMockErrorResponse = (message: string) => ({
  data: [],
  meta: { rc: 'error', msg: message }
});