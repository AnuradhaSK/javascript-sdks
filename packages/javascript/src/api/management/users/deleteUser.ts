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

export interface DeleteUserConfig extends ManagementRequestConfig, AdministrationOptions {
  /**
   * Identifier of the user to delete.
   */
  userId: string;
}

/**
 * Deletes a user. In `flow` mode the configured user deletion flow runs instead, revoking the user's
 * grants and ending their sessions before the record goes.
 */
const deleteUser = async ({administrationMode, userId, ...config}: DeleteUserConfig): Promise<void> => {
  if (administrationMode === AdministrationModes.FLOW) {
    const result: Record<string, string> | null = await runAdministrationFlow(
      config,
      AdministrationFlowConfigKey.USER_DELETION,
      {[AdministrationFlowInput.SUBJECT]: userId},
      'user deletion',
    );

    if (result !== null) {
      return;
    }
  }

  await requestManagementResource<void>(config, {
    collection: 'users',
    failureMessage: 'Failed to delete user',
    id: userId,
    method: 'DELETE',
    operation: 'deleteUser',
  });
};

export default deleteUser;
