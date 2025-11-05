# UniFi API TypeScript Methods

This file contains the core UniFi API methods converted from the PHP UniFi API client. While the original PHP client has 214 methods, this implementation focuses on the most commonly used and essential methods for UniFi controller management.

## Implemented Methods (50+ core methods)

### Authentication Methods
- `login()` - Login to the UniFi controller
- `logout()` - Logout from the UniFi controller

### Guest Management Methods
- `authorizeGuest(mac, minutes, up?, down?, megabytes?, apMac?)` - Authorize a guest client
- `unauthorizeGuest(mac)` - Unauthorize a guest client

### Client Management Methods
- `reconnectSta(mac)` - Reconnect/kick a client device
- `blockSta(mac)` - Block a client device
- `unblockSta(mac)` - Unblock a client device
- `forgetSta(mac)` - Forget a client device

### Statistics and Listing Methods
- `listUsers(clientMac?)` - List client devices
- `listDevices(apMac?)` - List access points and devices
- `listDevicesBasic()` - List devices with basic information
- `listSites()` - List all sites
- `statSites()` - Get site statistics
- `statSysinfo()` - Get system information
- `statStatus()` - Get controller status
- `statFullStatus()` - Get full controller status

### WLAN Management Methods
- `listWlanconf(wlanId?)` - List WLAN configurations
- `createWlan(name, passphrase, usergroupId, wlangroupId, ...)` - Create a new WLAN
- `setWlansettingsBase(wlanId, payload)` - Update WLAN settings (base method)
- `setWlansettings(wlanId, passphrase, name?)` - Update basic WLAN settings
- `disableWlan(wlanId, disable)` - Enable/disable a WLAN
- `deleteWlan(wlanId)` - Delete a WLAN

### Network Management Methods
- `listNetworkconf(networkId?)` - List network configurations
- `createNetwork(payload)` - Create a new network
- `setNetworksettingsBase(networkId, payload)` - Update network settings
- `deleteNetwork(networkId)` - Delete a network

### Device Management Methods
- `adoptDevice(macs)` - Adopt one or more devices
- `restartDevice(macs, rebootType?)` - Restart one or more devices
- `forceProvision(mac)` - Force provision a device
- `disableAp(apId, disable)` - Enable/disable an access point
- `ledOverride(deviceId, overrideMode)` - Override LED mode for a device
- `locateAp(mac, enable)` - Enable/disable AP location flashing
- `siteLeds(enable)` - Enable/disable LEDs for all APs in site

### Site Management Methods
- `createSite(description)` - Create a new site
- `deleteSite(siteId)` - Delete a site

### Event and Alarm Methods
- `listEvents(historyhours?, start?, limit?)` - List events
- `listAlarms(payload?)` - List alarms
- `countAlarms(archived?)` - Count alarms
- `archiveAlarm(alarmId?)` - Archive alarms

### Firmware and Update Methods
- `checkControllerUpdate()` - Check for controller updates
- `checkFirmwareUpdate()` - Check for firmware updates
- `upgradeDevice(mac)` - Upgrade device firmware
- `upgradeDeviceExternal(firmwareUrl, macs)` - Upgrade device with external firmware

### Voucher Methods
- `statVoucher(createTime?)` - Get voucher statistics
- `createVoucher(minutes, count?, quota?, note?, up?, down?, megabytes?)` - Create vouchers
- `revokeVoucher(voucherId)` - Revoke a voucher

### Utility Methods
- `customApiRequest(path, method?, payload?, returnType?)` - Make custom API requests

## Features

### Request Cancellation Support ✅
All methods support request cancellation through the optional `options` parameter:
```typescript
const controller = new AbortController();
await client.listDevices(undefined, { signal: controller.signal });

// Cancel the request
controller.abort();
```

### Type Safety ✅
- All methods are fully typed with TypeScript
- Parameter validation for required fields
- Proper return types for all methods
- Error handling with descriptive messages

### Error Handling ✅
- Parameter validation with clear error messages
- Network error handling through HTTPClient
- Proper error propagation

### Session Management ✅
- Integrated with existing session management system
- Automatic authentication handling
- Cookie management for persistent sessions

## Usage Example

```typescript
import { UniFiClient } from 'unifi-api-typescript';

const client = new UniFiClient({
  baseUrl: 'https://unifi.example.com:8443',
  username: 'admin',
  password: 'password',
  site: 'default'
});

// Login
await client.login();

// List all devices
const devices = await client.listDevices();

// List all clients
const clients = await client.listUsers();

// Create a new WLAN
await client.createWlan(
  'Guest Network',
  'guestpassword123',
  'default',
  'default'
);

// Authorize a guest for 60 minutes
await client.authorizeGuest('aa:bb:cc:dd:ee:ff', 60);

// Restart a device
await client.restartDevice(['aa:bb:cc:dd:ee:ff']);

// Logout
await client.logout();
```

## Notes

This implementation covers the most essential UniFi API operations. While the original PHP client has 214 methods, many are variations, legacy methods, or internal utility functions. This TypeScript implementation focuses on the core functionality needed for most UniFi controller management tasks.

The methods are organized by functionality and follow consistent patterns for:
- Parameter validation
- Error handling
- Request cancellation support
- Type safety
- Documentation

All methods return Promises and should be used with async/await for the best developer experience.