// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AdministrationFlowConfigKey} from '../../../constants/AdministrationConstants';
import {AccountLifecycleOptions, AccountLifecycleResult} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import runAccountLifecycleFlow from '../administration/runAccountLifecycleFlow';

/**
 * Configuration for the suspendApplication request.
 */
export interface SuspendApplicationConfig extends ManagementRequestConfig, AccountLifecycleOptions {
  /**
   * Identifier of the application.
   */
  applicationId: string;
}

/**
 * Suspends an application, so it can no longer be used to sign in or obtain tokens, through the application
 * suspension flow the server configures. There is no management API endpoint for this, so when no flow is
 * configured the call fails with `suspendApplication-NotConfiguredError-001`.
 *
 * @param config - Request configuration object. Running a flow needs `baseUrl`, and a token that may read
 * the server configuration and run administration flows.
 * @returns A promise that resolves with whether the flow's email step sent its notification, absent when
 * the flow has no email step.
 *
 * @example
 * ```typescript
 * const {emailSent} = await suspendApplication({baseUrl: 'https://localhost:8090', applicationId, operatorNote: 'Ticket 4521'});
 * ```
 */
const suspendApplication = async ({
  applicationId,
  operatorNote,
  ...config
}: SuspendApplicationConfig): Promise<AccountLifecycleResult> =>
  runAccountLifecycleFlow(config, {
    action: 'application suspension',
    configKey: AdministrationFlowConfigKey.APPLICATION_SUSPEND,
    operation: 'suspendApplication',
    operatorNote,
    subject: applicationId,
  });

export default suspendApplication;
