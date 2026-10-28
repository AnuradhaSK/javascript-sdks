// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedFlowDefinition} from '../../../models/managed-flow';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the restoreFlowVersion request.
 */
export interface RestoreFlowVersionConfig extends ManagementRequestConfig {
  /**
   * Identifier of the flow.
   */
  flowId: string;
  /**
   * The version number to restore.
   */
  version: number;
}

/**
 * Restores a flow to one of its previous versions.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the flow as the server stored it.
 *
 * @example
 * ```typescript
 * const flow = await restoreFlowVersion({baseUrl: 'https://localhost:8090', flowId, version: 2});
 * ```
 */
const restoreFlowVersion = async ({
  flowId,
  version,
  ...config
}: RestoreFlowVersionConfig): Promise<ManagedFlowDefinition> =>
  requestManagementResource<ManagedFlowDefinition>(config, {
    body: {version},
    collection: 'flows',
    failureMessage: 'Failed to restore flow version',
    id: flowId,
    method: 'POST',
    operation: 'restoreFlowVersion',
    subPath: 'restore',
  });

export default restoreFlowVersion;
