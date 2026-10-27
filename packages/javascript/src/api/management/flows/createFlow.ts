// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedFlowDefinition, ManagedFlowRequest} from '../../../models/managed-flow';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createFlow request.
 */
export interface CreateFlowConfig extends ManagementRequestConfig {
  /**
   * The flow to create.
   */
  payload: ManagedFlowRequest;
}

/**
 * Creates a flow.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the flow as the server stored it.
 *
 * @example
 * ```typescript
 * const flow = await createFlow({
 *   baseUrl: 'https://localhost:8090',
 *   payload: {flowType: 'AUTHENTICATION', handle: 'basic-login', name: 'Basic login', nodes},
 * });
 * ```
 */
const createFlow = async ({payload, ...config}: CreateFlowConfig): Promise<ManagedFlowDefinition> =>
  requestManagementResource<ManagedFlowDefinition>(config, {
    body: payload,
    collection: 'flows',
    failureMessage: 'Failed to create flow',
    method: 'POST',
    operation: 'createFlow',
  });

export default createFlow;
