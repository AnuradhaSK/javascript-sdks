// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteAgentType request.
 */
export interface DeleteAgentTypeConfig extends ManagementRequestConfig {
  /**
   * Identifier of the agent type to delete.
   */
  agentTypeId: string;
}

/**
 * Deletes an agent type. The server currently refuses this for its single `default` agent type
 * (`USRS-1015`), which agent creation depends on; update it in place instead.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteAgentType({baseUrl: 'https://localhost:8090', agentTypeId});
 * ```
 */
const deleteAgentType = async ({agentTypeId, ...config}: DeleteAgentTypeConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'agent-types',
    failureMessage: 'Failed to delete agent type',
    id: agentTypeId,
    method: 'DELETE',
    operation: 'deleteAgentType',
  });
};

export default deleteAgentType;
