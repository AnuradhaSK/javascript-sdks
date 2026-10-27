<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getUserTypes, type EmbeddedFlowComponent, type FetchSelectPage, type SelectPage} from '@thunderid/browser';
import {
  createAgent,
  createApplication,
  createGroup,
  createRole,
  createUser,
  deleteAgent,
  deleteApplication,
  deleteGroup,
  deleteRole,
  deleteUser,
  getAgent,
  getAgentGroups,
  getAgentRoles,
  getAgents,
  getAgentTypes,
  getApplication,
  getApplications,
  getGroup,
  getGroupMembers,
  getGroups,
  getRole,
  getRoleAssignments,
  getRoles,
  getUser,
  getUserGroups,
  getUsers,
  addGroupMembers,
  addRoleAssignments,
  GroupListResponse,
  ManagementEndpoint,
  ManagementEndpointKey,
  ManagementRequestConfig,
  removeGroupMembers,
  removeRoleAssignments,
  updateAgent,
  updateApplication,
  updateGroup,
  updateRole,
  updateUser,
  useFetchAuthFlows,
  useFetchUsers,
  useFetchUserTypes,
  useFlow,
  useFlowMeta,
  useGrantedPermissions,
  useI18n,
  useManagementEndpoint,
  useManagementRequestConfig,
  useTheme,
  useThunderID,
  useUser,
} from '@thunderid/vue';
import {computed, ComputedRef, Ref, ref, shallowRef, ShallowRef} from 'vue';
import ComposableCard from '../components/ComposableCard.vue';
import EventLog from '../components/EventLog.vue';
import {describeError, track} from '../lib/events';
import requireId from '../lib/requireId';
import {asText, toUser} from '../lib/sdk';
import useApiMutation, {type ApiMutation} from '../lib/useApiMutation';
import useApiQuery, {type ApiQuery, type ApiQueryOptions} from '../lib/useApiQuery';

interface FetcherState {
  data: SelectPage | null;
  error: string | null;
  isLoading: boolean;
}

const sdk = useThunderID();
const user = useUser();
const i18n = useI18n();
const theme = useTheme();
const flow = useFlow();
const flowMeta = useFlowMeta();
const {isSignedIn} = sdk;
const error: Ref<string | null> = ref<string | null>(null);

const FETCHERS: [string, FetchSelectPage][] = [
  ['useFetchUsers()', useFetchUsers()],
  ['useFetchUserTypes()', useFetchUserTypes()],
  ['useFetchAuthFlows()', useFetchAuthFlows()],
];

const fetched: ShallowRef<Record<string, FetcherState>> = shallowRef<Record<string, FetcherState>>({});

const call = (label: string, run: () => Promise<unknown>): void => {
  error.value = null;
  track(label, run).catch((caught: unknown) => {
    error.value = describeError(caught);
  });
};

const runFetcher = async (name: string, fetcher: FetchSelectPage): Promise<void> => {
  const set = (state: FetcherState): void => {
    fetched.value = {...fetched.value, [name]: state};
  };

  set({data: null, error: null, isLoading: true});

  try {
    const page: SelectPage = await track(
      name,
      () =>
        fetcher({
          // The fetchers only read paging fields; the flow component is passed through by selects.
          component: {} as EmbeddedFlowComponent,
          limit: 5,
          offset: 0,
          signal: new AbortController().signal,
        }),
      (result: SelectPage) => `${(result.options ?? result.items ?? []).length} results`,
    );

    set({data: page, error: null, isLoading: false});
  } catch (caught) {
    set({data: null, error: describeError(caught), isLoading: false});
  }
};

const languages: ComputedRef<string[]> = computed(() => Object.keys(i18n.bundles.value));

const i18nValue: ComputedRef<Record<string, unknown>> = computed(() => ({
  ...i18n,
  bundles: languages.value,
  samples: {
    "t('elements.buttons.signin.text')": i18n.t('elements.buttons.signin.text'),
    "t('elements.buttons.signout.text')": i18n.t('elements.buttons.signout.text'),
    "t('elements.buttons.signup.text')": i18n.t('elements.buttons.signup.text'),
  },
}));

// ── Management API functions ──
// Each query calls an SDK management API function with the config from useManagementRequestConfig(),
// through the playground's own data layer (lib/useApiQuery.ts and lib/useApiMutation.ts). Queries wait for a session
// (`enabled`), so a signed-out page makes no requests. Refetch runs one anyway, which shows the error a
// signed-out or unauthorized call gets.

