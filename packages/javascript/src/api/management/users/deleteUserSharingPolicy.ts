// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteUserSharingPolicy request.
 */
export interface DeleteUserSharingPolicyConfig extends ManagementRequestConfig {
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
 * Deletes a sharing policy of a user.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteUserSharingPolicy({baseUrl: 'https://localhost:8090', userId, policyId});
 * ```
 */
const deleteUserSharingPolicy = async ({policyId, userId, ...config}: DeleteUserSharingPolicyConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'users',
    failureMessage: 'Failed to delete sharing policy',
    id: userId,
    method: 'DELETE',
    operation: 'deleteUserSharingPolicy',
    subPath: `sharing-policies/${encodePathSegments('deleteUserSharingPolicy', [policyId])}`,
  });
};

export default deleteUserSharingPolicy;
