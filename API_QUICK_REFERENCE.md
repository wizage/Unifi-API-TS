# UniFi API TypeScript Client - Quick Reference

## Installation & Setup

```typescript
import { UniFiClient } from './src/client/UniFiClient';

const client = new UniFiClient({
  baseUrl: 'https://unifi.example.com:8443',
  username: 'admin',
  password: 'password',
  site: 'default'
});

// Login
await client.login();
```

## Core Operations

### Authentication
```typescript
await client.login();                    // Login to controller
await client.logout();                   // Logout from controller
client.isAuthenticated();                // Check auth status
```

### Device Management
```typescript
// List devices
const devices = await client.list_devices();
const basicDevices = await client.list_devices_basic();

// Adopt & manage devices
await client.adopt_device(['aa:bb:cc:dd:ee:ff']);
await client.restart_device(['aa:bb:cc:dd:ee:ff']);
await client.force_provision(['aa:bb:cc:dd:ee:ff']);

// Advanced device operations
await client.disable_ap('device_id', true);
await client.led_override('device_id', 'on');
await client.locate_ap('aa:bb:cc:dd:ee:ff', true);
await client.rename_ap('device_id', 'New AP Name');
```

### Client Management
```typescript
// List clients
const clients = await client.list_users();
const activeClients = await client.list_active_clients();
const clientHistory = await client.list_clients_history();

// Client operations
await client.authorize_guest('aa:bb:cc:dd:ee:ff', 60); // 60 minutes
await client.unauthorize_guest('aa:bb:cc:dd:ee:ff');
await client.block_sta('aa:bb:cc:dd:ee:ff');
await client.unblock_sta('aa:bb:cc:dd:ee:ff');
await client.reconnect_sta('aa:bb:cc:dd:ee:ff');
await client.forget_sta('aa:bb:cc:dd:ee:ff');

// Client details & management
await client.set_sta_note('user_id', 'Important client');
await client.set_sta_name('user_id', 'John Doe Device');
const clientStats = await client.stat_client('aa:bb:cc:dd:ee:ff');
```

### WLAN Management
```typescript
// List WLANs
const wlans = await client.list_wlanconf();

// Create WLAN
await client.create_wlan(
  'Guest Network',           // name
  'password123',            // passphrase
  'usergroup_id',          // user group
  'wlangroup_id'           // WLAN group
);

// Manage WLANs
await client.set_wlansettings('wlan_id', 'newpassword');
await client.disable_wlan('wlan_id', true);
await client.delete_wlan('wlan_id');
```

### Network Management
```typescript
// List networks
const networks = await client.list_networkconf();

// Create network
await client.create_network({
  name: 'IoT Network',
  purpose: 'vlan-only',
  vlan_enabled: true,
  vlan: 100,
  ip_subnet: '192.168.100.1/24'
});

// Update network
await client.set_networksettings_base('network_id', {
  dhcp_enabled: true,
  dhcp_start: '192.168.100.10',
  dhcp_stop: '192.168.100.200'
});

await client.delete_network('network_id');
```

### Site Management
```typescript
// List sites
const sites = await client.list_sites();
const siteStats = await client.stat_sites();

// Create & manage sites
await client.create_site('New Site Description');
await client.set_site_name('Updated Site Name');
await client.set_site_country(840); // US country code
await client.delete_site('site_id');

// Site settings
await client.set_site_locale('America/New_York');
await client.set_site_snmp('public', 'admin@example.com', 'Data Center');
await client.site_leds(false); // Turn off all AP LEDs
```

### Statistics & Monitoring
```typescript
// System information
const sysInfo = await client.stat_sysinfo();
const status = await client.stat_status();
const health = await client.stat_health();

// Time-series statistics (5min, hourly, daily, monthly)
const siteStats = await client.stat_5minutes_site();
const apStats = await client.stat_hourly_aps();
const userStats = await client.stat_daily_user('aa:bb:cc:dd:ee:ff');
const gwStats = await client.stat_monthly_gateway();

// Events & alarms
const events = await client.list_events();
const alarms = await client.list_alarms();
await client.archive_alarm('alarm_id');

// Advanced statistics
const dpiStats = await client.stat_dpi();
const speedtest = await client.stat_speedtest();
const dashboard = await client.stat_dashboard();
```

### User Groups
```typescript
// List user groups
const groups = await client.list_usergroups();

// Create user group
await client.create_usergroup('VIP Users', 50000, 10000); // 50Mbps down, 10Mbps up

// Assign client to group
await client.set_usergroup('client_id', 'group_id');

// Manage groups
await client.edit_usergroup('group_id', 'site_id', 'Updated Name', 100000, 20000);
await client.delete_usergroup('group_id');
```

