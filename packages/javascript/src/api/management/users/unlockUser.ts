// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AdministrationFlowConfigKey} from '../../../constants/AdministrationConstants';
import {AccountLifecycleOptions, AccountLifecycleResult} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import runAccountLifecycleFlow from '../administration/runAccountLifecycleFlow';

/**
 * Configuration for the unlockUser request.
 */
export interface UnlockUserConfig extends ManagementRequestConfig, AccountLifecycleOptions {
  /**
   * Identifier of the user.
   */
  userId: string;
}

/**
 * Unlocks a user locked out after repeated failed sign-in attempts, through the user unlock flow the server
 * configures. There is no management API endpoint for this, so when no flow is configured the call fails
 * with `unlockUser-NotConfiguredError-001`.
 *
 * @param config - Request configuration object. Running a flow needs `baseUrl`, and a token that may read
 * the server configuration and run administration flows.
 * @returns A promise that resolves with whether the flow's email step sent its notification, absent when
 * the flow has no email step.
 *
 * @example
 * ```typescript
 * const {emailSent} = await unlockUser({baseUrl: 'https://localhost:8090', userId, operatorNote: 'Ticket 4521'});
 * ```
 */
const unlockUser = async ({userId, operatorNote, ...config}: UnlockUserConfig): Promise<AccountLifecycleResult> =>
  runAccountLifecycleFlow(config, {
    action: 'user unlock',
    configKey: AdministrationFlowConfigKey.USER_UNLOCK,
    operation: 'unlockUser',
    operatorNote,
    subject: userId,
  });

export default unlockUser;
