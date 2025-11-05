/**
 * Error Handling Example
 * 
 * This example demonstrates comprehensive error handling patterns:
 * - Different error types and their handling
 * - Retry strategies
 * - Request cancellation
 * - Graceful degradation
 */

import { 
  UniFiClient, 
  AuthenticationError, 
  NetworkError, 
  APIError, 
  TimeoutError,
  ConfigurationError 
} from '../src';

async function errorHandlingExample() {
  console.log('🛡️  Error Handling Examples\n');

  // Example 1: Configuration Error Handling
  console.log('1️⃣  Configuration Error Handling');
  try {
    // This will throw a ConfigurationError
    const invalidClient = new UniFiClient({
      baseUrl: '', // Invalid: empty URL
      username: 'admin',
      password: 'password'
    });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.log('✅ Caught configuration error:', error.message);
    }
  }

  // Example 2: Authentication Error Handling
  console.log('\n2️⃣  Authentication Error Handling');
  const clientWithBadCredentials = new UniFiClient({
    baseUrl: 'https://unifi.example.com:8443',
    username: 'wrong-user',
    password: 'wrong-password',
    verifySsl: false
  });

  try {
    await clientWithBadCredentials.login();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.log('✅ Caught authentication error:', error.message);
      console.log('   Status code:', error.statusCode);
    } else if (error instanceof NetworkError) {
      console.log('✅ Caught network error (controller unreachable):', error.message);
    }
  }

  // Example 3: Request Timeout Handling
  console.log('\n3️⃣  Request Timeout Handling');
  const clientWithShortTimeout = new UniFiClient({
    baseUrl: 'https://unifi.example.com:8443',
    username: 'admin',
    password: 'password',
    timeout: 1, // Very short timeout to trigger timeout error
    verifySsl: false
  });

  try {
    await clientWithShortTimeout.login();
  } catch (error) {
    if (error instanceof TimeoutError) {
      console.log('✅ Caught timeout error:', error.message);
    } else if (error instanceof NetworkError) {
      console.log('✅ Caught network error (likely timeout):', error.message);
    }
  }

  // Example 4: Request Cancellation
  console.log('\n4️⃣  Request Cancellation');
  const client = new UniFiClient({
    baseUrl: 'https://unifi.example.com:8443',
    username: 'admin',
    password: 'password',
    verifySsl: false
  });

  try {
    // Create an AbortController for cancellation
    const controller = new AbortController();
    
    // Cancel the request after 100ms
    setTimeout(() => {
      console.log('🚫 Cancelling request...');
      controller.abort();
    }, 100);

    // This request will be cancelled
    await client.listDevices(undefined, { signal: controller.signal });
  } catch (error) {
    if (error.message.includes('cancelled') || error.message.includes('aborted')) {
      console.log('✅ Request successfully cancelled');
    }
  }

  // Example 5: Retry Strategy with Exponential Backoff
  console.log('\n5️⃣  Retry Strategy Example');
  await retryWithBackoff(async () => {
    // Simulate an operation that might fail
    if (Math.random() < 0.7) { // 70% chance of failure
      throw new NetworkError('Simulated network failure');
    }
    return 'Success!';
  }, 3, 1000);

  // Example 6: Graceful Degradation
  console.log('\n6️⃣  Graceful Degradation Example');
  await gracefulDegradationExample();

  // Example 7: Comprehensive Error Handler
  console.log('\n7️⃣  Comprehensive Error Handler');
  await comprehensiveErrorHandlerExample();
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  baseDelay: number
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 0) {
        console.log(`✅ Operation succeeded on attempt ${attempt + 1}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        console.log(`❌ Operation failed after ${maxRetries + 1} attempts`);
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`⏳ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Graceful degradation example
 */
async function gracefulDegradationExample() {
  const client = new UniFiClient({
    baseUrl: 'https://unifi.example.com:8443',
    username: 'admin',
    password: 'password',
    verifySsl: false
  });

  let devices: any[] = [];
  let clients: any[] = [];

  // Try to get devices, fall back to empty array if it fails
  try {
    await client.login();
    devices = await client.listDevices();
    console.log(`✅ Successfully retrieved ${devices.length} devices`);
  } catch (error) {
    console.log('⚠️  Failed to get devices, continuing with empty list');
    devices = [];
  }

  // Try to get clients, fall back to empty array if it fails
  try {
    clients = await client.listUsers();
    console.log(`✅ Successfully retrieved ${clients.length} clients`);
  } catch (error) {
    console.log('⚠️  Failed to get clients, continuing with empty list');
    clients = [];
  }

  // Continue with whatever data we have
  console.log(`📊 Summary: ${devices.length} devices, ${clients.length} clients`);

  try {
    await client.logout();
  } catch (error) {
    // Ignore logout errors
  }
}

/**
 * Comprehensive error handler that categorizes and handles different error types
 */
async function comprehensiveErrorHandlerExample() {
  const client = new UniFiClient({
    baseUrl: 'https://unifi.example.com:8443',
    username: 'admin',
    password: 'password',
    verifySsl: false
  });

  try {
    await client.login();
    const devices = await client.listDevices();
    console.log(`✅ Retrieved ${devices.length} devices successfully`);
  } catch (error) {
    handleUniFiError(error);
  }
}

/**
 * Centralized error handler for UniFi API errors
 */
function handleUniFiError(error: unknown): void {
  if (error instanceof ConfigurationError) {
    console.error('🔧 Configuration Error:', error.message);
    console.error('💡 Fix: Check your client configuration parameters');
    
  } else if (error instanceof AuthenticationError) {
    console.error('🔐 Authentication Error:', error.message);
    console.error('💡 Fix: Verify your username and password');
    console.error(`   Status Code: ${error.statusCode}`);
    
  } else if (error instanceof TimeoutError) {
    console.error('⏰ Timeout Error:', error.message);
    console.error('💡 Fix: Increase timeout or check network connectivity');
    
  } else if (error instanceof NetworkError) {
    console.error('🌐 Network Error:', error.message);
    console.error('💡 Fix: Check controller URL and network connectivity');
    
  } else if (error instanceof APIError) {
    console.error('🚨 API Error:', error.message);
    console.error(`   Status Code: ${error.statusCode}`);
    console.error('💡 Fix: Check API endpoint and request parameters');
    
    // Handle specific HTTP status codes
    switch (error.statusCode) {
      case 401:
        console.error('   → Authentication required or session expired');
        break;
      case 403:
        console.error('   → Insufficient permissions');
        break;
      case 404:
        console.error('   → API endpoint not found');
        break;
      case 429:
        console.error('   → Rate limit exceeded');
        break;
      case 500:
        console.error('   → Internal server error');
        break;
    }
    
  } else if (error instanceof Error) {
    // Generic error handling
    console.error('❓ Unknown Error:', error.message);
    console.error('💡 Fix: Check the error details and try again');
    
    // Check for specific error patterns
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   → Connection refused - controller may be down');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('   → DNS resolution failed - check controller hostname');
    } else if (error.message.includes('certificate')) {
      console.error('   → SSL certificate issue - consider setting verifySsl: false');
    }
    
  } else {
    console.error('❓ Unexpected error type:', error);
  }
}

// Run the example
if (require.main === module) {
  errorHandlingExample().catch(console.error);
}

export { 
  errorHandlingExample, 
  retryWithBackoff, 
  gracefulDegradationExample,
  handleUniFiError 
};