// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

// The admin (management) surface of `@thunderid/react` that needs no Next.js-specific wiring: the
// unstyled `Base*` admin components, which take their data as props, and `useManagementRequestConfig`,
// whose config lets an app call the management API functions through the `http.fetcher` that
// `ThunderIDProvider` installs (a server action holding the access token). The styled admin components
// have their own wrappers under `components/admin`, and `useGrantedPermissions` has a Next.js
// implementation.

export {
  type AdminListRenderProps,
  BaseUserList,
  type BaseUserListProps,
  type BaseUserListRenderProps,
  BaseUserCreate,
  type BaseUserCreateProps,
  type BaseUserCreateRenderProps,
  BaseUserDetails,
  type BaseUserDetailsProps,
  type BaseUserDetailsRenderProps,
  BaseGroupList,
  type BaseGroupListProps,
  type BaseGroupListRenderProps,
  BaseGroupCreate,
  type BaseGroupCreateProps,
  type BaseGroupCreateRenderProps,
  BaseGroupMembers,
  type BaseGroupMembersProps,
  type BaseGroupMembersRenderProps,
  BaseRoleList,
  type BaseRoleListProps,
  type BaseRoleListRenderProps,
  BaseRoleCreate,
  type BaseRoleCreateProps,
  type BaseRoleCreateRenderProps,
  BaseRoleAssignments,
  type BaseRoleAssignmentsProps,
  type BaseRoleAssignmentsRenderProps,
  BaseRolePermissions,
  type BaseRolePermissionsProps,
  type BaseRolePermissionsRenderProps,
  BaseAgentList,
  type BaseAgentListProps,
  type BaseAgentListRenderProps,
  BaseAgentCreate,
  type BaseAgentCreateProps,
  type BaseAgentCreateRenderProps,
  BaseAgentDetails,
  type BaseAgentDetailsProps,
  type BaseAgentDetailsRenderProps,
  BaseApplicationList,
  type BaseApplicationListProps,
  type BaseApplicationListRenderProps,
  BaseApplicationCreate,
  type BaseApplicationCreateProps,
  type BaseApplicationCreateRenderProps,
  type ApplicationCreateSubmission,
  BaseApplicationDetails,
  type BaseApplicationDetailsProps,
  type BaseApplicationDetailsRenderProps,
  type ApplicationUpdateSubmission,
  type ApplicationFormValues,
  type ApplicationTextField,
} from '@thunderid/react';

export {useManagementRequestConfig, type ManagementCollection, type GrantedPermissions} from '@thunderid/react';
