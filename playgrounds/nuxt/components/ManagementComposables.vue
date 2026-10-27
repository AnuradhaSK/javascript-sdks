<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getUserTypes, toManagementErrorMessage} from '@thunderid/browser';
import {
  getAgentGroups,
  getAgentRoles,
  getAgents,
  getAgentTypes,
  getGroupMembers,
  getGroups,
  getRoleAssignments,
  getRoles,
  getUserGroups,
  getUsers,
  useManagementEndpoint,
  useManagementRequestConfig,
  type ManagementEndpointKey,
  type ManagementRequestConfig,
} from '@thunderid/vue';
import {computed, type ComputedRef} from 'vue';
import {useGrantedPermissions, useRuntimeConfig, useThunderID, useThunderIDI18n} from '#imports';
import {describeManagementError, MANAGEMENT_COLLECTIONS, MANAGEMENT_ROUTE} from '~/lib/management';
import requireId from '~/lib/requireId';
import useApiQuery, {type ApiQuery, type ApiQueryOptions} from '~/lib/useApiQuery';

// Each card calls a management API function with the config from useManagementRequestConfig(), through
// the playground's own data layer (lib/useApiQuery.ts and lib/useApiMutation.ts). The config's fetcher is the http.fetcher the
// module installs (thunderid.management), which posts to /api/auth/management. Without a session each
// query ends in a 401 error. useGrantedPermissions is auto-imported by the module.
const {isSignedIn} = useThunderID();
const {t} = useThunderIDI18n();
const clientId: string | undefined = (useRuntimeConfig().public.thunderid as {clientId?: string}).clientId;

const groupsConfig: ManagementRequestConfig = useManagementRequestConfig('groups');
const rolesConfig: ManagementRequestConfig = useManagementRequestConfig('roles');
const usersConfig: ManagementRequestConfig = useManagementRequestConfig('users');
const agentsConfig: ManagementRequestConfig = useManagementRequestConfig('agents');
const userTypesConfig: ManagementRequestConfig = useManagementRequestConfig('userTypes');
const agentTypesConfig: ManagementRequestConfig = useManagementRequestConfig('agentTypes');

const permissions = useGrantedPermissions();
const groups = useApiQuery(() => getGroups({...groupsConfig, limit: 5}));
const roles = useApiQuery(() => getRoles({...rolesConfig, limit: 5}));
const users = useApiQuery(() => getUsers({...usersConfig, limit: 5}));
const agents = useApiQuery(() => getAgents({...agentsConfig, limit: 5}));
const agentTypes = useApiQuery(() => getAgentTypes({...agentTypesConfig, limit: 5}));
const userTypes = useApiQuery(() => getUserTypes({...userTypesConfig, limit: 5}));

// The sub-resource calls wait for an identifier, so they start once the first page has one.
const firstGroupId: ComputedRef<string | undefined> = computed(() => groups.data.value?.groups[0]?.id);
const firstRoleId: ComputedRef<string | undefined> = computed(() => roles.data.value?.roles[0]?.id);
const firstUserId: ComputedRef<string | undefined> = computed(() => users.data.value?.users[0]?.id);
const firstAgentId: ComputedRef<string | undefined> = computed(() => agents.data.value?.agents[0]?.id);

const follows = (id: ComputedRef<string | undefined>): ApiQueryOptions => ({
  enabled: () => !!id.value,
  key: () => id.value,
});

const groupMembers = useApiQuery(
  () => getGroupMembers({...groupsConfig, groupId: requireId(firstGroupId.value, 'group')}),
  follows(firstGroupId),
);
const roleAssignments = useApiQuery(
  () => getRoleAssignments({...rolesConfig, roleId: requireId(firstRoleId.value, 'role')}),
  follows(firstRoleId),
);
const userGroups = useApiQuery(
  () => getUserGroups({...usersConfig, userId: requireId(firstUserId.value, 'user')}),
  follows(firstUserId),
);
const agentGroups = useApiQuery(
  () => getAgentGroups({...agentsConfig, agentId: requireId(firstAgentId.value, 'agent')}),
  follows(firstAgentId),
);
const agentRoles = useApiQuery(
  () => getAgentRoles({...agentsConfig, agentId: requireId(firstAgentId.value, 'agent')}),
  follows(firstAgentId),
);

const endpoints: Record<string, unknown> = Object.fromEntries(
  MANAGEMENT_COLLECTIONS.map(({key}: {key: ManagementEndpointKey}) => [key, useManagementEndpoint(key)]),
);