### Firewall Management
```typescript
// List firewall groups & rules
const fwGroups = await client.list_firewallgroups();
const fwRules = await client.list_firewallrules();

// Create firewall group
await client.create_firewallgroup(
  'Internal Servers',
  'address-group',
  ['192.168.1.10', '192.168.1.11', '192.168.1.12']
);

// Update firewall group
await client.edit_firewallgroup(
  'group_id',
  'site_id', 
  'Updated Servers',
  'address-group',
  ['192.168.1.10', '192.168.1.20']
);

await client.delete_firewallgroup('group_id');
```

### Device Tags
```typescript
// List tags
const tags = await client.list_tags();

// Create tag
await client.create_tag('Critical Infrastructure', ['aa:bb:cc:dd:ee:ff']);

// Manage tagged devices
await client.set_tagged_devices(['aa:bb:cc:dd:ee:ff', 'ff:ee:dd:cc:bb:aa'], 'tag_id');
await client.delete_tag('tag_id');
```

### Voucher Management
```typescript
// Create vouchers
const voucher = await client.create_voucher(
  480,        // 8 hours
  5,          // 5 vouchers
  1,          // single use
  'Guest Access', // note
  5000,       // 5Mbps up
  25000       // 25Mbps down
);

// Revoke voucher
await client.revoke_voucher('voucher_id');

// List vouchers
const vouchers = await client.stat_voucher();
```

### Firmware & Updates
```typescript
// Check for updates
const controllerUpdate = await client.check_controller_update();
const firmwareUpdate = await client.check_firmware_update();

// Upgrade devices
await client.upgrade_device('aa:bb:cc:dd:ee:ff');
await client.upgrade_device_external('firmware_url', ['aa:bb:cc:dd:ee:ff']);
```

## Error Handling

```typescript
try {
  await client.login();
  const devices = await client.listDevices();
} catch (error) {
  if (error.code === 'AUTHENTICATION_ERROR') {
    console.log('Login failed');
  } else if (error.code === 'NETWORK_ERROR') {
    console.log('Network connection failed');
  } else {
    console.log('API error:', error.message);
  }
}
```

## Request Cancellation

```typescript
const controller = new AbortController();

// Cancel request after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  const devices = await client.listDevices(undefined, { 
    signal: controller.signal 
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
  }
}
```

## Configuration Options

```typescript
const client = new UniFiClient({
  baseUrl: 'https://unifi.example.com:8443',
  username: 'admin',
  password: 'password',
  site: 'default',
  timeout: 30000,        // 30 second timeout
  verifySsl: false,      // Disable SSL verification
  debug: true            // Enable debug logging
});
```

## Common Patterns

### Bulk Operations
```typescript
// Restart multiple devices
const deviceMacs = ['aa:bb:cc:dd:ee:ff', 'ff:ee:dd:cc:bb:aa'];
await client.restart_device(deviceMacs);

// Block multiple clients
for (const mac of clientMacs) {
  await client.block_sta(mac);
}
```

### Monitoring Loop
```typescript
async function monitorSite() {
  while (true) {
    try {
      const health = await client.stat_health();
      const alarms = await client.list_alarms();
      
      console.log(`Health: ${health.length} metrics`);
      console.log(`Alarms: ${alarms.length} active`);
      
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30s
    } catch (error) {
      console.error('Monitoring error:', error);
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5s retry
    }
  }
}
```

### Site Statistics Dashboard
```typescript
async function getSiteDashboard() {
  const [sysInfo, health, devices, clients, alarms] = await Promise.all([
    client.stat_sysinfo(),
    client.stat_health(),
    client.list_devices_basic(),
    client.list_active_clients(),
    client.list_alarms()
  ]);
  
  return {
    controller: sysInfo,
    health: health,
    deviceCount: devices.length,
    clientCount: clients.length,
    alarmCount: alarms.length
  };
}
```

## TypeScript Types

All methods return properly typed responses. Import types as needed:

```typescript
import { UniFiDevice, UniFiClient, UniFiSite, UniFiNetwork } from './src/types';

const devices: UniFiDevice[] = await client.list_devices();
const sites: UniFiSite[] = await client.list_sites();
```

## Deprecated Methods

⚠️ **Note**: Some methods are deprecated. Use the recommended alternatives:

```typescript
// ❌ Deprecated
await client.list_aps();
await client.restart_ap();
await client.site_ledson();
await client.site_ledsoff();

// ✅ Recommended
const devices = await client.list_devices();
const aps = devices.filter(d => d.type === 'uap');
await client.restart_device('aa:bb:cc:dd:ee:ff');
await client.site_leds(true);
await client.site_leds(false);
```