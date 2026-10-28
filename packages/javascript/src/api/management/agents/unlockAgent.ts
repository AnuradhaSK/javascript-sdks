// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AdministrationFlowConfigKey} from '../../../constants/AdministrationConstants';
import {AccountLifecycleOptions, AccountLifecycleResult} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import runAccountLifecycleFlow from '../administration/runAccountLifecycleFlow';

/**
 * Configuration for the unlockAgent request.
 */
export interface UnlockAgentConfig extends ManagementRequestConfig, AccountLifecycleOptions {
  /**
   * Identifier of the agent.
   */
  agentId: string;
}

/**
 * Unlocks an agent locked out after repeated failed authentication attempts, through the agent unlock flow
 * the server configures. There is no management API endpoint for this, so when no flow is configured the
 * call fails with `unlockAgent-NotConfiguredError-001`.
 *
 * @param config - Request configuration object. Running a flow needs `baseUrl`, and a token that may read
 * the server configuration and run administration flows.
 * @returns A promise that resolves with whether the flow's email step sent its notification, absent when
 * the flow has no email step.
 *
 * @example
 * ```typescript
 * const {emailSent} = await unlockAgent({baseUrl: 'https://localhost:8090', agentId, operatorNote: 'Ticket 4521'});
 * ```
 */
const unlockAgent = async ({agentId, operatorNote, ...config}: UnlockAgentConfig): Promise<AccountLifecycleResult> =>
  runAccountLifecycleFlow(config, {
    action: 'agent unlock',
    configKey: AdministrationFlowConfigKey.AGENT_UNLOCK,
    operation: 'unlockAgent',
    operatorNote,
    subject: agentId,
  });

export default unlockAgent;
