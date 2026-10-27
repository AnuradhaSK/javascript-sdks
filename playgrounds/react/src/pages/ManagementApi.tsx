// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getUserTypes} from '@thunderid/browser';
import {
  type AgentListResponse,
  type CreateGroupRequest,
  type CreateRoleRequest,
  type Group,
  type ManagementRequestConfig,
  type Role,
  type RoleAssignmentInput,
  addGroupMembers,
  addRoleAssignments,
  createGroup,
  createRole,
  deleteGroup,
  deleteRole,
  getAgentGroups,
  getAgentRoles,
  getAgentTypes,
  getGroup,
  getGroupMembers,
  getGroups,
  getRole,
  getRoleAssignments,
  getRoles,
  getUserGroups,
  removeGroupMembers,
  removeRoleAssignments,
  updateGroup,
  updateRole,
  useGrantedPermissions,
  useManagementRequestConfig,
  useThunderID,
  useUser,
} from '@thunderid/react';
import {ChangeEvent, ReactElement, useState} from 'react';
import {HookCard, QueryCard} from '../components/HookCard';
import {describeError, track} from '../lib/events';
import {PERMISSION_PROBES} from '../lib/management';
import requireId from '../lib/requireId';
import {asText} from '../lib/sdk';
import useApiMutation from '../lib/useApiMutation';
import useApiQuery from '../lib/useApiQuery';

interface IdFieldProps {
  label: string;
  onChange: (value: string) => void;
  /** Fills the field, for example from the first item of a list call. */
  onFill?: () => void;
  fillLabel?: string;
  value: string;
}

const IdField = ({fillLabel = 'Use first', label, onChange, onFill = undefined, value}: IdFieldProps): ReactElement => (
  <div className="pg-row" style={{padding: '0 18px 12px', alignItems: 'center'}}>
    <input
      className="pg-input"
      aria-label={label}
      placeholder={label}
      value={value}
      style={{flex: 1}}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value.trim())}
    />
    {onFill && (
      <button type="button" className="pg-btn" data-size="sm" style={{flex: 'none'}} onClick={onFill}>
        {fillLabel}
      </button>
    )}
  </div>
);

const ID_SIGNATURE = '({...config, <id>, limit}) => Promise<page>';

type Members = {id: string; type: 'user'}[];

const mutationState = (mutation: {data: unknown; error: Error | null; isLoading: boolean}): unknown => ({
  data: mutation.data,
  error: mutation.error?.message ?? null,
  isLoading: mutation.isLoading,
});

/**
 * The group, role, type, and membership API functions, plus useGrantedPermissions. Each card calls an
 * SDK management API function with the config from useManagementRequestConfig(collection), through the
 * playground's own data layer (lib/useApiQuery.ts and lib/useApiMutation.ts). Reads run from Fetch; writes only run from their
 * buttons and act on a scratch group or role.
 */
