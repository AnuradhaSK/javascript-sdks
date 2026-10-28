// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {AgentTypeDetails, CreateAgentTypeRequest} from '../../../models/entity-type';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createAgentType request.
 */
export interface CreateAgentTypeConfig extends ManagementRequestConfig {
  /**
   * The agent type to create.
   */
  payload: CreateAgentTypeRequest;
}

/**
 * Creates the agent type. The server holds a single agent type, whose handle is `default`.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the agent type as the server stored it.
 *
 * @example
 * ```typescript
 * const agentType = await createAgentType({
 *   baseUrl: 'https://localhost:8090',
 *   payload: {displayName: 'Default', handle: 'default', ouId, schema: {}},
 * });
 * ```
 */
const createAgentType = async ({payload, ...config}: CreateAgentTypeConfig): Promise<AgentTypeDetails> =>
  requestManagementResource<AgentTypeDetails>(config, {
    body: payload,
    collection: 'agent-types',
    failureMessage: 'Failed to create agent type',
    method: 'POST',
    operation: 'createAgentType',
  });

export default createAgentType;
