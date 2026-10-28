// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AdministrationFlowConfigKey} from '../../../constants/AdministrationConstants';
import {AccountLifecycleOptions, AccountLifecycleResult} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import runAccountLifecycleFlow from '../administration/runAccountLifecycleFlow';

/**
 * Configuration for the suspendUser request.
 */
export interface SuspendUserConfig extends ManagementRequestConfig, AccountLifecycleOptions {
  /**
   * Identifier of the user.
   */
  userId: string;
}

/**
 * Suspends a user, so they can no longer sign in, through the user suspension flow the server configures.
 * The flow can end the user's sessions and notify them. There is no management API endpoint for this, so
 * when no flow is configured the call fails with `suspendUser-NotConfiguredError-001`.
 *
 * @param config - Request configuration object. Running a flow needs `baseUrl`, and a token that may read
 * the server configuration and run administration flows.
 * @returns A promise that resolves with whether the flow's email step sent its notification, absent when
 * the flow has no email step.
 *
 * @example
 * ```typescript
 * const {emailSent} = await suspendUser({baseUrl: 'https://localhost:8090', userId, operatorNote: 'Ticket 4521'});
 * ```
 */
const suspendUser = async ({userId, operatorNote, ...config}: SuspendUserConfig): Promise<AccountLifecycleResult> =>
  runAccountLifecycleFlow(config, {
    action: 'user suspension',
    configKey: AdministrationFlowConfigKey.USER_SUSPEND,
    operation: 'suspendUser',
    operatorNote,
    subject: userId,
  });

export default suspendUser;
