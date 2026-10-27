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
 * Configuration for the deleteRole request.
 */
export interface DeleteRoleConfig extends ManagementRequestConfig, AdministrationOptions {
  /**
   * Identifier of the role to delete.
   */
  roleId: string;
}

/**
 * Deletes a role. In `flow` mode the configured role deletion flow runs instead, revoking the scopes
 * the role granted before it goes.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has applied the change.
 *
 * @example
 * ```typescript
 * await deleteRole({baseUrl: 'https://localhost:8090', roleId});
 * ```
 */
const deleteRole = async ({administrationMode, roleId, ...config}: DeleteRoleConfig): Promise<void> => {
  if (administrationMode === AdministrationModes.FLOW) {
    const result: Record<string, string> | null = await runAdministrationFlow(
      config,
      AdministrationFlowConfigKey.ROLE_DELETION,
      {[AdministrationFlowInput.ROLE]: roleId},
      'role deletion',
    );

    if (result !== null) {
      return;
    }
  }

  await requestManagementResource<void>(config, {
    collection: 'roles',
    failureMessage: 'Failed to delete role',
    id: roleId,
    method: 'DELETE',
    operation: 'deleteRole',
  });
};

export default deleteRole;
