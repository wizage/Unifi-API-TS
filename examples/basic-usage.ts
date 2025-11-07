/**
 * Basic Usage Example
 * 
 * This example demonstrates the fundamental operations of the UniFi API client:
 * - Authentication
 * - Listing devices and clients
 * - Basic error handling
 */

import { UniFiClient, AuthenticationError, NetworkError } from '../src';

async function basicUsageExample() {
  // Create client instance
  const client = new UniFiClient({
    baseUrl: 'https://unifi.example.com:8443',
    username: 'admin',
    password: 'your-password',
    site: 'default',
    verifySsl: false, // Set to true in production with valid certificates
    debug: false // Set to true for debugging
  });

  try {
    console.log('🔐 Logging in to UniFi Controller...');
    await client.login();
    console.log('✅ Successfully authenticated');

    // Get session information
    const sessionInfo = client.getSessionInfo();
    console.log(`👤 Logged in as: ${sessionInfo.username}`);
    console.log(`🏢 Site: ${sessionInfo.site}`);

    // List all UniFi devices
    console.log('\n📡 Fetching UniFi devices...');
    const devices = await client.list_devices();
    console.log(`Found ${devices.length} UniFi devices:`);
    
    devices.forEach((device, index) => {
      console.log(`  ${index + 1}. ${device.name || 'Unnamed'} (${device.mac})`);
      console.log(`     Type: ${device.type}, Model: ${device.model}`);
      console.log(`     Status: ${device.state === 1 ? 'Online' : 'Offline'}`);
    });

    // List connected clients
    console.log('\n👥 Fetching connected clients...');
    const clients = await client.list_users();
    console.log(`Found ${clients.length} connected clients:`);
    
    clients.forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.hostname || client.mac}`);
      console.log(`     MAC: ${client.mac}`);
      console.log(`     IP: ${client.ip}`);
      console.log(`     Connected to: ${client.ap_mac}`);
    });

    // Get basic device information (faster for large networks)
    console.log('\n⚡ Fetching basic device info...');
    const basicDevices = await client.list_devices_basic();
    console.log(`Basic info for ${basicDevices.length} devices retrieved`);

  } catch (error) {
    console.error('❌ Error occurred:');
    
    if (error instanceof AuthenticationError) {
      console.error('Authentication failed - check your credentials');
    } else if (error instanceof NetworkError) {
      console.error('Network error - check your connection and controller URL');
    } else {
      console.error('Unexpected error:', error.message);
    }
  } finally {
    // Always logout to clean up the session
    try {
      await client.logout();
      console.log('\n🚪 Logged out successfully');
    } catch (error) {
      console.warn('Logout failed, but session cleared locally');
    }
  }
}

// Run the example
if (require.main === module) {
  basicUsageExample().catch(console.error);
}

export { basicUsageExample };