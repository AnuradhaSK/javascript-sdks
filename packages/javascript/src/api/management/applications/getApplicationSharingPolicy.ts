// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {SharingPolicy} from '../../../models/sharing-policy';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getApplicationSharingPolicy request.
 */
export interface GetApplicationSharingPolicyConfig extends ManagementRequestConfig {
  /**
   * Identifier of the application.
   */
  applicationId: string;
  /**
   * Identifier of the sharing policy.
   */
  policyId: string;
}

/**
 * Retrieves a sharing policy of an application.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the policy.
 *
 * @example
 * ```typescript
 * const policy = await getApplicationSharingPolicy({baseUrl: 'https://localhost:8090', applicationId, policyId});
 * ```
 */
const getApplicationSharingPolicy = async ({
  applicationId,
  policyId,
  ...config
}: GetApplicationSharingPolicyConfig): Promise<SharingPolicy> =>
  requestManagementResource<SharingPolicy>(config, {
    collection: 'applications',
    failureMessage: 'Failed to fetch sharing policy',
    id: applicationId,
    method: 'GET',
    operation: 'getApplicationSharingPolicy',
    subPath: `sharing-policies/${encodePathSegments('getApplicationSharingPolicy', [policyId])}`,
  });

export default getApplicationSharingPolicy;
