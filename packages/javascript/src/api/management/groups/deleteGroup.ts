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

/**
 * Configuration for the deleteGroup request.
 */
export interface DeleteGroupConfig extends ManagementRequestConfig, AdministrationOptions {
  /**
   * Identifier of the group to delete.
   */
  groupId: string;
}

/**
 * Deletes a group. In `flow` mode the configured group deletion flow runs instead, revoking what the
 * group's members held through it before the group goes.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has applied the change.
 *
 * @example
 * ```typescript
 * await deleteGroup({baseUrl: 'https://localhost:8090', groupId});
 * ```
 */
const deleteGroup = async ({administrationMode, groupId, ...config}: DeleteGroupConfig): Promise<void> => {
  if (administrationMode === AdministrationModes.FLOW) {
    const result: Record<string, string> | null = await runAdministrationFlow(
      config,
      AdministrationFlowConfigKey.GROUP_DELETION,
      {[AdministrationFlowInput.GROUP]: groupId},
      'group deletion',
    );

    if (result !== null) {
      return;
    }
  }

  await requestManagementResource<void>(config, {
    collection: 'groups',
    failureMessage: 'Failed to delete group',
    id: groupId,
    method: 'DELETE',
    operation: 'deleteGroup',
  });
};

export default deleteGroup;
