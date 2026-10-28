// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedFlowVersionListResponse} from '../../../models/managed-flow';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getFlowVersions request.
 */
export interface GetFlowVersionsConfig extends ManagementRequestConfig {
  /**
   * Identifier of the flow.
   */
  flowId: string;
}

/**
 * Retrieves a flow's version history.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the versions.
 *
 * @example
 * ```typescript
 * const {versions} = await getFlowVersions({baseUrl: 'https://localhost:8090', flowId});
 * ```
 */
const getFlowVersions = async ({flowId, ...config}: GetFlowVersionsConfig): Promise<ManagedFlowVersionListResponse> =>
  requestManagementResource<ManagedFlowVersionListResponse>(config, {
    collection: 'flows',
    failureMessage: 'Failed to fetch flow versions',
    id: flowId,
    method: 'GET',
    operation: 'getFlowVersions',
    subPath: 'versions',
  });

export default getFlowVersions;
