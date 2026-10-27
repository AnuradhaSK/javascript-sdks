// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {AgentTypeDetails} from '../../../models/entity-type';
import requestManagementResource from '../../../utils/requestManagementResource';

export interface GetAgentTypeConfig extends ManagementRequestConfig {
  /**
   * Identifier of the agent type.
   */
  agentTypeId: string;
}

/**
 * Fetches an agent type with its attribute schema.
 */
const getAgentType = async ({agentTypeId, ...config}: GetAgentTypeConfig): Promise<AgentTypeDetails> =>
  requestManagementResource<AgentTypeDetails>(config, {
    collection: 'agent-types',
    failureMessage: 'Failed to fetch agent type',
    id: agentTypeId,
    method: 'GET',
    operation: 'getAgentType',
    query: {include: 'display'},
  });

export default getAgentType;
