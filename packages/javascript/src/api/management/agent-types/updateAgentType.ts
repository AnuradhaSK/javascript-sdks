// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {AgentTypeDetails, UpdateAgentTypeRequest} from '../../../models/entity-type';
import requestManagementResource from '../../../utils/requestManagementResource';

export interface UpdateAgentTypeConfig extends ManagementRequestConfig {
  /**
   * Identifier of the agent type.
   */
  agentTypeId: string;
  /**
   * The agent type's new state.
   */
  payload: UpdateAgentTypeRequest;
}

/**
 * Updates an agent type.
 */
const updateAgentType = async ({agentTypeId, payload, ...config}: UpdateAgentTypeConfig): Promise<AgentTypeDetails> =>
  requestManagementResource<AgentTypeDetails>(config, {
    body: payload,
    collection: 'agent-types',
    failureMessage: 'Failed to update agent type',
    id: agentTypeId,
    method: 'PUT',
    operation: 'updateAgentType',
  });

export default updateAgentType;
