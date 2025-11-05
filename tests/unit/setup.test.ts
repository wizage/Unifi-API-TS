/**
 * Basic setup test to verify the project structure
 */

import { UniFiClient } from '../../src/client/UniFiClient';
import { UniFiClientConfig } from '../../src/types/config';

describe('Project Setup', () => {
  it('should be able to import UniFiClient', () => {
    expect(UniFiClient).toBeDefined();
  });

  it('should be able to create UniFiClient instance', () => {
    const config: UniFiClientConfig = {
      baseUrl: 'https://test.local:8443',
      username: 'test',
      password: 'test'
    };
    
    const client = new UniFiClient(config);
    expect(client).toBeInstanceOf(UniFiClient);
  });
});