// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {SharingPolicy, SharingPolicyUpdateRequest} from '../../../models/sharing-policy';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateUserSharingPolicy request.
 */
export interface UpdateUserSharingPolicyConfig extends ManagementRequestConfig {
  /**
   * The policy's new sections and the version being edited.
   */
  payload: SharingPolicyUpdateRequest;
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
 * Replaces the sections of a sharing policy of a user. The payload names the version it edits, and an edit
 * against any other version is refused.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the policy as the server stored it.
 *
 * @example
 * ```typescript
 * const policy = await updateUserSharingPolicy({
 *   baseUrl: 'https://localhost:8090',
 *   userId,
 *   policyId,
 *   payload: {childUnits: {mode: 'all', excludedOuIds: [ouId]}, version: 1},
 * });
 * ```
 */
const updateUserSharingPolicy = async ({
  payload,
  policyId,
  userId,
  ...config
}: UpdateUserSharingPolicyConfig): Promise<SharingPolicy> =>
  requestManagementResource<SharingPolicy>(config, {
    body: payload,
    collection: 'users',
    failureMessage: 'Failed to update sharing policy',
    id: userId,
    method: 'PUT',
    operation: 'updateUserSharingPolicy',
    subPath: `sharing-policies/${encodePathSegments('updateUserSharingPolicy', [policyId])}`,
  });

export default updateUserSharingPolicy;
