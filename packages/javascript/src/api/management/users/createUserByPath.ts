// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {CreateUserByPathRequest, ManagedUser} from '../../../models/managed-user';
import encodeHandlePath from '../../../utils/encodeHandlePath';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createUserByPath request.
 */
export interface CreateUserByPathConfig extends ManagementRequestConfig {
  /**
   * Handle path of the organization unit, such as `engineering/platform`. Each handle is encoded and the
   * slashes between them are kept.
   */
  path: string;
  /**
   * The user to create.
   */
  payload: CreateUserByPathRequest;
}

/**
 * Creates a user in the organization unit at a handle path.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the user as the server stored it.
 *
 * @example
 * ```typescript
 * const user = await createUserByPath({
 *   baseUrl: 'https://localhost:8090',
 *   path: 'engineering/platform',
 *   payload: {type: 'customer', attributes: {username: 'alice'}},
 * });
 * ```
 */
const createUserByPath = async ({path, payload, ...config}: CreateUserByPathConfig): Promise<ManagedUser> =>
  requestManagementResource<ManagedUser>(config, {
    body: payload,
    collection: 'users',
    failureMessage: 'Failed to create user',
    id: 'tree',
    method: 'POST',
    operation: 'createUserByPath',
    subPath: encodeHandlePath('createUserByPath', path),
  });

export default createUserByPath;
