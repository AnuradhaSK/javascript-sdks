// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedFlowVersion} from '../../../models/managed-flow';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getFlowVersion request.
 */
export interface GetFlowVersionConfig extends ManagementRequestConfig {
  /**
   * Identifier of the flow.
   */
  flowId: string;
  /**
   * The version number.
   */
  version: number;
}

/**
 * Retrieves one version of a flow, with its graph.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the version.
 *
 * @example
 * ```typescript
 * const flowVersion = await getFlowVersion({baseUrl: 'https://localhost:8090', flowId, version: 2});
 * ```
 */
const getFlowVersion = async ({flowId, version, ...config}: GetFlowVersionConfig): Promise<ManagedFlowVersion> =>
  requestManagementResource<ManagedFlowVersion>(config, {
    collection: 'flows',
    failureMessage: 'Failed to fetch flow version',
    id: flowId,
    method: 'GET',
    operation: 'getFlowVersion',
    subPath: `versions/${encodePathSegments('getFlowVersion', [String(version)])}`,
  });

export default getFlowVersion;
