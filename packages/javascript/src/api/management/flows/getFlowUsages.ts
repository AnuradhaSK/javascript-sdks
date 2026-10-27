// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ResourceUsagesResponse} from '../../../models/resource-usage';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getFlowUsages request.
 */
export interface GetFlowUsagesConfig extends ManagementRequestConfig {
  /**
   * Identifier of the flow.
   */
  flowId: string;
}

/**
 * Retrieves the applications and agents that use a flow.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the usages.
 *
 * @example
 * ```typescript
 * const {usages} = await getFlowUsages({baseUrl: 'https://localhost:8090', flowId});
 * ```
 */
const getFlowUsages = async ({flowId, ...config}: GetFlowUsagesConfig): Promise<ResourceUsagesResponse> =>
  requestManagementResource<ResourceUsagesResponse>(config, {
    collection: 'flows',
    failureMessage: 'Failed to fetch flow usages',
    id: flowId,
    method: 'GET',
    operation: 'getFlowUsages',
    subPath: 'usages',
  });

export default getFlowUsages;
