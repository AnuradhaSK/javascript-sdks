// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteApplicationSharingPolicy request.
 */
export interface DeleteApplicationSharingPolicyConfig extends ManagementRequestConfig {
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
 * Deletes a sharing policy of an application.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteApplicationSharingPolicy({baseUrl: 'https://localhost:8090', applicationId, policyId});
 * ```
 */
const deleteApplicationSharingPolicy = async ({
  applicationId,
  policyId,
  ...config
}: DeleteApplicationSharingPolicyConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'applications',
    failureMessage: 'Failed to delete sharing policy',
    id: applicationId,
    method: 'DELETE',
    operation: 'deleteApplicationSharingPolicy',
    subPath: `sharing-policies/${encodePathSegments('deleteApplicationSharingPolicy', [policyId])}`,
  });
};

export default deleteApplicationSharingPolicy;
