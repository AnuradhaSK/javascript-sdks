// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedFlowDefinition, ManagedFlowRequest} from '../../../models/managed-flow';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateFlow request.
 */
export interface UpdateFlowConfig extends ManagementRequestConfig {
  /**
   * Identifier of the flow.
   */
  flowId: string;
  /**
   * The flow's new state.
   */
  payload: ManagedFlowRequest;
}

/**
 * Updates a flow. The server keeps the previous graph as a version.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the flow as the server stored it.
 *
 * @example
 * ```typescript
 * const flow = await updateFlow({
 *   baseUrl: 'https://localhost:8090',
 *   flowId,
 *   payload: {flowType: 'AUTHENTICATION', handle: 'basic-login', name: 'Basic login', nodes},
 * });
 * ```
 */
const updateFlow = async ({flowId, payload, ...config}: UpdateFlowConfig): Promise<ManagedFlowDefinition> =>
  requestManagementResource<ManagedFlowDefinition>(config, {
    body: payload,
    collection: 'flows',
    failureMessage: 'Failed to update flow',
    id: flowId,
    method: 'PUT',
    operation: 'updateFlow',
  });

export default updateFlow;