const ManagementApi = ({agents}: {agents: AgentListResponse | undefined}): ReactElement => {
  const sdk = useThunderID();
  const {flattenedProfile} = useUser();
  const granted = useGrantedPermissions();
  const [probe, setProbe] = useState<string>('system:group:view');
  const [groupId, setGroupId] = useState<string>('');
  const [roleId, setRoleId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [agentId, setAgentId] = useState<string>('');
  const [ouId, setOuId] = useState<string>(() =>
    asText((flattenedProfile as Record<string, unknown> | null)?.['ouId']),
  );
  const [scratchGroup, setScratchGroup] = useState<Group | null>(null);
  const [scratchRole, setScratchRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groupsConfig: ManagementRequestConfig = useManagementRequestConfig('groups');
  const rolesConfig: ManagementRequestConfig = useManagementRequestConfig('roles');
  const usersConfig: ManagementRequestConfig = useManagementRequestConfig('users');
  const agentsConfig: ManagementRequestConfig = useManagementRequestConfig('agents');
  const userTypesConfig: ManagementRequestConfig = useManagementRequestConfig('userTypes');
  const agentTypesConfig: ManagementRequestConfig = useManagementRequestConfig('agentTypes');
  const manual: {enabled: boolean} = {enabled: false};

  const groups = useApiQuery(() => getGroups({...groupsConfig, limit: 5}), manual);
  const roles = useApiQuery(() => getRoles({...rolesConfig, limit: 5}), manual);
  const userTypes = useApiQuery(() => getUserTypes({...userTypesConfig, limit: 10}), manual);
  const agentTypes = useApiQuery(() => getAgentTypes({...agentTypesConfig, limit: 10}), manual);
  const group = useApiQuery(() => getGroup({...groupsConfig, groupId: requireId(groupId, 'groupId')}), manual);
  const groupMembers = useApiQuery(
    () => getGroupMembers({...groupsConfig, groupId: requireId(groupId, 'groupId'), limit: 10}),
    manual,
  );
  const role = useApiQuery(() => getRole({...rolesConfig, roleId: requireId(roleId, 'roleId')}), manual);
  const roleAssignments = useApiQuery(
    () => getRoleAssignments({...rolesConfig, limit: 10, roleId: requireId(roleId, 'roleId')}),
    manual,
  );
  const userGroups = useApiQuery(
    () => getUserGroups({...usersConfig, limit: 10, userId: requireId(userId, 'userId')}),
    manual,
  );
  const agentGroups = useApiQuery(
    () => getAgentGroups({...agentsConfig, agentId: requireId(agentId, 'agentId'), limit: 10}),
    manual,
  );
  const agentRoles = useApiQuery(
    () => getAgentRoles({...agentsConfig, agentId: requireId(agentId, 'agentId'), limit: 10}),
    manual,
  );

  const createGroupCall = useApiMutation((payload: CreateGroupRequest) => createGroup({...groupsConfig, payload}));
  const updateGroupCall = useApiMutation((target: Group) =>
    updateGroup({
      ...groupsConfig,
      groupId: target.id,
      payload: {description: 'Renamed by the playground', name: `${target.name}-renamed`, ouId: target.ouId},
    }),
  );
  const addGroupMembersCall = useApiMutation(({groupId: id, members}: {groupId: string; members: Members}) =>
    addGroupMembers({...groupsConfig, groupId: id, members}),
  );
  const removeGroupMembersCall = useApiMutation(({groupId: id, members}: {groupId: string; members: Members}) =>
    removeGroupMembers({...groupsConfig, groupId: id, members}),
  );
  const deleteGroupCall = useApiMutation((id: string) => deleteGroup({...groupsConfig, groupId: id}));
  const createRoleCall = useApiMutation((payload: CreateRoleRequest) => createRole({...rolesConfig, payload}));
  const updateRoleCall = useApiMutation((target: Role) =>
    updateRole({
      ...rolesConfig,
      current: target,
      payload: {
        description: 'Renamed by the playground',
        name: `${target.name}-renamed`,
        ouId: target.ouId,
        permissions: target.permissions ?? [],
      },
      roleId: target.id,
    }),
  );
  const addRoleAssignmentsCall = useApiMutation(
    ({assignments, roleId: id}: {assignments: RoleAssignmentInput[]; roleId: string}) =>
      addRoleAssignments({...rolesConfig, assignments, roleId: id}),
  );
  const removeRoleAssignmentsCall = useApiMutation(
    ({assignments, roleId: id}: {assignments: RoleAssignmentInput[]; roleId: string}) =>
      removeRoleAssignments({...rolesConfig, assignments, roleId: id}),
  );
  const deleteRoleCall = useApiMutation((id: string) => deleteRole({...rolesConfig, roleId: id}));

  const run = (label: string, call: () => Promise<unknown>): void => {
    setError(null);
    track(label, call).catch((caught: unknown) => setError(`${label}: ${describeError(caught)}`));
  };

  const fillMe = (): void =>
    run('getDecodedIdToken', async () => {
      setUserId(asText(((await sdk.getDecodedIdToken()) as Record<string, unknown>)['sub']));
    });

  // The scratch identity added to the scratch group and role is the signed-in user.
  const me = async (): Promise<string> => asText(((await sdk.getDecodedIdToken()) as Record<string, unknown>)['sub']);
  const scratchName = (kind: string): string => `playground-${kind}-${Date.now().toString(36)}`;
  const needsOu: boolean = !sdk.isSignedIn || !ouId;

  return (
    <>
      <div className="pg-heading" style={{gridColumn: '1 / -1'}}>
        <div>
          <h2>Management API functions</h2>
          <p>
            The SDK&apos;s management API functions (<span className="pg-mono">getGroups()</span>,{' '}
            <span className="pg-mono">createGroup()</span>, ...) called with the config from{' '}
            <span className="pg-accent">useManagementRequestConfig(collection)</span>, through the playground&apos;s own
            small data layer (<span className="pg-mono">src/lib/useApiQuery.ts</span> and{' '}
            <span className="pg-mono">src/lib/useApiMutation.ts</span>). An app would use TanStack Query, SWR, or its
            own store in its place.
          </p>
        </div>
      </div>

      {error && (
        <div className="pg-warning" role="alert" style={{gridColumn: '1 / -1'}}>
          {error}
        </div>
      )}

      <HookCard
        name="useGrantedPermissions()"
        signature="() => {permissions, isLoading, can(required)}"
        value={{
          [`can('${probe}')`]: granted.can(probe),
          isLoading: granted.isLoading,
          permissions: granted.permissions,
          probes: Object.fromEntries(PERMISSION_PROBES.map((item: string) => [item, granted.can(item)])),
        }}
      >
        <IdField label="Permission to check with can()" value={probe} onChange={setProbe} />
        {!sdk.isSignedIn && <p className="pg-empty">Sign in: permissions come from the access token scope claim.</p>}
      </HookCard>

      <HookCard
        name="useManagementRequestConfig(collection)"
        signature="(collection) => {baseUrl, url, fetcher}: spread it into an API function"
        value={{agents: agentsConfig, groups: groupsConfig, roles: rolesConfig, users: usersConfig}}
      />

      <QueryCard name="getGroups()" query={groups} />
      <QueryCard name="getRoles()" query={roles} />
      <QueryCard name="getUserTypes()" query={userTypes} />
      <QueryCard name="getAgentTypes()" query={agentTypes} />

      <QueryCard
        name="getGroup()"
        query={group}
        signature="({...config, groupId}) => Promise<Group>"
        disabled={!groupId}
      >
        <IdField
          label="groupId"
          value={groupId}
          onChange={setGroupId}
          onFill={groups.data?.groups[0] ? () => setGroupId(groups.data?.groups[0]?.id ?? '') : undefined}
        />
      </QueryCard>
      <QueryCard name="getGroupMembers()" query={groupMembers} signature={ID_SIGNATURE} disabled={!groupId}>
        <p className="pg-empty">Uses the groupId above{groupId ? `: ${groupId}` : '. Fetch getGroups() first.'}</p>
      </QueryCard>
      <QueryCard name="getRole()" query={role} signature="({...config, roleId}) => Promise<Role>" disabled={!roleId}>
        <IdField
          label="roleId"
          value={roleId}
          onChange={setRoleId}
          onFill={roles.data?.roles[0] ? () => setRoleId(roles.data?.roles[0]?.id ?? '') : undefined}
        />
      </QueryCard>
      <QueryCard
        name="getRoleAssignments()"
        query={roleAssignments}
        signature="({...config, roleId, limit, type}) => Promise<page>"
        disabled={!roleId}
      >
        <p className="pg-empty">Uses the roleId above{roleId ? `: ${roleId}` : '. Fetch getRoles() first.'}</p>
      </QueryCard>
      <QueryCard name="getUserGroups()" query={userGroups} signature={ID_SIGNATURE} disabled={!userId}>
        <IdField
          label="userId"
          value={userId}
          onChange={setUserId}
          fillLabel="Use me"
          onFill={sdk.isSignedIn ? fillMe : undefined}
        />
      </QueryCard>
      <QueryCard name="getAgentGroups()" query={agentGroups} signature={ID_SIGNATURE} disabled={!agentId}>
        <IdField
          label="agentId"
          value={agentId}
          onChange={setAgentId}
          onFill={agents?.agents[0] ? () => setAgentId(agents?.agents[0]?.id ?? '') : undefined}
        />
      </QueryCard>
      <QueryCard name="getAgentRoles()" query={agentRoles} signature={ID_SIGNATURE} disabled={!agentId}>
        <p className="pg-empty">Uses the agentId above{agentId ? `: ${agentId}` : '. Fetch getAgents() first.'}</p>
      </QueryCard>

      <HookCard
        name="Group mutations"
        signature="createGroup · updateGroup · addGroupMembers · removeGroupMembers · deleteGroup, with useManagementRequestConfig('groups')"
        value={{
          addGroupMembers: mutationState(addGroupMembersCall),
          createGroup: mutationState(createGroupCall),
          deleteGroup: mutationState(deleteGroupCall),
          removeGroupMembers: mutationState(removeGroupMembersCall),
          scratchGroup,
          updateGroup: mutationState(updateGroupCall),
        }}
        actions={
          <>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={needsOu || !!scratchGroup}
              onClick={() =>
                run('createGroup', async () =>
                  setScratchGroup(await createGroupCall.mutateAsync({name: scratchName('group'), ouId})),
                )
              }
            >
              create
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!scratchGroup}
              onClick={() =>
                run('updateGroup', async () => {
                  if (!scratchGroup) return;
                  setScratchGroup(await updateGroupCall.mutateAsync(scratchGroup));
                })
              }
            >
              update
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!scratchGroup}
              onClick={() =>
                run('addGroupMembers', async () => {
                  if (scratchGroup)
                    await addGroupMembersCall.mutateAsync({
                      groupId: scratchGroup.id,
                      members: [{id: await me(), type: 'user'}],
                    });
                })
              }
            >
              add me
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!scratchGroup}
              onClick={() =>
                run('removeGroupMembers', async () => {
                  if (scratchGroup)
                    await removeGroupMembersCall.mutateAsync({
                      groupId: scratchGroup.id,
                      members: [{id: await me(), type: 'user'}],
                    });
                })
              }
            >
              remove me
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              data-variant="danger"
              disabled={!scratchGroup}
              onClick={() =>
                run('deleteGroup', async () => {
                  if (!scratchGroup) return;
                  await deleteGroupCall.mutateAsync(scratchGroup.id);
                  setScratchGroup(null);
                })
              }
            >
              delete
            </button>
          </>
        }
      >
        <IdField
          label="ouId for the scratch group and role"
          value={ouId}
          onChange={setOuId}
          onFill={groups.data?.groups[0] ? () => setOuId(groups.data?.groups[0]?.ouId ?? '') : undefined}
          fillLabel="Use first group's OU"
        />
        <p className="pg-empty">
          Writes data. Creates a scratch group named playground-group-…, then acts on that group only.
          {needsOu && ' Sign in and set an ouId first.'}
        </p>
      </HookCard>

      <HookCard
        name="Role mutations"
        signature="createRole · updateRole · addRoleAssignments · removeRoleAssignments · deleteRole, with useManagementRequestConfig('roles')"
        value={{
          addRoleAssignments: mutationState(addRoleAssignmentsCall),
          createRole: mutationState(createRoleCall),
          deleteRole: mutationState(deleteRoleCall),
          removeRoleAssignments: mutationState(removeRoleAssignmentsCall),
          scratchRole,
          updateRole: mutationState(updateRoleCall),
        }}
        actions={
          <>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={needsOu || !!scratchRole}
              onClick={() =>
                run('createRole', async () =>
                  setScratchRole(await createRoleCall.mutateAsync({name: scratchName('role'), ouId})),
                )
              }
            >
              create
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!scratchRole}
              onClick={() =>
                run('updateRole', async () => {
                  if (!scratchRole) return;
                  setScratchRole(await updateRoleCall.mutateAsync(scratchRole));
                })
              }
            >
              update
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!scratchRole}
              onClick={() =>
                run('addRoleAssignments', async () => {
                  if (scratchRole)
                    await addRoleAssignmentsCall.mutateAsync({
                      assignments: [{id: await me(), type: 'user'}],
                      roleId: scratchRole.id,
                    });
                })
              }
            >
              assign me
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!scratchRole}
              onClick={() =>
                run('removeRoleAssignments', async () => {
                  if (scratchRole)
                    await removeRoleAssignmentsCall.mutateAsync({
                      assignments: [{id: await me(), type: 'user'}],
                      roleId: scratchRole.id,
                    });
                })
              }
            >
              unassign me
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              data-variant="danger"
              disabled={!scratchRole}
              onClick={() =>
                run('deleteRole', async () => {
                  if (!scratchRole) return;
                  await deleteRoleCall.mutateAsync(scratchRole.id);
                  setScratchRole(null);
                })
              }
            >
              delete
            </button>
          </>
        }
      >
        <p className="pg-empty">
          Writes data. Creates a scratch role named playground-role-… with no permissions, in the ouId above.
          {needsOu && ' Sign in and set an ouId first.'}
        </p>
      </HookCard>
    </>
  );
};

export default ManagementApi;
