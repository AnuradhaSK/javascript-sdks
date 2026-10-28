// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {SharingPolicy, SharingPolicyUpdateRequest} from '../../../models/sharing-policy';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateApplicationSharingPolicy request.
 */
export interface UpdateApplicationSharingPolicyConfig extends ManagementRequestConfig {
  /**
   * Identifier of the application.
   */
  applicationId: string;
  /**
   * The policy's new sections and the version being edited.
   */
  payload: SharingPolicyUpdateRequest;
  /**
   * Identifier of the sharing policy.
   */
  policyId: string;
}

/**
 * Replaces the sections of a sharing policy of an application. The payload names the version it edits, and
 * an edit against any other version is refused.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the policy as the server stored it.
 *
 * @example
 * ```typescript
 * const policy = await updateApplicationSharingPolicy({
 *   baseUrl: 'https://localhost:8090',
 *   applicationId,
 *   policyId,
 *   payload: {childUnits: {mode: 'all', excludedOuIds: [ouId]}, version: 1},
 * });
 * ```
 */
const updateApplicationSharingPolicy = async ({
  applicationId,
  payload,
  policyId,
  ...config
}: UpdateApplicationSharingPolicyConfig): Promise<SharingPolicy> =>
  requestManagementResource<SharingPolicy>(config, {
    body: payload,
    collection: 'applications',
    failureMessage: 'Failed to update sharing policy',
    id: applicationId,
    method: 'PUT',
    operation: 'updateApplicationSharingPolicy',
    subPath: `sharing-policies/${encodePathSegments('updateApplicationSharingPolicy', [policyId])}`,
  });

export default updateApplicationSharingPolicy;