interface QueryEntry {
  name: string;
  query: ApiQuery<unknown>;
  signature: string;
}

/**
 * The collections this page exercises.
 */
type PlaygroundCollection = Extract<
  ManagementEndpointKey,
  'agentTypes' | 'agents' | 'applications' | 'groups' | 'roles' | 'userTypes' | 'users'
>;

const config: Record<PlaygroundCollection, ManagementRequestConfig> = {
  agentTypes: useManagementRequestConfig('agentTypes'),
  agents: useManagementRequestConfig('agents'),
  applications: useManagementRequestConfig('applications'),
  groups: useManagementRequestConfig('groups'),
  roles: useManagementRequestConfig('roles'),
  userTypes: useManagementRequestConfig('userTypes'),
  users: useManagementRequestConfig('users'),
};

const signedIn: ApiQueryOptions = {enabled: () => isSignedIn.value};
const page = {limit: 5};

const groups = useApiQuery(() => getGroups({...config.groups, ...page}), signedIn);
const roles = useApiQuery(() => getRoles({...config.roles, ...page}), signedIn);
const agents = useApiQuery(() => getAgents({...config.agents, ...page}), signedIn);
const users = useApiQuery(() => getUsers({...config.users, ...page}), signedIn);
const applications = useApiQuery(() => getApplications({...config.applications, ...page}), signedIn);

// The single-resource and membership calls follow the first row of each list.
const firstGroupId = (): string | undefined => groups.data.value?.groups[0]?.id;
const firstRoleId = (): string | undefined => roles.data.value?.roles[0]?.id;
const firstAgentId = (): string | undefined => agents.data.value?.agents[0]?.id;
const firstUserId = (): string | undefined => users.data.value?.users[0]?.id;
const firstApplicationId = (): string | undefined => applications.data.value?.applications[0]?.id;
// ThunderID issues the user's ID as the `sub` claim.
const signedInUserId = (): string | undefined => asText(toUser(sdk.user.value)?.['sub']) || undefined;

/** Waits for a session and for the ID, and runs again when the ID changes. */
const follows = (id: () => string | undefined): ApiQueryOptions => ({
  enabled: () => isSignedIn.value && !!id(),
  key: id,
});

// A derived value on the same data layer: the group count, read from a one-row page.
const groupCount = useApiQuery(
  () => getGroups({...config.groups, limit: 1}).then((result: GroupListResponse) => result.totalResults),
  signedIn,
);