/** Shows a query with its error explained, and the translated message the admin components would show. */
const view = (query: ApiQuery<unknown>, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  ...extra,
  data: query.data.value,
  error: query.error.value
    ? {
        reason: describeManagementError(query.error.value, clientId),
        shownByComponents: toManagementErrorMessage(t, query.error.value, 'admin.groups.list.error'),
      }
    : null,
  isLoading: query.isLoading.value,
  refetch: query.refetch,
});

const permissionsValue: ComputedRef<Record<string, unknown>> = computed(() => ({
  "can('system:group:view')": permissions.can('system:group:view'),
  "can('system:role:view')": permissions.can('system:role:view'),
  "can('system:user')": permissions.can('system:user'),
  isLoading: permissions.isLoading.value,
  permissions: permissions.permissions.value,
}));

const queries: ComputedRef<{name: string; signature: string; value: Record<string, unknown>}[]> = computed(() => [
  {name: 'getGroups({...config, limit: 5})', signature: 'Promise<GroupListResponse>', value: view(groups)},
  {
    name: 'getGroupMembers({...config, groupId})',
    signature: 'members of the first group; waits for an id',
    value: view(groupMembers, {groupId: firstGroupId.value ?? null}),
  },
  {name: 'getRoles({...config, limit: 5})', signature: 'Promise<RoleListResponse>', value: view(roles)},
  {
    name: 'getRoleAssignments({...config, roleId})',
    signature: 'assignments of the first role; waits for an id',
    value: view(roleAssignments, {roleId: firstRoleId.value ?? null}),
  },
  {
    name: 'getUserTypes({...config, limit: 5})',
    signature: "useManagementRequestConfig('userTypes'): endpoints.userTypes",
    value: view(userTypes),
  },
  {
    name: 'getUserGroups({...config, userId})',
    signature: 'groups of the first user (endpoints.users); waits for an id',
    value: view(userGroups, {userId: firstUserId.value ?? null}),
  },
  {
    name: 'getAgentTypes({...config, limit: 5})',
    signature: "useManagementRequestConfig('agentTypes'): endpoints.agentTypes",
    value: view(agentTypes),
  },
  {
    name: 'getAgentGroups({...config, agentId})',
    signature: 'groups of the first agent; waits for an id',
    value: view(agentGroups, {agentId: firstAgentId.value ?? null}),
  },
  {
    name: 'getAgentRoles({...config, agentId})',
    signature: 'roles of the first agent; waits for an id',
    value: view(agentRoles, {agentId: firstAgentId.value ?? null}),
  },
]);

const requestConfigs: Record<string, ManagementRequestConfig> = {
  agentTypes: agentTypesConfig,
  agents: agentsConfig,
  groups: groupsConfig,
  roles: rolesConfig,
  userTypes: userTypesConfig,
  users: usersConfig,
};
</script>

<template>
  <div class="pg-heading">
    <div>
      <h2>Management API functions</h2>
      <p>
        The SDK's management API functions called with the config from
        <code>useManagementRequestConfig(collection)</code>, through the playground's own small data layer (<code
          >lib/useApiQuery.ts</code
        >
        and <code>lib/useApiMutation.ts</code>). The config's fetcher is the <code>http.fetcher</code> that
        <code>thunderid.management</code> installs, which posts to <code>{{ MANAGEMENT_ROUTE }}</code
        >; the server adds the session's access token.
        {{ isSignedIn ? '' : 'Not signed in: every query ends in an HTTP 401 error from that route.' }}
      </p>
    </div>
  </div>
  <div class="pg-grid-2">
    <ComposableCard
      name="useGrantedPermissions()"
      signature="{permissions, isLoading, can(required)}: read from the access token, not verified"
      :value="permissionsValue"
    >
      <p v-if="!isSignedIn" class="pg-empty">No session: permissions stay [] and can() is false.</p>
    </ComposableCard>
    <ComposableCard
      name="useManagementEndpoint(key)"
      signature="{baseUrl, url}: url is the endpoints override, else undefined for {baseUrl}/{collection}"
      :value="endpoints"
    />
    <ComposableCard
      v-for="query in queries"
      :key="query.name"
      :name="query.name"
      :signature="query.signature"
      :value="query.value"
    >
      <template #actions>
        <button type="button" class="pg-btn" data-size="sm" @click="(query.value.refetch as () => Promise<unknown>)()">
          refetch()
        </button>
      </template>
    </ComposableCard>
    <ComposableCard
      name="useManagementRequestConfig(collection)"
      signature="{baseUrl, url, fetcher}: spread it into an API function; createGroup() and the other writes take it too"
      :value="requestConfigs"
    />
  </div>
</template>
