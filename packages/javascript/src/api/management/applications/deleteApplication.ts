// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import AdministrationModes, {
  AdministrationFlowConfigKey,
  AdministrationFlowInput,
} from '../../../constants/AdministrationConstants';
import {AdministrationOptions} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import requestManagementResource from '../../../utils/requestManagementResource';
import runAdministrationFlow from '../administration/runAdministrationFlow';

export interface DeleteApplicationConfig extends ManagementRequestConfig, AdministrationOptions {
  /**
   * Identifier of the application to delete.
   */
  applicationId: string;
}

/**
 * Deletes an application. In `flow` mode the configured application deletion flow runs instead,
 * revoking what the application was granted before the record goes.
 */
const deleteApplication = async ({
  administrationMode,
  applicationId,
  ...config
}: DeleteApplicationConfig): Promise<void> => {
  if (administrationMode === AdministrationModes.FLOW) {
    const result: Record<string, string> | null = await runAdministrationFlow(
      config,
      AdministrationFlowConfigKey.APPLICATION_DELETION,
      {[AdministrationFlowInput.APPLICATION]: applicationId},
      'application deletion',
    );

    if (result !== null) {
      return;
    }
  }

  await requestManagementResource<void>(config, {
    collection: 'applications',
    failureMessage: 'Failed to delete application',
    id: applicationId,
    method: 'DELETE',
    operation: 'deleteApplication',
  });
};

export default deleteApplication;
