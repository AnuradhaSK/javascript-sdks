// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Role, RoleQueryKeys, getRole, toManagementErrorMessage} from '@thunderid/browser';
import {FC, ReactElement} from 'react';
import BaseRolePermissions, {BaseRolePermissionsProps} from './BaseRolePermissions';
import useManagementEndpoint, {ManagementEndpoint} from '../../../hooks/management/useManagementEndpoint';
import useResourceQuery, {ResourceQueryResult} from '../../../hooks/management/useResourceQuery';
import useTranslation from '../../../hooks/useTranslation';

export type RolePermissionsProps = Omit<BaseRolePermissionsProps, 'error' | 'isLoading' | 'permissions'> & {
  roleId: string;
};

/**
 * Shows the permissions a role grants.
 *
 * @example
 * ```tsx
 * <RolePermissions roleId={roleId} />
 * ```
 */
const RolePermissions: FC<RolePermissionsProps> = ({
  preferences,
  roleId,
  ...rest
}: RolePermissionsProps): ReactElement => {
  const {t} = useTranslation(preferences?.i18n);
  const endpoint: ManagementEndpoint = useManagementEndpoint('roles');
  const role: ResourceQueryResult<Role> = useResourceQuery(
    [RoleQueryKeys.ROLE, roleId],
    (fetcher) => getRole({...endpoint, fetcher, roleId}),
    {enabled: Boolean(roleId)},
  );

  return (
    <BaseRolePermissions
      permissions={role.data?.permissions ?? []}
      isLoading={role.isLoading}
      error={toManagementErrorMessage(t, role.error, 'admin.roles.permissions.error')}
      preferences={preferences}
      {...rest}
    />
  );
};

export default RolePermissions;