const QUERIES: QueryEntry[] = [
  {
    name: 'getUsers()',
    query: users,
    signature: "({...useManagementRequestConfig('users'), limit, offset, filter}) => Promise<ManagedUserListResponse>",
  },
  {
    name: 'getUser(firstUserId)',
    query: useApiQuery(
      () => getUser({...config.users, userId: requireId(firstUserId(), 'user')}),
      follows(firstUserId),
    ),
    signature: '({...config, userId}) => Promise<ManagedUser>',
  },
  {
    name: 'getUserGroups(signedInUserId)',
    query: useApiQuery(
      () => getUserGroups({...config.users, ...page, userId: requireId(signedInUserId(), 'signed-in user')}),
      follows(signedInUserId),
    ),
    signature: '({...config, userId, limit, offset}) => Promise<MembershipGroupListResponse>',
  },
  {
    name: 'getUserTypes()',
    query: useApiQuery(() => getUserTypes({...config.userTypes, ...page}), signedIn),
    signature: "({...useManagementRequestConfig('userTypes'), limit, offset}) => Promise<page>",
  },
  {
    name: 'getGroups()',
    query: groups,
    signature: "({...useManagementRequestConfig('groups'), limit, offset}) => Promise<GroupListResponse>",
  },
  {
    name: 'getGroup(firstGroupId)',
    query: useApiQuery(
      () => getGroup({...config.groups, groupId: requireId(firstGroupId(), 'group')}),
      follows(firstGroupId),
    ),
    signature: '({...config, groupId}) => Promise<Group>',
  },
  {
    name: 'getGroupMembers(firstGroupId)',
    query: useApiQuery(
      () => getGroupMembers({...config.groups, ...page, groupId: requireId(firstGroupId(), 'group')}),
      follows(firstGroupId),
    ),
    signature: '({...config, groupId, limit, offset}) => Promise<GroupMemberListResponse>',
  },
  {
    name: 'getRoles()',
    query: roles,
    signature: "({...useManagementRequestConfig('roles'), limit, offset}) => Promise<RoleListResponse>",
  },
  {
    name: 'getRole(firstRoleId)',
    query: useApiQuery(
      () => getRole({...config.roles, roleId: requireId(firstRoleId(), 'role')}),
      follows(firstRoleId),
    ),
    signature: '({...config, roleId}) => Promise<Role>',
  },
  {
    name: 'getRoleAssignments(firstRoleId)',
    query: useApiQuery(
      () => getRoleAssignments({...config.roles, ...page, roleId: requireId(firstRoleId(), 'role')}),
      follows(firstRoleId),
    ),
    signature: '({...config, roleId, limit, offset, type}) => Promise<RoleAssignmentListResponse>',
  },
  {
    name: 'getAgents()',
    query: agents,
    signature: "({...useManagementRequestConfig('agents'), limit, offset}) => Promise<AgentListResponse>",
  },
  {
    name: 'getAgent(firstAgentId)',
    query: useApiQuery(
      () => getAgent({...config.agents, agentId: requireId(firstAgentId(), 'agent')}),
      follows(firstAgentId),
    ),
    signature: '({...config, agentId}) => Promise<Agent>',
  },
  {
    name: 'getAgentGroups(firstAgentId)',
    query: useApiQuery(
      () => getAgentGroups({...config.agents, ...page, agentId: requireId(firstAgentId(), 'agent')}),
      follows(firstAgentId),
    ),
    signature: '({...config, agentId, limit, offset}) => Promise<MembershipGroupListResponse>',
  },
  {
    name: 'getAgentRoles(firstAgentId)',
    query: useApiQuery(
      () => getAgentRoles({...config.agents, ...page, agentId: requireId(firstAgentId(), 'agent')}),
      follows(firstAgentId),
    ),
    signature: '({...config, agentId, limit, offset}) => Promise<AgentRoleListResponse>',
  },
  {
    name: 'getAgentTypes()',
    query: useApiQuery(() => getAgentTypes({...config.agentTypes, ...page}), signedIn),
    signature: "({...useManagementRequestConfig('agentTypes'), limit, offset}) => Promise<AgentTypeListResponse>",
  },
  {
    name: 'getApplications()',
    query: applications,
    signature: "({...useManagementRequestConfig('applications'), limit, offset}) => Promise<page>",
  },
  {
    name: 'getApplication(firstApplicationId)',
    query: useApiQuery(
      () => getApplication({...config.applications, applicationId: requireId(firstApplicationId(), 'application')}),
      follows(firstApplicationId),
    ),
    signature: '({...config, applicationId}) => Promise<Application>',
  },
  {
    name: 'getGroups({limit: 1}).totalResults',
    query: groupCount,
    signature: 'A derived value: the group count, read from a one-row page',
  },
];

const queryValue = (query: ApiQuery<unknown>): Record<string, unknown> => ({
  data: query.data.value,
  error: query.error.value?.message ?? null,
  isLoading: query.isLoading.value,
  refetch: query.refetch,
});

const refetch = (name: string, query: ApiQuery<unknown>): void =>
  call(name, async () => {
    await query.refetch();
    // refetch() resolves undefined on failure instead of rejecting; surface the error.
    if (query.error.value) throw query.error.value;
  });

// The write functions, by the collection whose config they take. They write data, so the page lists
// them without running them; the admin components in the explorer drive them.
type WriteFunction = (...args: never[]) => Promise<unknown>;

const MUTATIONS: [PlaygroundCollection, Record<string, WriteFunction>][] = [
  ['users', {createUser, deleteUser, updateUser}],
  ['groups', {addGroupMembers, createGroup, deleteGroup, removeGroupMembers, updateGroup}],
  ['roles', {addRoleAssignments, createRole, deleteRole, removeRoleAssignments, updateRole}],
  ['agents', {createAgent, deleteAgent, updateAgent}],
  ['applications', {createApplication, deleteApplication, updateApplication}],
];

