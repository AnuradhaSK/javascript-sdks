// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {SharingPolicy, SharingPolicyRequest} from '../../../models/sharing-policy';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createUserSharingPolicy request.
 */
export interface CreateUserSharingPolicyConfig extends ManagementRequestConfig {
  /**
   * The policy to create.
   */
  payload: SharingPolicyRequest;
  /**
   * Identifier of the user.
   */
  userId: string;
}

/**
 * Creates a sharing policy for a user: the organization units it reaches beyond its owner.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the policy as the server stored it.
 *
 * @example
 * ```typescript
 * const policy = await createUserSharingPolicy({
 *   baseUrl: 'https://localhost:8090',
 *   userId,
 *   payload: {childUnits: {mode: 'all'}},
 * });
 * ```
 */
const createUserSharingPolicy = async ({
  payload,
  userId,
  ...config
}: CreateUserSharingPolicyConfig): Promise<SharingPolicy> =>
  requestManagementResource<SharingPolicy>(config, {
    body: payload,
    collection: 'users',
    failureMessage: 'Failed to create sharing policy',
    id: userId,
    method: 'POST',
    operation: 'createUserSharingPolicy',
    subPath: 'sharing-policies',
  });

export default createUserSharingPolicy;
