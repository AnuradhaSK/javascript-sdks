// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import runAdministrationFlow from './runAdministrationFlow';
import {AdministrationFlowData, AdministrationFlowInput} from '../../../constants/AdministrationConstants';
import AdministrationFlowError from '../../../errors/AdministrationFlowError';
import ThunderIDAPIError from '../../../errors/ThunderIDAPIError';
import {AccountLifecycleResult, AdministrationFlowConfigKeyValue} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';

/**
 * Describes one account lifecycle operation, such as suspending a user.
 */
export interface AccountLifecycleOperation {
  /**
   * What the flow does, for messages, such as `user suspension`.
   */
  action: string;
  /**
   * The `flow` server-config key that names the operation's flow.
   */
  configKey: AdministrationFlowConfigKeyValue;
  /**
   * Name of the calling operation, used as the prefix of every error code it raises.
   */
  operation: string;
  /**
   * The operator's note, passed to the flow when given.
   */
  operatorNote?: string;
  /**
   * Identifier of the account the operation acts on.
   */
  subject: string;
}

/**
 * Runs an account lifecycle operation, such as suspending, unsuspending or unlocking an account, through
 * the administration flow the server configures for it.
 *
 * These operations have no management API endpoint: the flow is the only way to carry them out. So,
 * unlike a deletion, an operation with no flow configured is refused with
 * `{operation}-NotConfiguredError-001` rather than falling back to a direct call.
 *
 * @returns Whether the flow's email step sent its notification, when the flow has one.
 */
const runAccountLifecycleFlow = async (
  config: ManagementRequestConfig,
  {action, configKey, operation, operatorNote, subject}: AccountLifecycleOperation,
): Promise<AccountLifecycleResult> => {
  if (typeof subject !== 'string' || subject.trim() === '') {
    throw new ThunderIDAPIError(
      'A resource identifier is required.',
      `${operation}-ValidationError-002`,
      'javascript',
      400,
      'The provided resource identifier is empty.',
    );
  }

  const result: Record<string, string> | null = await runAdministrationFlow(
    config,
    configKey,
    {
      [AdministrationFlowInput.SUBJECT]: subject,
      ...(operatorNote !== undefined ? {[AdministrationFlowInput.OPERATOR_NOTE]: operatorNote} : {}),
    },
    action,
  );

  if (result === null) {
    throw new AdministrationFlowError(
      `No ${action} flow is configured, so the action was not performed. ` +
        `Configure a flow for "${configKey}" in the server's flow configuration.`,
      `${operation}-NotConfiguredError-001`,
    );
  }

  const emailSent: string | undefined = result[AdministrationFlowData.EMAIL_SENT];

  return emailSent === undefined ? {} : {emailSent: emailSent === 'true'};
};

export default runAccountLifecycleFlow;