// A mutation on the same data layer. It writes nothing: it resolves locally and then refetches the
// group queries, which is how an app keeps its own lists fresh after a write.
const touchGroups: ApiMutation<string, string> = useApiMutation((label: string) => Promise.resolve(label), {
  onSuccess: () =>
    Promise.all(
      QUERIES.filter((entry: QueryEntry) => entry.name.includes('Group')).map((entry: QueryEntry) =>
        entry.query.refetch(),
      ),
    ),
});

const mutationsValue: ComputedRef<Record<string, unknown>> = computed(() => ({
  ...Object.fromEntries(
    MUTATIONS.flatMap(([key, writes]: [PlaygroundCollection, Record<string, WriteFunction>]) =>
      Object.keys(writes).map((name: string) => [`${name}()`, `({...useManagementRequestConfig('${key}'), ...})`]),
    ),
  ),
  refetchGroups: touchGroups.error.value
    ? `error: ${touchGroups.error.value.message}`
    : touchGroups.isLoading.value
      ? 'running'
      : 'idle',
}));

const ENDPOINT_KEYS: PlaygroundCollection[] = [
  'applications',
  'users',
  'userTypes',
  'groups',
  'roles',
  'agents',
  'agentTypes',
];

const endpointsValue: Record<string, ManagementEndpoint> = Object.fromEntries(
  ENDPOINT_KEYS.map((key: PlaygroundCollection) => [key, useManagementEndpoint(key)]),
);

const requestConfigValue: Record<string, ManagementRequestConfig> = Object.fromEntries(
  ENDPOINT_KEYS.map((key: PlaygroundCollection) => [key, config[key]]),
);

const granted = useGrantedPermissions();
const probes: string[] = ['system', 'system:user:view', 'system:group:view', 'system:role:view', 'system:agent:view'];

const grantedValue: ComputedRef<Record<string, unknown>> = computed(() => ({
  can: Object.fromEntries(probes.map((probe: string) => [`can('${probe}')`, granted.can(probe)])),
  isLoading: granted.isLoading.value,
  permissions: granted.permissions.value,
}));

const themeValue: ComputedRef<Record<string, unknown>> = computed(() => {
  const variables: Record<string, string> = theme.theme.value.cssVariables ?? {};

  return {
    colorScheme: theme.colorScheme.value,
    cssVariables: `${Object.keys(variables).length} variables`,
    direction: theme.direction.value,
    sample: Object.fromEntries(Object.entries(variables).slice(0, 8)),
    toggleTheme: theme.toggleTheme,
  };
});
</script>

