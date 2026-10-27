// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import AdministrationModes, {
  AdministrationFlowConfigKey,
  AdministrationFlowInput,
} from '../../../constants/AdministrationConstants';
import {AdministrationOptions} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import {RoleAssignmentInput} from '../../../models/role';
import requestManagementResource from '../../../utils/requestManagementResource';
import executeAdministrationFlow from '../administration/executeAdministrationFlow';
import resolveAdministrationFlowId from '../administration/resolveAdministrationFlowId';

export interface RemoveRoleAssignmentsConfig extends ManagementRequestConfig, AdministrationOptions {
  /**
   * The identities to remove the role from.
   */
  assignments: RoleAssignmentInput[];
  /**
   * Identifier of the role to unassign.
   */
  roleId: string;
}

/**
 * Removes a role from identities. In `flow` mode the configured assignment removal flow runs once for
 * each assignee instead, revoking the scopes the assignment conveyed.
 */
const removeRoleAssignments = async ({
  administrationMode,
  assignments,
  roleId,
  ...config
}: RemoveRoleAssignmentsConfig): Promise<void> => {
  if (administrationMode === AdministrationModes.FLOW) {
    const flowId: string | null = await resolveAdministrationFlowId(
      config,
      AdministrationFlowConfigKey.ROLE_ASSIGNMENT_REMOVAL,
      'role assignment removal',
    );

    if (flowId) {
      for (const assignment of assignments) {
        await executeAdministrationFlow(
          config,
          flowId,
          {[AdministrationFlowInput.ASSIGNEE]: assignment.id, [AdministrationFlowInput.ROLE]: roleId},
          'role assignment removal',
        );
      }

      return;
    }
  }

  await requestManagementResource<void>(config, {
    body: {assignments},
    collection: 'roles',
    failureMessage: 'Failed to remove role assignments',
    id: roleId,
    method: 'POST',
    operation: 'removeRoleAssignments',
    subPath: 'assignments/remove',
  });
};

export default removeRoleAssignments;
