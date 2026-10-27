// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {ManagedFlowListResponse} from '../../../models/managed-flow';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getFlows request.
 */
export type GetFlowsConfig = ManagementRequestConfig &
  Pick<ApiFilteringParams, 'limit' | 'offset'> & {
    /**
     * Restricts the list to one flow type, for example `AUTHENTICATION`. All flows are returned
     * when omitted.
     */
    flowType?: string;
  };

/**
 * Retrieves a page of flows.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page of flows.
 *
 * @example
 * ```typescript
 * const {flows, totalResults} = await getFlows({
 *   baseUrl: 'https://localhost:8090',
 *   flowType: 'AUTHENTICATION',
 *   limit: 30,
 * });
 * ```
 */
const getFlows = async ({flowType, limit, offset, ...config}: GetFlowsConfig): Promise<ManagedFlowListResponse> =>
  requestManagementResource<ManagedFlowListResponse>(config, {
    collection: 'flows',
    failureMessage: 'Failed to fetch flows',
    method: 'GET',
    operation: 'getFlows',
    query: {flowType, limit, offset},
  });

export default getFlows;
