// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AdministrationFlowConfigKey} from '../../../constants/AdministrationConstants';
import {AccountLifecycleOptions, AccountLifecycleResult} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import runAccountLifecycleFlow from '../administration/runAccountLifecycleFlow';

/**
 * Configuration for the suspendAgent request.
 */
export interface SuspendAgentConfig extends ManagementRequestConfig, AccountLifecycleOptions {
  /**
   * Identifier of the agent.
   */
  agentId: string;
}

/**
 * Suspends an agent, so it can no longer authenticate, through the agent suspension flow the server
 * configures. There is no management API endpoint for this, so when no flow is configured the call fails
 * with `suspendAgent-NotConfiguredError-001`.
 *
 * @param config - Request configuration object. Running a flow needs `baseUrl`, and a token that may read
 * the server configuration and run administration flows.
 * @returns A promise that resolves with whether the flow's email step sent its notification, absent when
 * the flow has no email step.
 *
 * @example
 * ```typescript
 * const {emailSent} = await suspendAgent({baseUrl: 'https://localhost:8090', agentId, operatorNote: 'Ticket 4521'});
 * ```
 */
const suspendAgent = async ({agentId, operatorNote, ...config}: SuspendAgentConfig): Promise<AccountLifecycleResult> =>
  runAccountLifecycleFlow(config, {
    action: 'agent suspension',
    configKey: AdministrationFlowConfigKey.AGENT_SUSPEND,
    operation: 'suspendAgent',
    operatorNote,
    subject: agentId,
  });

export default suspendAgent;
