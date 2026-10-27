// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AdministrationFlowConfigKey} from '../../../constants/AdministrationConstants';
import {AccountLifecycleOptions, AccountLifecycleResult} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import runAccountLifecycleFlow from '../administration/runAccountLifecycleFlow';

/**
 * Configuration for the unsuspendAgent request.
 */
export interface UnsuspendAgentConfig extends ManagementRequestConfig, AccountLifecycleOptions {
  /**
   * Identifier of the agent.
   */
  agentId: string;
}

/**
 * Lifts the suspension of an agent through the agent unsuspension flow the server configures. There is no
 * management API endpoint for this, so when no flow is configured the call fails with
 * `unsuspendAgent-NotConfiguredError-001`.
 *
 * @param config - Request configuration object. Running a flow needs `baseUrl`, and a token that may read
 * the server configuration and run administration flows.
 * @returns A promise that resolves with whether the flow's email step sent its notification, absent when
 * the flow has no email step.
 *
 * @example
 * ```typescript
 * const {emailSent} = await unsuspendAgent({baseUrl: 'https://localhost:8090', agentId, operatorNote: 'Ticket 4521'});
 * ```
 */
const unsuspendAgent = async ({
  agentId,
  operatorNote,
  ...config
}: UnsuspendAgentConfig): Promise<AccountLifecycleResult> =>
  runAccountLifecycleFlow(config, {
    action: 'agent unsuspension',
    configKey: AdministrationFlowConfigKey.AGENT_UNSUSPEND,
    operation: 'unsuspendAgent',
    operatorNote,
    subject: agentId,
  });

export default unsuspendAgent;
