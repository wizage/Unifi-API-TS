# Complete UniFi API TypeScript Methods

Generated from PHP UniFi API client - 214 total methods

## All Methods

| # | Method Name | Parameters | Return Type | Description |
|---|-------------|------------|-------------|-------------|
| 1 | `login` | none | `boolean` | If  _SESSION  this  unificookie_name  is set  do n |
| 2 | `logout` | none | `boolean` | Skip the login process if already logged in    
if |
| 3 | `authorizeGuest` | 6 params | `boolean` | Prepare cURL and options    
 ch    this  get_curl |
| 4 | `unauthorizeGuest` | 1 params | `boolean` | Append received values for up down megabytes ap_ma |
| 5 | `reconnectSta` | 1 params | `boolean` | Reconnect a client device |
| 6 | `blockSta` | 1 params | `boolean` | Block a client device |
| 7 | `unblockSta` | 1 params | `boolean` | Unblock a client device |
| 8 | `forgetSta` | 1 params | `boolean` | Forget one or more client devices |
| 9 | `createUser` | 6 params | `any` | Create a new user client device |
| 10 | `setStaNote` | 2 params | `boolean` | Add modify remove a client device note |
| 11 | `setStaName` | 2 params | `boolean` | Add modify remove a client device name |
| 12 | `stat_5minutesSite` | 3 params | `any` | Fetch 5 minute site stats |
| 13 | `statHourlySite` | 3 params | `any` | Fetch hourly site stats 
TODO  add support for opt |
| 14 | `statDailySite` | 3 params | `any` | Fetch daily site stats |
| 15 | `statMonthlySite` | 3 params | `any` | Fetch monthly site stats |
| 16 | `stat_5minutesAps` | 4 params | `any` | Fetch 5 minutes stats for a single access point or |
| 17 | `statHourlyAps` | 4 params | `any` | Fetch hourly stats for a single access point or al |
| 18 | `statDailyAps` | 4 params | `any` | Fetch daily stats for a single access point or all |
| 19 | `statMonthlyAps` | 4 params | `any` | Fetch monthly stats for a single access point or a |
| 20 | `stat_5minutesUser` | 4 params | `any` | Fetch 5 minutes stats for a single user client dev |
| 21 | `statHourlyUser` | 4 params | `any` | Fetch hourly stats for a single user client device |
| 22 | `statDailyUser` | 4 params | `any` | Fetch daily stats for a single user client device |
| 23 | `statMonthlyUser` | 4 params | `any` | Fetch monthly stats for a single user client devic |
| 24 | `stat_5minutesGateway` | 3 params | `any` | Fetch 5 minute gateway stats |
| 25 | `statHourlyGateway` | 3 params | `any` | Fetch hourly gateway stats |
| 26 | `statDailyGateway` | 3 params | `any` | Fetch daily gateway stats |
| 27 | `statMonthlyGateway` | 3 params | `any` | Fetch monthly gateway stats |
| 28 | `statSpeedtestResults` | 2 params | `any` | Fetch speed test results |
| 29 | `statIpsEvents` | 3 params | `any` | Fetch IPS IDS events |
| 30 | `statSessions` | 4 params | `any` | Fetch login sessions |
| 31 | `statStaSessionsLatest` | 2 params | `any` | Fetch latest  n  login sessions for a single clien |
| 32 | `statAuths` | 2 params | `any` | Fetch authorizations |
| 33 | `statAllusers` | 1 params | `any` | Fetch client devices that connected to the site wi |
| 34 | `listGuests` | 1 params | `any` | Fetch guest devices |
| 35 | `listClients` | 1 params | `any` | Fetch online client device s |
| 36 | `listActiveClients` | 2 params | `any` | Fetch active client devices |
| 37 | `listClientsHistory` | 3 params | `any` | Fetch client devices history  offline client devic |
| 38 | `statClient` | 1 params | `any` | Fetch details for a single client device |
| 39 | `listFingerprintDevices` | 1 params | `any` | Fetch fingerprints for client devices |
| 40 | `setUsergroup` | 2 params | `boolean` | Assign a client device to another group |
| 41 | `editClientFixedip` | 4 params | `any` | Update a client device s fixed IP address  using R |
| 42 | `editClientName` | 2 params | `any` | Update client device name  using REST |
| 43 | `listUsergroups` | none | `any` | Fetch user groups |
| 44 | `createUsergroup` | 3 params | `any` | Create a user group  using REST |
| 45 | `editUsergroup` | 5 params | `any` | Modify a user group  using REST |
| 46 | `deleteUsergroup` | 1 params | `boolean` | Delete a user group  using REST |
| 47 | `listApgroups` | none | `any` | Fetch AP groups |
| 48 | `createApgroup` | 2 params | `any` | Create an AP group |
| 49 | `editApgroup` | 3 params | `any` | Modify an AP group |
| 50 | `deleteApgroup` | 1 params | `boolean` | Delete an AP group |
| 51 | `listFirewallgroups` | 1 params | `any` | Fetch firewall groups  using REST |
| 52 | `createFirewallgroup` | 3 params | `any` | Create a firewall group  using REST |
| 53 | `editFirewallgroup` | 5 params | `any` | Modify a firewall group  using REST |
| 54 | `deleteFirewallgroup` | 1 params | `boolean` | Delete a firewall group  using REST |
| 55 | `listFirewallrules` | none | `any` | Fetch firewall rules  using REST |
| 56 | `listRouting` | 1 params | `any` | Fetch static routing settings  using REST |
| 57 | `listHealth` | none | `any` | Fetch health metrics |
| 58 | `listDashboard` | 1 params | `any` | Fetch dashboard metrics |
| 59 | `listUsers` | none | `any` | Fetch client devices |
| 60 | `listDevicesBasic` | none | `any` | List of UniFi devices with a basic subset of prope |
| 61 | `listDevices` | 1 params | `any` | Fetch UniFi devices |
| 62 | `listTags` | none | `any` | Fetch  device  tags  using REST |
| 63 | `createTag` | 2 params | `boolean` | Create a  device  tag  using REST |
| 64 | `setTaggedDevices` | 2 params | `boolean` | Set tagged devices  using REST |
| 65 | `getTag` | 1 params | `any` | Get a  device  tag  using REST |
| 66 | `deleteTag` | 1 params | `boolean` | Delete a  device  tag  using REST |
| 67 | `listRogueaps` | 1 params | `any` | Fetch rogue neighboring access points |
| 68 | `listKnownRogueaps` | none | `any` | Fetch known rogue access points |
| 69 | `generateBackup` | 1 params | `any` | Generate a backup |
| 70 | `downloadBackup` | 1 params | `any` | Download a generated backup file |
| 71 | `listBackups` | none | `any` | Fetch auto backups |
| 72 | `generateBackupSite` | none | `any` | Generate a backup export of the current site |
| 73 | `listSites` | none | `any` | Fetch sites |
| 74 | `statSites` | none | `any` | Fetch sites stats |
| 75 | `createSite` | 1 params | `any` | Create a site |
| 76 | `deleteSite` | 1 params | `boolean` | Delete a site |
| 77 | `setSiteName` | 1 params | `boolean` | Change the current site s name |
| 78 | `setSiteCountry` | 2 params | `boolean` | Update site country |
| 79 | `setSiteLocale` | 2 params | `boolean` | Update site locale |
| 80 | `setSiteSnmp` | 2 params | `boolean` | Update site snmp |
| 81 | `setSiteMgmt` | 2 params | `boolean` | Update site mgmt |
| 82 | `setSiteGuestAccess` | 2 params | `boolean` | Update site guest access |
| 83 | `setSiteNtp` | 2 params | `boolean` | Update site ntp |
| 84 | `setSiteConnectivity` | 2 params | `boolean` | Update site connectivity |
| 85 | `listAdmins` | none | `any` | Fetch admins |
| 86 | `listAllAdmins` | none | `any` | Fetch all admins |
| 87 | `inviteAdmin` | 6 params | `boolean` | Invite a new admin for access to the current site |
| 88 | `assignExistingAdmin` | 4 params | `boolean` | Assign an existing admin to the current site |
| 89 | `updateAdmin` | 8 params | `boolean` | Update an admin of the current site |
| 90 | `revokeAdmin` | 1 params | `boolean` | Revoke an admin from the current site |
| 91 | `deleteAdmin` | 1 params | `boolean` | Delete an admin entirely |
| 92 | `grantSuperAdmin` | 1 params | `boolean` | Grant an admin super admin |
| 93 | `listWlanGroups` | none | `any` | Fetch WLAN groups |
| 94 | `statSysinfo` | none | `any` | Fetch sysinfo |
| 95 | `statStatus` | none | `boolean` | Fetch controller status |
| 96 | `statFullStatus` | none | `any` | Fetch full controller status |
| 97 | `listDeviceNameMappings` | none | `any` | Fetch device name mappings |
| 98 | `listSelf` | none | `any` | Fetch self |
| 99 | `statVoucher` | 1 params | `any` | Fetch vouchers |
| 100 | `statPayment` | 1 params | `any` | Fetch payments |
| 101 | `createHotspotop` | 3 params | `boolean` | Create a hotspot operator  using REST |
| 102 | `listHotspotop` | none | `any` | Fetch hotspot operators  using REST |
| 103 | `createVoucher` | 7 params | `any` | Create voucher s |
| 104 | `revokeVoucher` | 1 params | `boolean` | Revoke voucher |
| 105 | `extendGuestValidity` | 1 params | `boolean` | Extend guest authorization |
| 106 | `listPortforwardStats` | none | `any` | Fetch port forwarding stats |
| 107 | `listDpiStats` | none | `any` | Fetch DPI stats |
| 108 | `listDpiStatsFiltered` | 2 params | `any` | Fetch filtered DPI stats |
| 109 | `listCurrentChannels` | none | `any` | Fetch current channels |
| 110 | `listCountryCodes` | none | `any` | Fetch country codes |
| 111 | `listPortforwarding` | none | `any` | Fetch port forwarding settings |
| 112 | `listPortconf` | none | `any` | Fetch port configurations |
| 113 | `listExtension` | none | `any` | Fetch VoIP extensions |
| 114 | `listSettings` | none | `any` | Fetch site settings |
| 115 | `adoptDevice` | 1 params | `boolean` | Adopt a device to the current site |
| 116 | `advancedAdoptDevice` | 7 params | `boolean` | Adopt a device using custom SSH credentials |
| 117 | `migrateDevice` | 2 params | `boolean` | Migrate one or more devices |
| 118 | `cancelMigrateDevice` | 1 params | `boolean` | Cancel migration for one or more devices |
| 119 | `restartDevice` | 2 params | `boolean` | Reboot one or more devices |
| 120 | `forceProvision` | 1 params | `boolean` | Force the provision of one or more devices |
| 121 | `rebootCloudkey` | none | `boolean` | Reboot a UniFi CloudKey |
| 122 | `disableAp` | 2 params | `boolean` | Disable enable an access point  using REST |
| 123 | `ledOverride` | 2 params | `boolean` | Override LED mode for a device  using REST |
| 124 | `locateAp` | 2 params | `boolean` | Toggle the flashing LED of an access point for loc |
| 125 | `siteLeds` | 1 params | `boolean` | Toggle LEDs of all the access points ON or OFF |
| 126 | `setApRadiosettings` | 6 params | `boolean` | Update access point radio settings |
| 127 | `setApWlangroup` | 3 params | `boolean` | Assign access point to another WLAN group |
| 128 | `setGuestloginSettings` | 8 params | `boolean` | Update guest login settings |
| 129 | `setGuestloginSettingsBase` | 2 params | `boolean` | Update guest login settings  base |
| 130 | `setIpsSettingsBase` | 1 params | `boolean` | Update IPS IDS settings  base |
| 131 | `setSuperMgmtSettingsBase` | 2 params | `boolean` | Update  Super Management  settings  base |
| 132 | `setSuperSmtpSettingsBase` | 2 params | `boolean` | Update  Super SMTP  settings  base |
| 133 | `setSuperIdentitySettingsBase` | 2 params | `boolean` | Update  Super Controller Identity  settings  base |
| 134 | `renameAp` | 2 params | `boolean` | Rename an access point |
| 135 | `moveDevice` | 2 params | `boolean` | Move a device to another site |
| 136 | `deleteDevice` | 1 params | `boolean` | Delete a device from the current site |
| 137 | `listDynamicdns` | none | `any` | Fetch dynamic DNS settings  using REST |
| 138 | `createDynamicdns` | 1 params | `boolean` | Create dynamic DNS settings  base  using REST |
| 139 | `setDynamicdns` | 2 params | `boolean` | Update site dynamic DNS  base  using REST |
| 140 | `listNetworkconf` | 1 params | `any` | Fetch network settings  using REST |
| 141 | `createNetwork` | 1 params | `any` | Create a network  using REST |
| 142 | `setNetworksettingsBase` | 2 params | `boolean` | Update network settings  base  using REST |
| 143 | `deleteNetwork` | 1 params | `boolean` | Delete a network  using REST |
| 144 | `listWlanconf` | 1 params | `any` | Fetch wlan settings  using REST |
| 145 | `createWlan` | 17 params | `boolean` | Create a WLAN |
| 146 | `setWlansettingsBase` | 2 params | `boolean` | Update wlan settings  base  using REST |
| 147 | `setWlansettings` | 3 params | `boolean` | Update basic wlan settings |
| 148 | `disableWlan` | 2 params | `boolean` | Disable Enable wlan |
| 149 | `deleteWlan` | 1 params | `boolean` | Delete a wlan  using REST |
| 150 | `setWlanMacFilter` | 4 params | `boolean` | Update MAC filter for a wlan |
| 151 | `listEvents` | 3 params | `any` | Fetch events |
| 152 | `listAlarms` | 1 params | `any` | Fetch alarms |
| 153 | `countAlarms` | 1 params | `any` | Count alarms |
| 154 | `archiveAlarm` | 1 params | `boolean` | Archive alarms s |
| 155 | `checkControllerUpdate` | none | `any` | Check controller update |
| 156 | `getUpdateOsConsole` | none | `any` | Get the recent firmware update for an UniFi OS con |
| 157 | `updateOsConsole` | none | `boolean` | Update the OS for an UniFi OS console |
| 158 | `checkFirmwareUpdate` | none | `boolean` | Check firmware update |
| 159 | `upgradeDevice` | 1 params | `boolean` | Upgrade a device to the latest firmware |
| 160 | `upgradeAllDevices` | 1 params | `boolean` | Upgrade all devices of a certain type to the lates |
| 161 | `upgradeDeviceExternal` | 2 params | `boolean` | Upgrade a device to a specific firmware file |
| 162 | `startRollingUpgrade` | 1 params | `boolean` | Start a rolling upgrade |
| 163 | `cancelRollingUpgrade` | none | `boolean` | Cancel a rolling upgrade |
| 164 | `listFirmware` | 1 params | `any` | Fetch firmware versions |
| 165 | `powerCycleSwitchPort` | 2 params | `boolean` | Power cycle the PoE output of a switch port |
| 166 | `spectrumScan` | 1 params | `boolean` | Trigger an RF scan by an AP |
| 167 | `spectrumScanState` | 1 params | `any` | Check the RF scanning state of an AP |
| 168 | `setDeviceSettingsBase` | 2 params | `boolean` | Update device settings  base  using REST |
| 169 | `listRadiusProfiles` | none | `any` | Fetch Radius profiles  using REST |
| 170 | `listRadiusAccounts` | none | `any` | Fetch Radius user accounts  using REST |
| 171 | `createRadiusAccount` | 5 params | `any` | Create a Radius user account  using REST |
| 172 | `setRadiusAccountBase` | 2 params | `boolean` | Update a Radius account  base  using REST |
| 173 | `deleteRadiusAccount` | 1 params | `boolean` | Delete a Radius account  using REST |
| 174 | `cmdStat` | 1 params | `boolean` | Execute specific stats command |
| 175 | `setElementAdoption` | 1 params | `boolean` | Toggle Element Adoption ON or OFF |
| 176 | `getSystemLog` | 6 params | `any` | Fetch system log entries |
| 177 | `listDnsRecords` | none | `any[] | null` | Get a list of all DNS records |
| 178 | `createDnsRecord` | 5 params | `any | null` | Create a new DNS record |
| 179 | `deleteDnsRecord` | 1 params | `boolean` | Delete a DNS record |
| 180 | `listModels` | none | `any | null` | Get a list of all UniFi device models present in t |
| 181 | `listDeviceStates` | none | `any[]` | List device states |
| 182 | `customApiRequest` | 4 params | `any` | Custom API request |
| 183 | `listAps` | none | `any` | API method |
| 184 | `setLocateAp` | none | `any` | API method |
| 185 | `unsetLocateAp` | none | `boolean` | API method |
| 186 | `siteLedson` | none | `boolean` | API method |
| 187 | `siteLedsoff` | none | `boolean` | API method |
| 188 | `restartAp` | none | `boolean` | API method |
| 189 | `getClassVersion` | none | `string` | API method |
| 190 | `setSite` | 1 params | `string` | Modify the private property  site |
| 191 | `getSite` | none | `string` | Get the private property  site |
| 192 | `setDebug` | 1 params | `boolean` | Set debug mode |
| 193 | `getDebug` | none | `boolean` | Get the private property  debug |
| 194 | `getLastResultsRaw` | 1 params | `any` | Get last raw results |
| 195 | `getLastErrorMessage` | none | `string` | Get the last error message |
| 196 | `getCookie` | none | `string` | Get Cookie from UniFi controller  singular and plu |
| 197 | `getCookies` | none | `string` | API method |
| 198 | `getCookiesCreatedAt` | none | `number` | Get the Unix timestamp of the latest cookie creati |
| 199 | `setCookies` | 1 params | `any` | Set the value for the private property  cookies an |
| 200 | `getUnificookieName` | none | `string` | Get the current value of the private property  uni |
| 201 | `getCurlMethod` | none | `string` | Get current request method |
| 202 | `setCurlMethod` | 1 params | `string` | Set request method |
| 203 | `getCurlSslVerifyPeer` | none | `boolean` | Get value for cURL option CURLOPT_SSL_VERIFYPEER |
| 204 | `setCurlSslVerifyPeer` | 1 params | `boolean` | Set value for cURL option CURLOPT_SSL_VERIFYPEER |
| 205 | `getCurlSslVerifyHost` | none | `number` | Get value for cURL option CURLOPT_SSL_VERIFYHOST |
| 206 | `setCurlSslVerifyHost` | 1 params | `boolean` | Set value for cURL option CURLOPT_SSL_VERIFYHOST |
| 207 | `getIsUnifiOs` | none | `boolean` | Is the current controller UniFi OS based |
| 208 | `setIsUnifiOs` | 1 params | `boolean` | Set value for private property  is_unifi_os |
| 209 | `setConnectionTimeout` | 1 params | `boolean` | Set value for the private property  connect_timeou |
| 210 | `getConnectionTimeout` | none | `number` | Get the current value of the private property  con |
| 211 | `setCurlRequestTimeout` | 1 params | `boolean` | Set value for the private property  request_timeou |
| 212 | `getCurlRequestTimeout` | none | `number` | Get the current value of the private property  req |
| 213 | `setCurlHttpVersion` | 1 params | `boolean` | Set the value for the private property  curl_http_ |
| 214 | `getCurlHttpVersion` | none | `number` | Get the current value of the private property  cur |

## Session Management

All methods automatically handle:
- Authentication via session cookies
- Site context (uses configured site or 'default')
- Request cancellation via AbortSignal
- Parameter validation
- Error handling

## Usage

```typescript
const client = new UniFiClient(config);
await client.login(); // Handled automatically by SessionManager

// All 214 methods are now available:
const devices = await client.listDevices();
const sites = await client.listSites();
// ... etc
```
