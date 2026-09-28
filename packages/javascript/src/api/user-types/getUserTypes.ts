// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../models/api';
import {ManagedUserTypeListResponse} from '../../models/managed-user-type';
import requestManagementResource from '../../utils/requestManagementResource';

/**
 * Configuration for the getUserTypes request.
 */
export type GetUserTypesConfig = ManagementRequestConfig & Pick<ApiFilteringParams, 'limit' | 'offset'>;

/**
 * Retrieves a page of user types.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page of user types.
 *
 * @example
 * ```typescript
 * const {types, totalResults} = await getUserTypes({
 *   baseUrl: 'https://localhost:8090',
 *   limit: 30,
 * });
 * ```
 */
const getUserTypes = async ({limit, offset, ...config}: GetUserTypesConfig): Promise<ManagedUserTypeListResponse> =>
  requestManagementResource<ManagedUserTypeListResponse>(config, {
    collection: 'user-types',
    failureMessage: 'Failed to fetch user types',
    method: 'GET',
    operation: 'getUserTypes',
    query: {limit, offset},
  });

export default getUserTypes;
