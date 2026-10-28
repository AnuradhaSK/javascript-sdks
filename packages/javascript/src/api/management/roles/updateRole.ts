// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import getRole from './getRole';
import AdministrationModes, {
  AdministrationFlowConfigKey,
  AdministrationFlowInput,
} from '../../../constants/AdministrationConstants';
import {AdministrationOptions} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import {Role, RoleResourcePermissions, UpdateRoleRequest} from '../../../models/role';
import requestManagementResource from '../../../utils/requestManagementResource';
import executeAdministrationFlow from '../administration/executeAdministrationFlow';
import resolveAdministrationFlowId from '../administration/resolveAdministrationFlowId';

export interface UpdateRoleConfig extends ManagementRequestConfig, AdministrationOptions {
  /**
   * The role as it is now. In `flow` mode it tells whether the update removes a permission; when left
   * out, the role is read first.
   */
  current?: Role;
  /**
   * The role's new state.
   */
  payload: UpdateRoleRequest;
  /**
   * Identifier of the role to update.
   */
  roleId: string;
}

/**
 * Whether the new permissions drop any of the current ones. Only a removal has anything to revoke.
 */
const removesPermission = (
  current: RoleResourcePermissions[] | undefined,
  next: RoleResourcePermissions[] | undefined,
): boolean => {
  const retained: Set<string> = new Set<string>();

  (next ?? []).forEach((resource: RoleResourcePermissions) => {
    (resource.permissions ?? []).forEach((permission: string) => {
      retained.add(`${resource.resourceServerId}\u0000${permission}`);
    });
  });

  return (current ?? []).some((resource: RoleResourcePermissions) =>
    (resource.permissions ?? []).some(
      (permission: string) => !retained.has(`${resource.resourceServerId}\u0000${permission}`),
    ),
  );
};

const putRole = (config: ManagementRequestConfig, roleId: string, payload: UpdateRoleRequest): Promise<Role> =>
  requestManagementResource<Role>(config, {
    body: payload,
    collection: 'roles',
    failureMessage: 'Failed to update role',
    id: roleId,
    method: 'PUT',
    operation: 'updateRole',
  });

/**
 * Updates a role. In `flow` mode an update that removes a permission runs the configured permission
 * removal flow, which revokes the scopes the permissions granted; the role's other fields are written
 * first, so a rejected rename fails before anything is revoked.
 */
const updateRole = async ({
  administrationMode,
  current,
  payload,
  roleId,
  ...config
}: UpdateRoleConfig): Promise<Role> => {
  if (administrationMode !== AdministrationModes.FLOW) {
    return putRole(config, roleId, payload);
  }

  const before: Role = current ?? (await getRole({...config, roleId}));

  if (!removesPermission(before.permissions, payload.permissions)) {
    return putRole(config, roleId, payload);
  }

  const flowId: string | null = await resolveAdministrationFlowId(
    config,
    AdministrationFlowConfigKey.ROLE_PERMISSION_REMOVAL,
    'role permission change',
  );

  if (flowId === null) {
    return putRole(config, roleId, payload);
  }

  // The flow writes only the permissions, so the other fields go first.
  const otherFieldsChanged: boolean =
    payload.name !== before.name ||
    (payload.description ?? '') !== (before.description ?? '') ||
    payload.ouId !== before.ouId;
  const updated: Role = otherFieldsChanged
    ? await putRole(config, roleId, {...payload, permissions: before.permissions ?? []})
    : before;

  await executeAdministrationFlow(
    config,
    flowId,
    {
      [AdministrationFlowInput.PERMISSIONS]: JSON.stringify(payload.permissions ?? []),
      [AdministrationFlowInput.ROLE]: roleId,
    },
    'role permission change',
  );

  return {...updated, permissions: payload.permissions ?? []};
};

export default updateRole;
