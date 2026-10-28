// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {SharingPolicyListResponse} from '../../../models/sharing-policy';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getUserSharingPolicies request.
 */
export interface GetUserSharingPoliciesConfig
  extends ManagementRequestConfig,
    Pick<ApiFilteringParams, 'limit' | 'offset'> {
  /**
   * Identifier of the user.
   */
  userId: string;
}

/**
 * Retrieves a page of the sharing policies of a user.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {policies} = await getUserSharingPolicies({baseUrl: 'https://localhost:8090', userId});
 * ```
 */
const getUserSharingPolicies = async ({
  limit,
  offset,
  userId,
  ...config
}: GetUserSharingPoliciesConfig): Promise<SharingPolicyListResponse> =>
  requestManagementResource<SharingPolicyListResponse>(config, {
    collection: 'users',
    failureMessage: 'Failed to fetch sharing policies',
    id: userId,
    method: 'GET',
    operation: 'getUserSharingPolicies',
    query: {limit, offset},
    subPath: 'sharing-policies',
  });

export default getUserSharingPolicies;
