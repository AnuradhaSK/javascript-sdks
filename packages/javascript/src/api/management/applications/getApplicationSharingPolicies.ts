// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {SharingPolicyListResponse} from '../../../models/sharing-policy';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getApplicationSharingPolicies request.
 */
export interface GetApplicationSharingPoliciesConfig
  extends ManagementRequestConfig,
    Pick<ApiFilteringParams, 'limit' | 'offset'> {
  /**
   * Identifier of the application.
   */
  applicationId: string;
}

/**
 * Retrieves a page of the sharing policies of an application.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {policies} = await getApplicationSharingPolicies({baseUrl: 'https://localhost:8090', applicationId});
 * ```
 */
const getApplicationSharingPolicies = async ({
  applicationId,
  limit,
  offset,
  ...config
}: GetApplicationSharingPoliciesConfig): Promise<SharingPolicyListResponse> =>
  requestManagementResource<SharingPolicyListResponse>(config, {
    collection: 'applications',
    failureMessage: 'Failed to fetch sharing policies',
    id: applicationId,
    method: 'GET',
    operation: 'getApplicationSharingPolicies',
    query: {limit, offset},
    subPath: 'sharing-policies',
  });

export default getApplicationSharingPolicies;
