/**
 * User Management API
 * 
 * This module provides methods for managing users, user groups, and administrators
 * in the UniFi Controller. It includes functionality for creating and managing
 * client users, user groups with bandwidth controls, and site administrators.
 * 
 * @since 1.0.0
 * @category User Management
 */

import { HTTPClient } from '../../http/HTTPClient';

/**
 * User Management API class
 * 
 * Handles all user, user group, and administrator management operations
 * for the UniFi Controller.
 * 
 * @since 1.0.0
 * @category User Management
 */
export class UserManagementAPI {
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

    // ============================================================================
    // USER MANAGEMENT METHODS
    // ============================================================================

    /**
     * Create a new user (client device) in the UniFi network
     * 
     * @description Creates a new user entry for a client device with specified MAC address
     * and assigns it to a user group. This allows for bandwidth control and access policies
     * to be applied to the device.
     * 
     * @param site - Site identifier (default: 'default')
     * @param mac - **Required** MAC address of the client device
     * @param user_group_id - **Required** ID of the user group to assign the user to
     * @param name - Optional friendly name for the user
     * @param note - Optional note/description for the user
     * @param is_guest - Optional flag to mark user as guest (default: false)
     * @param is_wired - Optional flag to indicate wired connection (default: false)
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to the created user object
     * 
     * @throws {Error} When MAC address or user_group_id validation fails
     * @throws {APIError} When user creation fails
     * 
     * @example
     * ```typescript
     * // Create basic user
     * const user = await userMgmt.create_user(
     *   'default',
     *   'aa:bb:cc:dd:ee:ff',
     *   'default-usergroup'
     * );
     * 
     * // Create user with full details
     * await userMgmt.create_user(
     *   'default',
     *   'aa:bb:cc:dd:ee:ff',
     *   'guest-usergroup',
     *   'John Doe',
     *   'Conference guest',
     *   true,  // is_guest
     *   false  // is_wired
     * );
     * 
     * // Create wired user
     * await userMgmt.create_user(
     *   'default',
     *   'aa:bb:cc:dd:ee:ff',
     *   'corporate-usergroup',
     *   'Office Workstation',
     *   'Marketing department PC',
     *   false, // is_guest
     *   true   // is_wired
     * );
     * ```
     * 
     * @see {@link list_usergroups} to get available user groups
     * @see {@link set_usergroup} to modify user group membership
     * 
     * @since 1.0.0
     * @category User Management
     * @remarks PHP: create_user($mac, $user_group_id, $name = null, $note = null, $is_guest = null, $is_wired = null)
     */
    async create_user(
        site: string,
        mac: string,
        user_group_id: string,
        name?: string,
        note?: string,
        is_guest?: boolean,
        is_wired?: boolean,
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const new_user: any = {
            mac: mac.toLowerCase(),
            usergroup_id: user_group_id
        };

        if (name) {
            new_user.name = name;
        }

        if (note) {
            new_user.note = note;
        }

        if (is_guest !== undefined) {
            new_user.is_guest = is_guest;
        }

        if (is_wired !== undefined) {
            new_user.is_wired = is_wired;
        }

        const payload = {
            objects: [{ data: new_user }]
        };

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/group/user',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Set user group for a client device
     * 
     * @description Assigns a client device to a specific user group, which controls
     * bandwidth limits and access policies for that device.
     * 
     * @param site - Site identifier (default: 'default')
     * @param client_id - **Required** ID of the client device
     * @param group_id - **Required** ID of the user group to assign
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if assignment was successful
     * 
     * @throws {Error} When client_id or group_id validation fails
     * @throws {APIError} When user group assignment fails
     * 
     * @example
     * ```typescript
     * // Assign user to VIP group
     * await userMgmt.set_usergroup('default', 'user123', 'vip-group-id');
     * 
     * // Move guest to limited bandwidth group
     * await userMgmt.set_usergroup('default', 'guest456', 'guest-group-id');
     * ```
     * 
     * @see {@link list_usergroups} to get available user groups
     * @see {@link create_user} to create new users
     * 
     * @since 1.0.0
     * @category User Management
     * @remarks PHP: set_usergroup($client_id, $group_id)
     */
    async set_usergroup(
        site: string,
        client_id: string,
        group_id: string,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        if (!client_id || typeof client_id !== 'string') {
            throw new Error('Client ID cannot be empty');
        }

        if (!group_id || typeof group_id !== 'string') {
            throw new Error('Group ID cannot be empty');
        }

        const payload = {
            usergroup_id: group_id
        };

        return await this.makeRequest<boolean>({
            method: 'PUT',
            url: `/api/s/{site}/upd/user/${client_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // USER GROUP MANAGEMENT METHODS
    // ============================================================================

    /**
     * Create user group
     * 
     * @description Creates a new user group with specified bandwidth limits.
     * User groups control download/upload speeds and access policies for client devices.
     * 
     * @param site - Site identifier (default: 'default')
     * @param group_name - **Required** Name for the new user group
     * @param group_dn - Download bandwidth limit in Kbps (default: -1 for unlimited)
     * @param group_up - Upload bandwidth limit in Kbps (default: -1 for unlimited)
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to the created user group object
     * 
     * @throws {Error} When group_name validation fails
     * @throws {APIError} When user group creation fails
     * 
     * @example
     * ```typescript
     * // Create unlimited bandwidth group
     * const group = await userMgmt.create_usergroup('default', 'VIP Users');
     * 
     * // Create group with bandwidth limits (10 Mbps down, 5 Mbps up)
     * await userMgmt.create_usergroup('default', 'Guest Users', 10000, 5000);
     * 
     * // Create group with download limit only
     * await userMgmt.create_usergroup('default', 'Basic Users', 5000, -1);
     * ```
     * 
     * @see {@link list_usergroups} to list existing user groups
     * @see {@link delete_usergroup} to remove a user group
     * 
     * @since 1.0.0
     * @category User Management
     * @remarks PHP: create_usergroup($group_name, $group_dn = -1, $group_up = -1)
     */
    async create_usergroup(
        site: string,
        group_name: string,
        group_dn: number = -1,
        group_up: number = -1,
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload = {
            name: group_name,
            qos_rate_max_down: group_dn,
            qos_rate_max_up: group_up
        };

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/rest/usergroup',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List user groups
     * 
     * @description Retrieves all user groups configured in the site.
     * User groups define bandwidth limits and access policies for client devices.
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of user group objects
     * 
     * @throws {APIError} When user group list retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all user groups
     * const groups = await userMgmt.list_usergroups('default');
     * console.log(`Found ${groups.length} user groups`);
     * 
     * // Find specific group by name
     * const vipGroup = groups.find(group => group.name === 'VIP Users');
     * if (vipGroup) {
     *   console.log(`VIP group ID: ${vipGroup._id}`);
     * }
     * ```
     * 
     * @see {@link create_usergroup} to create new user groups
     * @see {@link delete_usergroup} to remove user groups
     * 
     * @since 1.0.0
     * @category User Management
     * @remarks PHP: list_usergroups()
     */
    async list_usergroups(site: string, options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/s/{site}/list/usergroup',
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Delete user group
     * 
     * @description Removes a user group from the site. Users assigned to the deleted
     * group will be moved to the default user group.
     * 
     * @param site - Site identifier (default: 'default')
     * @param group_id - **Required** ID of the user group to delete
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if deletion was successful
     * 
     * @throws {Error} When group_id is invalid
     * @throws {APIError} When user group deletion fails
     * 
     * @example
     * ```typescript
     * // Delete user group by ID
     * await userMgmt.delete_usergroup('default', '507f1f77bcf86cd799439011');
     * 
     * // Find and delete user group by name
     * const groups = await userMgmt.list_usergroups('default');
     * const guestGroup = groups.find(group => group.name === 'Guest Users');
     * if (guestGroup) {
     *   await userMgmt.delete_usergroup('default', guestGroup._id);
     * }
     * ```
     * 
     * @warning Users in the deleted group will be moved to the default group
     * 
     * @see {@link list_usergroups} to get user group IDs
     * @see {@link create_usergroup} to create a new user group
     * 
     * @since 1.0.0
     * @category User Management
     * @remarks PHP: delete_usergroup($group_id)
     */
    async delete_usergroup(site: string, group_id: string, options?: { signal?: AbortSignal }): Promise<boolean> {
        return await this.makeRequest<boolean>({
            method: 'DELETE',
            url: `/api/s/{site}/rest/usergroup/${group_id.trim()}`,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    // ============================================================================
    // ADMINISTRATOR MANAGEMENT METHODS
    // ============================================================================

    /**
     * List site administrators
     * 
     * @description Retrieves a list of administrators who have access to the current site.
     * Includes information about admin roles and permissions.
     * 
     * @param site - Site identifier (default: 'default')
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of site administrator objects
     * 
     * @throws {APIError} When administrator list retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all site administrators
     * const admins = await userMgmt.list_admins('default');
     * console.log(`Site has ${admins.length} administrators`);
     * 
     * // Find super administrators
     * const superAdmins = admins.filter(admin => admin.role === 'admin');
     * 
     * // List admin emails
     * const adminEmails = admins.map(admin => admin.email);
     * console.log('Admin emails:', adminEmails);
     * ```
     * 
     * @see {@link invite_admin} to invite new administrators
     * @see {@link revoke_admin} to remove administrator access
     * 
     * @since 1.0.0
     * @category Administrator Management
     * @remarks PHP: list_admins()
     */
    async list_admins(site: string, options?: { signal?: AbortSignal }): Promise<any> {
        const payload = {
            cmd: 'get-admins'
        };

        return await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/cmd/sitemgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * List all administrators across all sites
     * 
     * @description Retrieves a comprehensive list of all administrators across all sites
     * in the UniFi Controller. This is useful for global administrator management.
     * 
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to array of all administrator objects
     * 
     * @throws {APIError} When administrator list retrieval fails
     * 
     * @example
     * ```typescript
     * // Get all administrators across all sites
     * const allAdmins = await userMgmt.list_all_admins();
     * console.log(`Total administrators: ${allAdmins.length}`);
     * 
     * // Find administrators by email domain
     * const companyAdmins = allAdmins.filter(admin => 
     *   admin.email.endsWith('@company.com')
     * );
     * ```
     * 
     * @see {@link list_admins} to get administrators for a specific site
     * 
     * @since 1.0.0
     * @category Administrator Management
     * @remarks PHP: list_all_admins()
     */
    async list_all_admins(options?: { signal?: AbortSignal }): Promise<any> {
        return await this.makeRequest<any>({
            method: 'GET',
            url: '/api/stat/admin',
            ...(options?.signal && { signal: options.signal }),
        });
    }

    /**
     * Invite admin user
     * 
     * @description Invites a new administrator to the site with specified permissions.
     * The invited user will receive an email invitation to access the UniFi Controller.
     * 
     * @param site - Site identifier (default: 'default')
     * @param name - **Required** Full name of the administrator
     * @param email - **Required** Email address for the administrator
     * @param enable_sso - Enable single sign-on for the administrator (default: true)
     * @param readonly - Grant read-only access instead of full admin (default: false)
     * @param device_adopt - Allow device adoption permissions (default: false)
     * @param device_restart - Allow device restart permissions (default: false)
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if invitation was sent successfully
     * 
     * @throws {Error} When email validation fails
     * @throws {APIError} When admin invitation fails
     * 
     * @example
     * ```typescript
     * // Invite basic administrator
     * await userMgmt.invite_admin(
     *   'default',
     *   'John Smith',
     *   'john.smith@company.com'
     * );
     * 
     * // Invite read-only administrator
     * await userMgmt.invite_admin(
     *   'default',
     *   'Jane Doe',
     *   'jane.doe@company.com',
     *   true,  // enable_sso
     *   true   // readonly
     * );
     * 
     * // Invite administrator with device permissions
     * await userMgmt.invite_admin(
     *   'default',
     *   'Tech Lead',
     *   'tech@company.com',
     *   true,  // enable_sso
     *   false, // readonly
     *   true,  // device_adopt
     *   true   // device_restart
     * );
     * ```
     * 
     * @see {@link list_admins} to view current administrators
     * @see {@link revoke_admin} to remove administrator access
     * 
     * @since 1.0.0
     * @category Administrator Management
     * @remarks PHP: invite_admin($name, $email, $enable_sso = true, $readonly = false, $device_adopt = false, $device_restart = false)
     */
    async invite_admin(
        site: string,
        name: string,
        email: string,
        enable_sso: boolean = true,
        readonly: boolean = false,
        device_adopt: boolean = false,
        device_restart: boolean = false,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        // Basic email validation
        const email_trimmed = email.trim();
        if (!email_trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_trimmed)) {
            throw new Error('Invalid email address');
        }

        const payload: any = {
            name: name.trim(),
            email: email_trimmed,
            for_sso: enable_sso,
            cmd: 'invite-admin',
            role: readonly ? 'readonly' : 'admin',
            permissions: []
        };

        if (device_adopt) {
            payload.permissions.push('API_DEVICE_ADOPT');
        }

        if (device_restart) {
            payload.permissions.push('API_DEVICE_RESTART');
        }

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/sitemgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Assign an existing admin to a site
     * 
     * @description Grants an existing administrator access to a specific site
     * with configurable permissions and roles.
     * 
     * @param site - Site identifier (default: 'default')
     * @param admin_id - **Required** ID of the existing administrator
     * @param readonly - Grant read-only access instead of full admin (default: false)
     * @param device_adopt - Allow device adoption permissions (default: false)
     * @param device_restart - Allow device restart permissions (default: false)
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if assignment was successful
     * 
     * @throws {Error} When admin_id validation fails
     * @throws {APIError} When admin assignment fails
     * 
     * @example
     * ```typescript
     * // Assign existing admin with full permissions
     * await userMgmt.assign_existing_admin('default', 'admin123');
     * 
     * // Assign with read-only access
     * await userMgmt.assign_existing_admin('default', 'admin456', true);
     * 
     * // Assign with device management permissions
     * await userMgmt.assign_existing_admin(
     *   'default',
     *   'admin789',
     *   false, // readonly
     *   true,  // device_adopt
     *   true   // device_restart
     * );
     * ```
     * 
     * @see {@link list_all_admins} to get existing administrator IDs
     * @see {@link revoke_admin} to remove site access
     * 
     * @since 1.0.0
     * @category Administrator Management
     * @remarks PHP: assign_existing_admin($admin_id, $readonly = false, $device_adopt = false, $device_restart = false)
     */
    async assign_existing_admin(
        site: string,
        admin_id: string,
        readonly: boolean = false,
        device_adopt: boolean = false,
        device_restart: boolean = false,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const payload = {
            cmd: 'grant-admin',
            admin: admin_id,
            role: readonly ? 'readonly' : 'admin',
            permissions: [],
            ...(device_adopt && { 'super_device_adopt': true }),
            ...(device_restart && { 'super_device_restart': true }),
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/sitemgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Update an admin
     * 
     * @description Updates an existing administrator's information, permissions, and role.
     * Can modify name, email, password, and various permission settings.
     * 
     * @param site - Site identifier (default: 'default')
     * @param admin_id - **Required** ID of the administrator to update
     * @param name - **Required** Updated full name
     * @param email - **Required** Updated email address
     * @param password - New password (leave empty to keep current password)
     * @param readonly - Set read-only access (default: false)
     * @param device_adopt - Allow device adoption permissions (default: false)
     * @param device_restart - Allow device restart permissions (default: false)
     * @param is_super - Set super administrator status (optional)
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if update was successful
     * 
     * @throws {Error} When email validation fails
     * @throws {APIError} When admin update fails
     * 
     * @example
     * ```typescript
     * // Update admin name and email
     * await userMgmt.update_admin(
     *   'default',
     *   'admin123',
     *   'John Smith Jr.',
     *   'john.smith.jr@company.com'
     * );
     * 
     * // Update admin with new password and permissions
     * await userMgmt.update_admin(
     *   'default',
     *   'admin456',
     *   'Jane Doe',
     *   'jane.doe@company.com',
     *   'newSecurePassword123',
     *   false, // readonly
     *   true,  // device_adopt
     *   true   // device_restart
     * );
     * 
     * // Promote to super administrator
     * await userMgmt.update_admin(
     *   'default',
     *   'admin789',
     *   'Super Admin',
     *   'super@company.com',
     *   '',    // keep current password
     *   false, // readonly
     *   false, // device_adopt
     *   false, // device_restart
     *   true   // is_super
     * );
     * ```
     * 
     * @see {@link list_admins} to get administrator information
     * @see {@link invite_admin} to create new administrators
     * 
     * @since 1.0.0
     * @category Administrator Management
     * @remarks PHP: update_admin($admin_id, $name, $email, $password = '', $readonly = false, $device_adopt = false, $device_restart = false, $is_super = null)
     */
    async update_admin(
        site: string,
        admin_id: string,
        name: string,
        email: string,
        password: string = '',
        readonly: boolean = false,
        device_adopt: boolean = false,
        device_restart: boolean = false,
        is_super?: boolean,
        options?: { signal?: AbortSignal }
    ): Promise<boolean> {
        const trimmed_email = email.trim();

        // Basic email validation
        if (!trimmed_email.includes('@')) {
            throw new Error('Invalid email address');
        }

        const payload: any = {
            admin: admin_id.trim(),
            name: name.trim(),
            email: trimmed_email,
            cmd: 'update-admin',
            role: readonly ? 'readonly' : 'admin',
            x_password: password,
            permissions: []
        };

        if (device_adopt) {
            payload.permissions.push('API_DEVICE_ADOPT');
        }

        if (device_restart) {
            payload.permissions.push('API_DEVICE_RESTART');
        }

        if (is_super !== undefined) {
            payload.is_super = is_super;
        }

        const response = await this.makeRequest<any>({
            method: 'POST',
            url: '/api/s/{site}/cmd/sitemgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
        return response !== null && response !== false;
    }

    /**
     * Revoke admin privileges
     * 
     * @description Removes administrator access from a user for the current site.
     * The user will no longer be able to access or manage the site.
     * 
     * @param site - Site identifier (default: 'default')
     * @param admin_id - **Required** ID of the administrator to revoke
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if revocation was successful
     * 
     * @throws {Error} When admin_id validation fails
     * @throws {APIError} When admin revocation fails
     * 
     * @example
     * ```typescript
     * // Revoke admin access
     * await userMgmt.revoke_admin('default', 'admin123');
     * 
     * // Find and revoke admin by email
     * const admins = await userMgmt.list_admins('default');
     * const targetAdmin = admins.find(admin => admin.email === 'former@company.com');
     * if (targetAdmin) {
     *   await userMgmt.revoke_admin('default', targetAdmin._id);
     * }
     * ```
     * 
     * @warning This action cannot be undone. The user must be re-invited to regain access.
     * 
     * @see {@link list_admins} to get administrator IDs
     * @see {@link invite_admin} to re-invite administrators
     * 
     * @since 1.0.0
     * @category Administrator Management
     * @remarks PHP: revoke_admin($admin_id)
     */
    async revoke_admin(site: string, admin_id: string, options?: { signal?: AbortSignal }): Promise<boolean> {
        if (!admin_id || typeof admin_id !== 'string') {
            throw new Error('Admin ID cannot be empty');
        }

        const payload = {
            cmd: 'revoke-admin',
            admin: admin_id
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/sitemgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Grant super admin privileges
     * 
     * @description Grants super administrator privileges to an existing administrator.
     * Super administrators have elevated permissions across the entire UniFi Controller.
     * 
     * @param site - Site identifier (default: 'default')
     * @param admin_id - **Required** ID of the administrator to promote
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if promotion was successful
     * 
     * @throws {Error} When admin_id validation fails
     * @throws {APIError} When super admin promotion fails
     * 
     * @example
     * ```typescript
     * // Grant super admin privileges
     * await userMgmt.grant_super_admin('default', 'admin123');
     * 
     * // Find and promote admin by name
     * const admins = await userMgmt.list_admins('default');
     * const targetAdmin = admins.find(admin => admin.name === 'Senior Admin');
     * if (targetAdmin) {
     *   await userMgmt.grant_super_admin('default', targetAdmin._id);
     * }
     * ```
     * 
     * @warning Super admin privileges provide extensive system access. Use carefully.
     * 
     * @see {@link list_admins} to get administrator information
     * @see {@link update_admin} for more granular permission control
     * 
     * @since 1.0.0
     * @category Administrator Management
     * @remarks PHP: grant_super_admin($admin_id)
     */
    async grant_super_admin(site: string, admin_id: string, options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            cmd: 'grant-super-admin',
            admin: admin_id
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/sitemgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Delete admin
     * 
     * @description Removes an administrator from the site by revoking their super admin privileges.
     * This is equivalent to calling revoke_admin but uses the delete-admin command.
     * 
     * @param site - Site identifier (default: 'default')
     * @param admin_id - **Required** ID of the administrator to delete
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to true if deletion was successful
     * 
     * @throws {Error} When admin_id validation fails
     * @throws {APIError} When admin deletion fails
     * 
     * @example
     * ```typescript
     * // Delete admin by ID
     * await userMgmt.delete_admin('default', 'admin123');
     * 
     * // Find and delete admin by email
     * const admins = await userMgmt.list_admins('default');
     * const targetAdmin = admins.find(admin => admin.email === 'former@company.com');
     * if (targetAdmin) {
     *   await userMgmt.delete_admin('default', targetAdmin._id);
     * }
     * ```
     * 
     * @warning This action cannot be undone. The user must be re-invited to regain access.
     * 
     * @see {@link list_admins} to get administrator IDs
     * @see {@link revoke_admin} for alternative admin removal method
     * 
     * @since 1.0.0
     * @category Administrator Management
     * @remarks PHP: delete_admin($admin_id)
     */
    async delete_admin(site: string, admin_id: string, options?: { signal?: AbortSignal }): Promise<boolean> {
        const payload = {
            cmd: 'revoke-super-admin',
            admin: admin_id
        };

        return await this.makeRequest<boolean>({
            method: 'POST',
            url: '/api/s/{site}/cmd/sitemgr',
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }

    /**
     * Edit user group
     * 
     * @description Updates an existing user group's configuration including name and bandwidth limits.
     * This allows modification of download/upload speed limits and group identification.
     * 
     * @param site - Site identifier (default: 'default')
     * @param group_id - **Required** ID of the user group to edit
     * @param site_id - **Required** Site ID where the group exists
     * @param group_name - **Required** New name for the user group
     * @param group_dn - Download bandwidth limit in Kbps (default: -1 for unlimited)
     * @param group_up - Upload bandwidth limit in Kbps (default: -1 for unlimited)
     * @param options - Optional request configuration
     * @param options.signal - Optional AbortSignal to cancel the request
     * 
     * @returns Promise resolving to the updated user group object
     * 
     * @throws {Error} When group_id, site_id, or group_name validation fails
     * @throws {APIError} When user group update fails
     * 
     * @example
     * ```typescript
     * // Update group name only
     * await userMgmt.edit_usergroup(
     *   'default',
     *   'group123',
     *   'site456',
     *   'Updated VIP Users'
     * );
     * 
     * // Update group with new bandwidth limits (20 Mbps down, 10 Mbps up)
     * await userMgmt.edit_usergroup(
     *   'default',
     *   'group123',
     *   'site456',
     *   'High Speed Users',
     *   20000,  // 20 Mbps down
     *   10000   // 10 Mbps up
     * );
     * 
     * // Remove bandwidth limits (set to unlimited)
     * await userMgmt.edit_usergroup(
     *   'default',
     *   'group123',
     *   'site456',
     *   'Unlimited Users',
     *   -1,     // unlimited down
     *   -1      // unlimited up
     * );
     * ```
     * 
     * @see {@link list_usergroups} to get user group IDs
     * @see {@link create_usergroup} to create new user groups
     * 
     * @since 1.0.0
     * @category User Management
     * @remarks PHP: edit_usergroup($group_id, $site_id, $group_name, $group_dn = -1, $group_up = -1)
     */
    async edit_usergroup(
        site: string,
        group_id: string,
        site_id: string,
        group_name: string,
        group_dn: number = -1,
        group_up: number = -1,
        options?: { signal?: AbortSignal }
    ): Promise<any> {
        const payload = {
            _id: group_id,
            name: group_name,
            qos_rate_max_down: group_dn,
            qos_rate_max_up: group_up,
            site_id: site_id
        };

        return await this.makeRequest<any>({
            method: 'PUT',
            url: `/api/s/{site}/rest/usergroup/${group_id.trim()}`,
            data: payload,
            ...(options?.signal && { signal: options.signal }),
        }, site);
    }
}