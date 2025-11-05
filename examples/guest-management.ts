/**
 * Guest Management Example
 * 
 * This example demonstrates guest network management operations:
 * - Authorizing guest devices with various options
 * - Managing guest access (block, unblock, forget)
 * - Handling guest-specific errors
 */

import { UniFiClient } from '../src';

async function guestManagementExample() {
  const client = new UniFiClient({
    baseUrl: 'https://unifi.example.com:8443',
    username: 'admin',
    password: 'your-password',
    site: 'default',
    verifySsl: false
  });

  try {
    await client.login();
    console.log('✅ Authenticated with UniFi Controller');

    // Example guest device MAC address
    const guestMac = 'aa:bb:cc:dd:ee:ff';

    // 1. Basic guest authorization (60 minutes)
    console.log('\n🎫 Authorizing guest for basic access...');
    await client.authorizeGuest(guestMac, 60);
    console.log(`✅ Guest ${guestMac} authorized for 60 minutes`);

    // 2. Guest authorization with bandwidth limits
    console.log('\n🚀 Authorizing guest with bandwidth limits...');
    const upBandwidth = 5000;   // 5 Mbps upload
    const downBandwidth = 10000; // 10 Mbps download
    await client.authorizeGuest(guestMac, 120, upBandwidth, downBandwidth);
    console.log(`✅ Guest authorized for 120 minutes with ${upBandwidth/1000}/${downBandwidth/1000} Mbps limits`);

    // 3. Guest authorization with data limit
    console.log('\n💾 Authorizing guest with data limit...');
    const dataLimitMB = 1024; // 1 GB
    await client.authorizeGuest(guestMac, 180, undefined, undefined, dataLimitMB);
    console.log(`✅ Guest authorized for 180 minutes with ${dataLimitMB} MB data limit`);

    // 4. Guest authorization with all options
    console.log('\n🎯 Authorizing guest with all options...');
    const apMac = '11:22:33:44:55:66'; // Specific AP MAC
    await client.authorizeGuest(
      guestMac,
      240,           // 4 hours
      2000,          // 2 Mbps up
      5000,          // 5 Mbps down
      512,           // 512 MB data limit
      apMac          // Specific AP
    );
    console.log(`✅ Guest authorized with comprehensive settings`);

    // 5. Check current connected clients to see our guest
    console.log('\n👥 Checking connected clients...');
    const clients = await client.listUsers();
    const guestClient = clients.find(c => c.mac.toLowerCase() === guestMac.toLowerCase());
    
    if (guestClient) {
      console.log(`📱 Guest device found:`);
      console.log(`   Hostname: ${guestClient.hostname || 'Unknown'}`);
      console.log(`   IP: ${guestClient.ip}`);
      console.log(`   Connected to AP: ${guestClient.ap_mac}`);
      console.log(`   Data usage: ${guestClient.tx_bytes + guestClient.rx_bytes} bytes`);
    } else {
      console.log(`❓ Guest device ${guestMac} not currently connected`);
    }

    // 6. Demonstrate client management operations
    console.log('\n🔧 Demonstrating client management...');
    
    // Force reconnection (useful for applying new settings)
    await client.reconnectSta(guestMac);
    console.log(`🔄 Forced reconnection for ${guestMac}`);

    // Wait a moment for reconnection
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Block the client
    await client.blockSta(guestMac);
    console.log(`🚫 Blocked client ${guestMac}`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Unblock the client
    await client.unblockSta(guestMac);
    console.log(`✅ Unblocked client ${guestMac}`);

    // 7. Revoke guest authorization
    console.log('\n🚪 Revoking guest authorization...');
    await client.unauthorizeGuest(guestMac);
    console.log(`❌ Guest authorization revoked for ${guestMac}`);

    // 8. Forget the client (remove from controller memory)
    console.log('\n🗑️  Forgetting client...');
    await client.forgetSta(guestMac);
    console.log(`🧹 Client ${guestMac} forgotten (removed from controller memory)`);

  } catch (error) {
    console.error('❌ Guest management error:', error.message);
    
    // Handle specific error cases
    if (error.message.includes('mac')) {
      console.error('💡 Tip: Ensure MAC address is in correct format (aa:bb:cc:dd:ee:ff)');
    }
  } finally {
    await client.logout();
    console.log('\n🚪 Logged out');
  }
}

// Helper function to validate MAC address format
function isValidMacAddress(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

// Example usage with MAC validation
async function safeGuestAuthorization(client: UniFiClient, mac: string, minutes: number) {
  if (!isValidMacAddress(mac)) {
    throw new Error(`Invalid MAC address format: ${mac}`);
  }
  
  return await client.authorizeGuest(mac, minutes);
}

// Run the example
if (require.main === module) {
  guestManagementExample().catch(console.error);
}

export { guestManagementExample, isValidMacAddress, safeGuestAuthorization };