<template>
  <main class="pg-main">
    <div class="pg-heading">
      <div>
        <h1>Composables</h1>
        <p>
          Live values from every composable <span class="pg-accent">@thunderid/vue</span> exposes, then the management
          API functions called with <code>useManagementRequestConfig</code>. Refs are unwrapped, functions are shown as
          signatures; use the buttons to call them.
        </p>
      </div>
    </div>

    <div v-if="error" class="pg-warning" role="alert">{{ error }}</div>

    <div class="pg-grid-2">
      <ComposableCard
        name="useThunderID()"
        signature="ThunderIDContext: reactive state refs, config, and auth functions"
        :value="sdk"
      >
        <template #actions>
          <button
            type="button"
            class="pg-btn"
            data-size="sm"
            :disabled="isSignedIn"
            @click="call('signIn', sdk.signIn)"
          >
            signIn()
          </button>
          <button
            type="button"
            class="pg-btn"
            data-size="sm"
            @click="call('signInSilently', () => sdk.signInSilently())"
          >
            signInSilently()
          </button>
          <button
            type="button"
            class="pg-btn"
            data-size="sm"
            :disabled="!isSignedIn"
            @click="call('signOut', sdk.signOut)"
          >
            signOut()
          </button>
        </template>
      </ComposableCard>

      <ComposableCard
        name="useUser()"
        signature="{profile, flattenedProfile, userSchema, revalidateProfile, updateProfile, onUpdateProfile}"
        :value="user"
      >
        <template #actions>
          <button
            type="button"
            class="pg-btn"
            data-size="sm"
            :disabled="!isSignedIn"
            @click="call('revalidateProfile', user.revalidateProfile)"
          >
            revalidateProfile()
          </button>
        </template>
      </ComposableCard>

      <ComposableCard
        name="useI18n()"
        signature="{currentLanguage, fallbackLanguage, bundles, setLanguage, injectBundles, t}"
        :value="i18nValue"
      >
        <template #actions>
          <button
            v-for="language in languages"
            :key="language"
            type="button"
            class="pg-btn"
            data-size="sm"
            :aria-pressed="language === i18n.currentLanguage.value"
            @click="i18n.setLanguage(language)"
          >
            {{ language }}
          </button>
        </template>
      </ComposableCard>

      <ComposableCard name="useTheme()" signature="{theme, colorScheme, direction, toggleTheme}" :value="themeValue">
        <template #actions>
          <button type="button" class="pg-btn" data-size="sm" @click="theme.toggleTheme()">toggleTheme()</button>
        </template>
      </ComposableCard>

      <ComposableCard
        name="useFlow()"
        signature="FlowContextValue: current step, title, and messages for embedded flows"
        :value="flow"
      />

      <ComposableCard
        name="useFlowMeta()"
        signature="{meta, isLoading, error, fetchFlowMeta, switchLanguage}"
        :value="{error: flowMeta.error.value?.message ?? null, isLoading: flowMeta.isLoading, meta: flowMeta.meta}"
      >
        <template #actions>
          <button type="button" class="pg-btn" data-size="sm" @click="call('fetchFlowMeta', flowMeta.fetchFlowMeta)">
            fetchFlowMeta()
          </button>
        </template>
      </ComposableCard>

      <ComposableCard
        v-for="[name, fetcher] in FETCHERS"
        :key="name"
        :name="name"
        signature="() => ({limit, offset, filter, signal}) => Promise<SelectPage>"
        :value="fetched[name] ?? {data: null, error: null, isLoading: false}"
      >
        <template #actions>
          <button type="button" class="pg-btn" data-size="sm" @click="runFetcher(name, fetcher)">Fetch</button>
        </template>
        <p class="pg-empty">
          Page loader for the select components. Calls the ThunderID API with the signed-in user's token.
        </p>
      </ComposableCard>
    </div>

    <div class="pg-heading">
      <div>
        <h2>Management API functions</h2>
        <p>
          The SDK's management API functions (<code>getGroups()</code>, <code>createGroup()</code>, ...) called with the
          config from <span class="pg-accent">useManagementRequestConfig(collection)</span>, through the playground's
          own small data layer (<code>src/lib/useApiQuery.ts</code> and <code>src/lib/useApiMutation.ts</code>), plus
          <span class="pg-accent">useGrantedPermissions</span> and <span class="pg-accent">useManagementEndpoint</span>.
          Queries wait for a session and follow the first row of each list; Refetch runs one anyway and shows its error.
        </p>
      </div>
    </div>

    <div class="pg-grid-2">
      <ComposableCard
        name="useGrantedPermissions()"
        signature="{permissions, isLoading, can(required)}: read from the access token"
        :value="grantedValue"
      >
        <p v-if="!isSignedIn" class="pg-empty">Signed out: no token, so no permissions.</p>
      </ComposableCard>

      <ComposableCard
        name="useManagementEndpoint(key)"
        signature="(key) => {baseUrl, url}: url is the endpoints override, undefined means {baseUrl}/{collection}"
        :value="endpointsValue"
      />

      <ComposableCard
        name="useManagementRequestConfig(collection)"
        signature="(collection) => {baseUrl, url, fetcher}: spread it into a management API function"
        :value="requestConfigValue"
      />

      <ComposableCard
        v-for="entry in QUERIES"
        :key="entry.name"
        :name="entry.name"
        :signature="entry.signature"
        :value="queryValue(entry.query)"
      >
        <template #actions>
          <button type="button" class="pg-btn" data-size="sm" @click="refetch(entry.name, entry.query)">
            refetch()
          </button>
        </template>
      </ComposableCard>

      <ComposableCard
        name="Write API functions"
        signature="({...useManagementRequestConfig(collection), ...input}) => Promise<result>"
        :value="mutationsValue"
      >
        <template #actions>
          <button
            type="button"
            class="pg-btn"
            data-size="sm"
            @click="call('refetchGroups', () => touchGroups.mutateAsync('touch'))"
          >
            Refetch groups
          </button>
        </template>
        <p class="pg-empty">
          Writes change data, so they run from the admin components in Components. Refetch groups runs a local mutation
          that writes nothing and then refetches the group queries, the way an app refreshes its own data after a write.
        </p>
      </ComposableCard>

      <EventLog />
    </div>
  </main>
</template>
