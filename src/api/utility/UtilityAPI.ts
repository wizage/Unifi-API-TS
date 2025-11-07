/**
 * Utility API module for UniFi Controller
 * 
 * This module contains miscellaneous API methods that don't fit into other specific
 * categories. These methods provide various utility functions for the UniFi API client.
 * 
 * @since 1.0.0
 * @category Utility
 */

import { HTTPClient } from '../../http/HTTPClient';

export class UtilityAPI {
    constructor(private httpClient: HTTPClient) {}

    /**
     * Substitutes site placeholder in URL
     */
    protected substituteUrl(url: string, site: string = 'default'): string {
        return url.replace('{site}', site);
    }

    /**
     * Makes a request with site substitution and UniFi OS fallback
     */
    protected async makeRequest<T>(config: any, site: string = 'default'): Promise<T> {
        const originalUrl = this.substituteUrl(config.url, site);

        // For UniFi Network Controller endpoints, try UniFi OS fallback if they fail
        if (originalUrl.includes('/api/s/')) {
            const endpoints = [
                originalUrl, // Original Network Controller endpoint
                originalUrl.replace('/api/s/', '/proxy/network/api/s/'), // UniFi OS Network proxy
            ];

            let lastError: Error | undefined;

            for (const endpoint of endpoints) {
                try {
                    const substitutedConfig = {
                        ...config,
                        url: endpoint
                    };
                    const response = await this.httpClient.request<T>(substitutedConfig);
                    return response.data;
                } catch (error) {
                    lastError = error as Error;

                    // If it's not a 404 error, don't try other endpoints
                    if (error instanceof Error && !error.message.includes('404') && !error.message.includes('not found')) {
                        break;
                    }

                    // Continue to next endpoint if this was a 404
                    continue;
                }
            }

            // If all endpoints failed, throw the last error
            throw lastError || new Error('All API endpoints failed');
        } else {
            // For non-Network Controller endpoints, use original behavior
            const substitutedConfig = {
                ...config,
                url: originalUrl
            };
            const response = await this.httpClient.request<T>(substitutedConfig);
            return response.data;
        }
    }

    /**
     * Custom API request
     * 
     * Allows making custom API requests to any UniFi Controller endpoint.
     * This is useful for accessing endpoints that may not have dedicated methods
     * or for testing new API functionality.
     * 
     * @param path - **Required** API path (must start with '/')
     * @param method - HTTP method (default: 'GET')
     * @param payload - Request payload for POST/PUT/PATCH requests
     * @param returnType - Expected return type format (default: 'array')
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to the API response
     * 
     * @throws {Error} When path doesn't start with '/'
     * @throws {APIError} When the API request fails
     * 
     * @example
     * ```typescript
     * // GET request
     * const result = await utilityAPI.custom_api_request('/api/s/default/stat/device');
     * 
     * // POST request with payload
     * const result = await utilityAPI.custom_api_request(
     *   '/api/s/default/cmd/stamgr',
     *   'POST',
     *   { cmd: 'authorize-guest', mac: 'aa:bb:cc:dd:ee:ff', minutes: 60 }
     * );
     * 
     * // Custom endpoint with boolean return
     * const success = await utilityAPI.custom_api_request(
     *   '/api/s/default/cmd/devmgr',
     *   'POST',
     *   { cmd: 'restart', mac: 'aa:bb:cc:dd:ee:ff' },
     *   'boolean'
     * );
     * ```
     * 
     * @see {@link UniFiClient.customApiRequest} for the main client wrapper
     * 
     * PHP: custom_api_request($path, $method = 'GET', $payload = null, $return = 'array')
     */
    async custom_api_request(
        path: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
        payload?: any,
        returnType: 'array' | 'boolean' = 'array',
        site: string = 'default',
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        if (!path.startsWith('/')) {
            throw new Error('Path must start with /');
        }

        const config: any = {
            method,
            url: path,
            ...(options?.signal && { signal: options.signal }),
        };

        if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.data = payload;
        }

        const response = await this.makeRequest<any>(config, site);
        
        if (returnType === 'boolean') {
            return response !== null && response !== false;
        }
        
        return response;
    }
}