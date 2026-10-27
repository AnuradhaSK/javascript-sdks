// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteFlow request.
 */
export interface DeleteFlowConfig extends ManagementRequestConfig {
  /**
   * Identifier of the flow.
   */
  flowId: string;
}

/**
 * Deletes a flow.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteFlow({baseUrl: 'https://localhost:8090', flowId});
 * ```
 */
const deleteFlow = async ({flowId, ...config}: DeleteFlowConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'flows',
    failureMessage: 'Failed to delete flow',
    id: flowId,
    method: 'DELETE',
    operation: 'deleteFlow',
  });
};

export default deleteFlow;
