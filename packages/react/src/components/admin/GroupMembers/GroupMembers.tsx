// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  AgentListResponse,
  AgentQueryKeys,
  BasicAgent,
  Group,
  GroupMember,
  GroupMemberListResponse,
  GroupQueryKeys,
  ManagedUser,
  ManagedUserListResponse,
  ResourceQueryKey,
  RoleQueryKeys,
  UserQueryKeys,
  addGroupMembers,
  getAgents,
  getGroupMembers,
  getUsers,
  removeGroupMembers,
  resolveManagedIdentityName,
  toManagementErrorMessage,
} from '@thunderid/browser';
import {FC, ReactElement, useMemo} from 'react';
import BaseGroupMembers, {BaseGroupMembersProps} from './BaseGroupMembers';
import useManagementEndpoint, {ManagementEndpoint} from '../../../hooks/management/useManagementEndpoint';
import useResourceMutation, {ResourceMutationResult} from '../../../hooks/management/useResourceMutation';
import useResourceQuery, {ResourceQueryResult} from '../../../hooks/management/useResourceQuery';
import useTranslation from '../../../hooks/useTranslation';
import {IdentityCandidate} from '../shared/IdentityPicker';

interface GroupMembersVariables {
  groupId: string;
  members: Pick<GroupMember, 'id' | 'type'>[];
}

/**
 * Query keys to refetch after a group's membership changes.
 */
const getMembershipInvalidatedKeys = ({groupId}: GroupMembersVariables): ResourceQueryKey[] => [
  [GroupQueryKeys.GROUP, groupId],
  [GroupQueryKeys.GROUP_MEMBERS, groupId],
  [GroupQueryKeys.MEMBERSHIPS],
  [RoleQueryKeys.ROLE_ASSIGNMENTS],
];

export type GroupMembersProps = Omit<
  BaseGroupMembersProps,
  'candidates' | 'error' | 'isLoading' | 'isMutating' | 'members' | 'onAdd' | 'onRemove'
> & {
  /**
   * Whether members can be added and removed from this view.
   * @default false
   */
  editable?: boolean;
  groupId: string;
};

/**
 * Lists the users and agents in a group, and lets the signed-in user add and remove them.
 *
 * @example
 * ```tsx
 * <GroupMembers groupId={groupId} />
 * ```
 */
const GroupMembers: FC<GroupMembersProps> = ({
  editable = false,
  groupId,
  preferences,
  ...rest
}: GroupMembersProps): ReactElement => {
  const {t} = useTranslation(preferences?.i18n);
  const groupsEndpoint: ManagementEndpoint = useManagementEndpoint('groups');
  const usersEndpoint: ManagementEndpoint = useManagementEndpoint('users');
  const agentsEndpoint: ManagementEndpoint = useManagementEndpoint('agents');
  const members: ResourceQueryResult<GroupMemberListResponse> = useResourceQuery(
    [GroupQueryKeys.GROUP_MEMBERS, groupId, {limit: 100}],
    (fetcher) => getGroupMembers({...groupsEndpoint, fetcher, groupId, limit: 100}),
    {enabled: Boolean(groupId)},
  );
  const users: ResourceQueryResult<ManagedUserListResponse> = useResourceQuery(
    [UserQueryKeys.USERS, {limit: 100}],
    (fetcher) => getUsers({...usersEndpoint, fetcher, limit: 100}),
    {enabled: editable},
  );
  const agents: ResourceQueryResult<AgentListResponse> = useResourceQuery(
    [AgentQueryKeys.AGENTS, {limit: 100}],
    (fetcher) => getAgents({...agentsEndpoint, fetcher, limit: 100}),
    {enabled: editable},
  );
  const add: ResourceMutationResult<Group, GroupMembersVariables> = useResourceMutation(
    ({groupId: id, members: changes}: GroupMembersVariables, fetcher) =>
      addGroupMembers({...groupsEndpoint, fetcher, groupId: id, members: changes}),
    getMembershipInvalidatedKeys,
  );
  const remove: ResourceMutationResult<Group, GroupMembersVariables> = useResourceMutation(
    ({groupId: id, members: changes}: GroupMembersVariables, fetcher) =>
      removeGroupMembers({...groupsEndpoint, fetcher, groupId: id, members: changes}),
    getMembershipInvalidatedKeys,
  );

  const candidates: Partial<Record<'user' | 'agent', IdentityCandidate[]>> = useMemo(
    () => ({
      agent: (agents.data?.agents ?? []).map((agent: BasicAgent) => ({id: agent.id, label: agent.name})),
      user: (users.data?.users ?? []).map((user: ManagedUser) => ({
        id: user.id,
        label: resolveManagedIdentityName(user),
      })),
    }),
    [agents.data, users.data],
  );

  return (
    <BaseGroupMembers
      members={members.data?.members ?? []}
      isLoading={members.isLoading}
      isMutating={add.isLoading || remove.isLoading}
      error={
        toManagementErrorMessage(t, members.error, 'admin.groups.members.error') ??
        toManagementErrorMessage(t, add.error ?? remove.error, 'admin.groups.members.update_error')
      }
      candidates={editable ? candidates : undefined}
      onAdd={
        editable
          ? (member: Pick<GroupMember, 'id' | 'type'>): void => void add.mutate({groupId, members: [member]})
          : undefined
      }
      onRemove={
        editable
          ? (member: GroupMember): void => void remove.mutate({groupId, members: [{id: member.id, type: member.type}]})
          : undefined
      }
      preferences={preferences}
      {...rest}
    />
  );
};

export default GroupMembers;
