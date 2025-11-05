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
const devices = await client.listDevices();
const basicDevices = await client.listDevicesBasic();

// Adopt & manage devices
await client.adoptDevice(['aa:bb:cc:dd:ee:ff']);
await client.restartDevice(['aa:bb:cc:dd:ee:ff']);
await client.forceProvision(['aa:bb:cc:dd:ee:ff']);

// Advanced device operations
await client.disableAp('device_id', true);
await client.ledOverride('device_id', 'on');
await client.locateAp('aa:bb:cc:dd:ee:ff', true);
await client.renameAp('device_id', 'New AP Name');
```

### Client Management
```typescript
// List clients
const clients = await client.listUsers();
const activeClients = await client.listActiveClients();
const clientHistory = await client.listClientsHistory();

// Client operations
await client.authorizeGuest('aa:bb:cc:dd:ee:ff', 60); // 60 minutes
await client.unauthorizeGuest('aa:bb:cc:dd:ee:ff');
await client.blockSta('aa:bb:cc:dd:ee:ff');
await client.unblockSta('aa:bb:cc:dd:ee:ff');
await client.reconnectSta('aa:bb:cc:dd:ee:ff');
await client.forgetSta('aa:bb:cc:dd:ee:ff');

// Client details & management
await client.setStaNote('user_id', 'Important client');
await client.setStaName('user_id', 'John Doe Device');
const clientStats = await client.statClient('aa:bb:cc:dd:ee:ff');
```

### WLAN Management
```typescript
// List WLANs
const wlans = await client.listWlanconf();

// Create WLAN
await client.createWlan(
  'Guest Network',           // name
  'password123',            // passphrase
  'usergroup_id',          // user group
  'wlangroup_id'           // WLAN group
);

// Manage WLANs
await client.setWlansettings('wlan_id', 'newpassword');
await client.disableWlan('wlan_id', true);
await client.deleteWlan('wlan_id');
```

### Network Management
```typescript
// List networks
const networks = await client.listNetworkconf();

// Create network
await client.createNetwork({
  name: 'IoT Network',
  purpose: 'vlan-only',
  vlan_enabled: true,
  vlan: 100,
  ip_subnet: '192.168.100.1/24'
});

// Update network
await client.setNetworksettingsBase('network_id', {
  dhcp_enabled: true,
  dhcp_start: '192.168.100.10',
  dhcp_stop: '192.168.100.200'
});

await client.deleteNetwork('network_id');
```

### Site Management
```typescript
// List sites
const sites = await client.listSites();
const siteStats = await client.statSites();

// Create & manage sites
await client.createSite('New Site Description');
await client.setSiteName('Updated Site Name');
await client.setSiteCountry(840); // US country code
await client.deleteSite('site_id');

// Site settings
await client.setSiteLocale('America/New_York');
await client.setSiteSnmp('public', 'admin@example.com', 'Data Center');
await client.siteLeds(false); // Turn off all AP LEDs
```

### Statistics & Monitoring
```typescript
// System information
const sysInfo = await client.statSysinfo();
const status = await client.statStatus();
const health = await client.statHealth();

// Time-series statistics (5min, hourly, daily, monthly)
const siteStats = await client.stat5minutesSite();
const apStats = await client.statHourlyAps();
const userStats = await client.statDailyUser('aa:bb:cc:dd:ee:ff');
const gwStats = await client.statMonthlyGateway();

// Events & alarms
const events = await client.listEvents();
const alarms = await client.listAlarms();
await client.archiveAlarm('alarm_id');

// Advanced statistics
const dpiStats = await client.statDpi();
const speedtest = await client.statSpeedtest();
const dashboard = await client.statDashboard();
```

### User Groups
```typescript
// List user groups
const groups = await client.listUsergroups();

// Create user group
await client.createUsergroup('VIP Users', 50000, 10000); // 50Mbps down, 10Mbps up

// Assign client to group
await client.setUsergroup('client_id', 'group_id');

// Manage groups
await client.editUsergroup('group_id', 'site_id', 'Updated Name', 100000, 20000);
await client.deleteUsergroup('group_id');
```

### Firewall Management
```typescript
// List firewall groups & rules
const fwGroups = await client.listFirewallgroups();
const fwRules = await client.listFirewallrules();

// Create firewall group
await client.createFirewallgroup(
  'Internal Servers',
  'address-group',
  ['192.168.1.10', '192.168.1.11', '192.168.1.12']
);

// Update firewall group
await client.editFirewallgroup(
  'group_id',
  'site_id', 
  'Updated Servers',
  'address-group',
  ['192.168.1.10', '192.168.1.20']
);

await client.deleteFirewallgroup('group_id');
```

### Device Tags
```typescript
// List tags
const tags = await client.listTags();

// Create tag
await client.createTag('Critical Infrastructure', ['aa:bb:cc:dd:ee:ff']);

// Manage tagged devices
await client.setTaggedDevices(['aa:bb:cc:dd:ee:ff', 'ff:ee:dd:cc:bb:aa'], 'tag_id');
await client.deleteTag('tag_id');
```

### Voucher Management
```typescript
// Create vouchers
const voucher = await client.createVoucher(
  480,        // 8 hours
  5,          // 5 vouchers
  1,          // single use
  'Guest Access', // note
  5000,       // 5Mbps up
  25000       // 25Mbps down
);

// Revoke voucher
await client.revokeVoucher('voucher_id');

// List vouchers
const vouchers = await client.statVoucher();
```

### Firmware & Updates
```typescript
// Check for updates
const controllerUpdate = await client.checkControllerUpdate();
const firmwareUpdate = await client.checkFirmwareUpdate();

// Upgrade devices
await client.upgradeDevice('aa:bb:cc:dd:ee:ff');
await client.upgradeDeviceExternal('firmware_url', ['aa:bb:cc:dd:ee:ff']);
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
await client.restartDevice(deviceMacs);

// Block multiple clients
for (const mac of clientMacs) {
  await client.blockSta(mac);
}
```

### Monitoring Loop
```typescript
async function monitorSite() {
  while (true) {
    try {
      const health = await client.statHealth();
      const alarms = await client.listAlarms();
      
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
    client.statSysinfo(),
    client.statHealth(),
    client.listDevicesBasic(),
    client.listActiveClients(),
    client.listAlarms()
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

const devices: UniFiDevice[] = await client.listDevices();
const sites: UniFiSite[] = await client.listSites();
```