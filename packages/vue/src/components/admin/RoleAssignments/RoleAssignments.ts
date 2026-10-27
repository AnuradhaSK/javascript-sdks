// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  AgentQueryKeys,
  GroupQueryKeys,
  RoleQueryKeys,
  UserQueryKeys,
  addRoleAssignments,
  getAgents,
  getGroups,
  getRoleAssignments,
  getUsers,
  removeRoleAssignments,
  resolveManagedIdentityName,
  toManagementErrorMessage,
} from '@thunderid/browser';
import type {
  AgentListResponse,
  BasicAgent,
  Group,
  GroupListResponse,
  ManagedUser,
  ManagedUserListResponse,
  Preferences,
  RoleAssigneeType,
  RoleAssignment,
  RoleAssignmentInput,
  RoleAssignmentListResponse,
} from '@thunderid/browser';
import {type Component, type PropType, type Ref, type SetupContext, type VNode, defineComponent, h, ref} from 'vue';
import BaseRoleAssignments from './BaseRoleAssignments';
import useManagementEndpoint, {type ManagementEndpoint} from '../../../composables/management/useManagementEndpoint';
import useResourceMutation, {type ResourceMutationResult} from '../../../composables/management/useResourceMutation';
import useResourceQuery, {type ResourceQueryResult} from '../../../composables/management/useResourceQuery';
import type {IdentityCandidate} from '../shared/IdentityPicker';
import useAdminTranslation, {type AdminTranslate} from '../shared/useAdminTranslation';

type RoleAssignmentsProps = Readonly<{
  className: string;
  description: string | undefined;
  editable: boolean;
  filterable: boolean;
  preferences: Preferences | undefined;
  roleId: string;
  title: string | undefined;
}>;

interface RoleAssignmentsVariables {
  assignments: RoleAssignmentInput[];
  roleId: string;
}

/**
 * Lists who a role is assigned to and, unless `editable` is `false`, lets the signed-in user assign it
 * to users, groups and agents or remove assignments.
 *
 * @example
 * ```vue
 * <RoleAssignments :role-id="roleId" />
 * ```
 */
const RoleAssignments: Component = defineComponent({
  name: 'RoleAssignments',
  props: {
    /** Extra CSS class added to the root element. */
    className: {default: '', type: String},
    /** Text shown under the title. */
    description: {default: undefined, type: String},
    /** Whether assignments can be added and removed. */
    editable: {default: false, type: Boolean},
    /** Component-level preferences, for example `i18n.bundles` overrides. */
    preferences: {default: undefined, type: Object as PropType<Preferences>},
    /** Whether to show the assignee type filter, which narrows the list on the server. */
    filterable: {default: true, type: Boolean},
    /** Identifier of the role. */
    roleId: {required: true, type: String},
    /** Heading of the section. Pass an empty string to hide it. */
    title: {default: undefined, type: String},
  },
  setup(props: RoleAssignmentsProps, {slots}: SetupContext): () => VNode {
    const t: AdminTranslate = useAdminTranslation(() => props.preferences);
    const typeFilter: Ref<RoleAssigneeType | null> = ref(null);
    const rolesEndpoint: ManagementEndpoint = useManagementEndpoint('roles');
    const usersEndpoint: ManagementEndpoint = useManagementEndpoint('users');
    const groupsEndpoint: ManagementEndpoint = useManagementEndpoint('groups');
    const agentsEndpoint: ManagementEndpoint = useManagementEndpoint('agents');
    const assignments: ResourceQueryResult<RoleAssignmentListResponse> = useResourceQuery(
      () => [RoleQueryKeys.ROLE_ASSIGNMENTS, props.roleId, {limit: 100, type: typeFilter.value ?? undefined}],
      (fetcher) =>
        getRoleAssignments({
          ...rolesEndpoint,
          fetcher,
          limit: 100,
          roleId: props.roleId,
          type: typeFilter.value ?? undefined,
        }),
      {enabled: () => Boolean(props.roleId)},
    );
    const editable = (): boolean => props.editable;
    const users: ResourceQueryResult<ManagedUserListResponse> = useResourceQuery(
      () => [UserQueryKeys.USERS, {limit: 100}],
      (fetcher) => getUsers({...usersEndpoint, fetcher, limit: 100}),
      {enabled: editable},
    );
    const groups: ResourceQueryResult<GroupListResponse> = useResourceQuery(
      () => [GroupQueryKeys.GROUPS, {limit: 100}],
      (fetcher) => getGroups({...groupsEndpoint, fetcher, limit: 100}),
      {enabled: editable},
    );
    const agents: ResourceQueryResult<AgentListResponse> = useResourceQuery(
      () => [AgentQueryKeys.AGENTS, {limit: 100}],
      (fetcher) => getAgents({...agentsEndpoint, fetcher, limit: 100}),
      {enabled: editable},
    );
    // Every mounted assignment list is refetched, including the roles listed for an agent.
    const assign: ResourceMutationResult<void, RoleAssignmentsVariables> = useResourceMutation(
      ({roleId, assignments: added}: RoleAssignmentsVariables, fetcher) =>
        addRoleAssignments({...rolesEndpoint, assignments: added, fetcher, roleId}),
      () => [[RoleQueryKeys.ROLE_ASSIGNMENTS]],
    );
    const unassign: ResourceMutationResult<void, RoleAssignmentsVariables> = useResourceMutation(
      ({roleId, assignments: removed}: RoleAssignmentsVariables, fetcher) =>
        removeRoleAssignments({...rolesEndpoint, assignments: removed, fetcher, roleId}),
      () => [[RoleQueryKeys.ROLE_ASSIGNMENTS]],
    );

    return (): VNode => {
      const candidates: Partial<Record<'user' | 'group' | 'agent', IdentityCandidate[]>> = {
        agent: (agents.data.value?.agents ?? []).map((agent: BasicAgent) => ({id: agent.id, label: agent.name})),
        group: (groups.data.value?.groups ?? []).map((group: Group) => ({id: group.id, label: group.name})),
        user: (users.data.value?.users ?? []).map((user: ManagedUser) => ({
          id: user.id,
          label: resolveManagedIdentityName(user),
        })),
      };

      return h(
        BaseRoleAssignments,
        {
          assignments: assignments.data.value?.assignments ?? [],
          candidates: props.editable ? candidates : undefined,
          className: props.className,
          description: props.description,
          error:
            toManagementErrorMessage(t, assignments.error.value, 'admin.roles.assignments.error') ??
            toManagementErrorMessage(
              t,
              assign.error.value ?? unassign.error.value,
              'admin.roles.assignments.update_error',
            ),
          isLoading: assignments.isLoading.value,
          isMutating: assign.isLoading.value || unassign.isLoading.value,
          onAssign: props.editable
            ? (assignment: RoleAssignmentInput): void =>
                void assign.mutate({assignments: [assignment], roleId: props.roleId})
            : undefined,
          onUnassign: props.editable
            ? (assignment: RoleAssignment): void =>
                void unassign.mutate({
                  assignments: [{id: assignment.id, type: assignment.type}],
                  roleId: props.roleId,
                })
            : undefined,
          onTypeFilterChange: props.filterable
            ? (type: RoleAssigneeType | null): void => {
                typeFilter.value = type;
              }
            : undefined,
          preferences: props.preferences,
          title: props.title,
          typeFilter: typeFilter.value,
        },
        {...slots},
      );
    };
  },
});

export default RoleAssignments;
