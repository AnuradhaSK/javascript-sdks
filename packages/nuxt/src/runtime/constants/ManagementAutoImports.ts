// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * The admin (management) components of `@thunderid/vue` that the module auto-imports when
 * `management` is on. The containers fetch through the management API functions, so they need no Nuxt
 * wrapper: the module installs the `http.fetcher` they use. The `Base*` variants take their data as
 * props.
 */
export const MANAGEMENT_COMPONENTS: readonly string[] = [
  'UserList',
  'UserCreate',
  'UserDetails',
  'GroupList',
  'GroupCreate',
  'GroupMembers',
  'RoleList',
  'RoleCreate',
  'RoleAssignments',
  'RolePermissions',
  'AgentList',
  'AgentCreate',
  'AgentDetails',
  'ApplicationList',
  'ApplicationCreate',
  'ApplicationDetails',
  'BaseUserList',
  'BaseUserCreate',
  'BaseUserDetails',
  'BaseGroupList',
  'BaseGroupCreate',
  'BaseGroupMembers',
  'BaseRoleList',
  'BaseRoleCreate',
  'BaseRoleAssignments',
  'BaseRolePermissions',
  'BaseAgentList',
  'BaseAgentCreate',
  'BaseAgentDetails',
  'BaseApplicationList',
  'BaseApplicationCreate',
  'BaseApplicationDetails',
];

/**
 * The management composables of `@thunderid/vue` that the module auto-imports when `management` is
 * on. `useManagementRequestConfig` hands the management API functions the module's `http.fetcher`,
 * so an app calls them through the server.
 */
export const MANAGEMENT_COMPOSABLES: readonly string[] = ['useGrantedPermissions', 'useManagementRequestConfig'];
