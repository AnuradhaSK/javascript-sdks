// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDAPIError from '../../../errors/ThunderIDAPIError';
import {
  AccountLifecycleAction,
  AccountLifecycleOptions,
  AccountLifecycleResult,
  AccountLifecycleSubjectKind,
} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import suspendAgent from '../agents/suspendAgent';
import unlockAgent from '../agents/unlockAgent';
import unsuspendAgent from '../agents/unsuspendAgent';
import suspendApplication from '../applications/suspendApplication';
import unsuspendApplication from '../applications/unsuspendApplication';
import suspendUser from '../users/suspendUser';
import unlockUser from '../users/unlockUser';
import unsuspendUser from '../users/unsuspendUser';

/**
 * Configuration for the runAccountLifecycleAction request.
 */
export interface RunAccountLifecycleActionConfig extends ManagementRequestConfig, AccountLifecycleOptions {
  action: AccountLifecycleAction;
  kind: AccountLifecycleSubjectKind;
  /**
   * Identifier of the user, agent or application.
   */
  subject: string;
}

type LifecycleOperation = (
  config: ManagementRequestConfig & AccountLifecycleOptions,
  subject: string,
) => Promise<AccountLifecycleResult>;

/**
 * The operation behind each action, by the kind of identity. Applications are never locked.
 */
const OPERATIONS: Record<AccountLifecycleSubjectKind, Partial<Record<AccountLifecycleAction, LifecycleOperation>>> = {
  agent: {
    suspend: (config, agentId) => suspendAgent({...config, agentId}),
    unlock: (config, agentId) => unlockAgent({...config, agentId}),
    unsuspend: (config, agentId) => unsuspendAgent({...config, agentId}),
  },
  application: {
    suspend: (config, applicationId) => suspendApplication({...config, applicationId}),
    unsuspend: (config, applicationId) => unsuspendApplication({...config, applicationId}),
  },
  user: {
    suspend: (config, userId) => suspendUser({...config, userId}),
    unlock: (config, userId) => unlockUser({...config, userId}),
    unsuspend: (config, userId) => unsuspendUser({...config, userId}),
  },
};

/**
 * Runs an account lifecycle action against a user, agent or application, through the operation for that
 * kind and action (for example `suspendUser`). Each raises its own errors, so a missing flow fails with
 * that operation's `NotConfiguredError`. An action that does not apply to the kind, such as unlocking an
 * application, is refused with `runAccountLifecycleAction-ValidationError-001`.
 *
 * @param config - Request configuration object. Running a flow needs `baseUrl`, and a token that may read
 * the server configuration and run administration flows.
 * @returns Whether the flow's email step sent its notification, absent when the flow has no email step.
 *
 * @example
 * ```typescript
 * await runAccountLifecycleAction({action: 'suspend', baseUrl, kind: 'user', operatorNote: 'Ticket 4521', subject: userId});
 * ```
 */
const runAccountLifecycleAction = async ({
  action,
  kind,
  subject,
  ...config
}: RunAccountLifecycleActionConfig): Promise<AccountLifecycleResult> => {
  const operation: LifecycleOperation | undefined = OPERATIONS[kind]?.[action];

  if (!operation) {
    throw new ThunderIDAPIError(
      `The ${action} action does not apply to ${kind} accounts.`,
      'runAccountLifecycleAction-ValidationError-001',
      'javascript',
      400,
      `The ${action} action does not apply to the ${kind} kind.`,
    );
  }

  return operation(config, subject);
};

export default runAccountLifecycleAction;
