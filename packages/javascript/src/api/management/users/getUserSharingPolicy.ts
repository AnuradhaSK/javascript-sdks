// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {SharingPolicy} from '../../../models/sharing-policy';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getUserSharingPolicy request.
 */
export interface GetUserSharingPolicyConfig extends ManagementRequestConfig {
  /**
   * Identifier of the sharing policy.
   */
  policyId: string;
  /**
   * Identifier of the user.
   */
  userId: string;
}

/**
 * Retrieves a sharing policy of a user.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the policy.
 *
 * @example
 * ```typescript
 * const policy = await getUserSharingPolicy({baseUrl: 'https://localhost:8090', userId, policyId});
 * ```
 */
const getUserSharingPolicy = async ({
  policyId,
  userId,
  ...config
}: GetUserSharingPolicyConfig): Promise<SharingPolicy> =>
  requestManagementResource<SharingPolicy>(config, {
    collection: 'users',
    failureMessage: 'Failed to fetch sharing policy',
    id: userId,
    method: 'GET',
    operation: 'getUserSharingPolicy',
    subPath: `sharing-policies/${encodePathSegments('getUserSharingPolicy', [policyId])}`,
  });

export default getUserSharingPolicy;
