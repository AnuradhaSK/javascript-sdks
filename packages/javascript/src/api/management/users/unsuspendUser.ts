// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AdministrationFlowConfigKey} from '../../../constants/AdministrationConstants';
import {AccountLifecycleOptions, AccountLifecycleResult} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import runAccountLifecycleFlow from '../administration/runAccountLifecycleFlow';

/**
 * Configuration for the unsuspendUser request.
 */
export interface UnsuspendUserConfig extends ManagementRequestConfig, AccountLifecycleOptions {
  /**
   * Identifier of the user.
   */
  userId: string;
}

/**
 * Lifts the suspension of a user through the user unsuspension flow the server configures. There is no
 * management API endpoint for this, so when no flow is configured the call fails with
 * `unsuspendUser-NotConfiguredError-001`.
 *
 * @param config - Request configuration object. Running a flow needs `baseUrl`, and a token that may read
 * the server configuration and run administration flows.
 * @returns A promise that resolves with whether the flow's email step sent its notification, absent when
 * the flow has no email step.
 *
 * @example
 * ```typescript
 * const {emailSent} = await unsuspendUser({baseUrl: 'https://localhost:8090', userId, operatorNote: 'Ticket 4521'});
 * ```
 */
const unsuspendUser = async ({userId, operatorNote, ...config}: UnsuspendUserConfig): Promise<AccountLifecycleResult> =>
  runAccountLifecycleFlow(config, {
    action: 'user unsuspension',
    configKey: AdministrationFlowConfigKey.USER_UNSUSPEND,
    operation: 'unsuspendUser',
    operatorNote,
    subject: userId,
  });

export default unsuspendUser;
