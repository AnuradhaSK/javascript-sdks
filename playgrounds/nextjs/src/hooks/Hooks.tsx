// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
  addGroupMembers,
  addRoleAssignments,
  createGroup,
  createRole,
  deleteGroup,
  deleteRole,
  getAgentGroups,
  getAgentRoles,
  getAgents,
  getAgentTypes,
  getGroup,
  getGroupMembers,
  getGroups,
  getRole,
  getRoleAssignments,
  getRoles,
  getUserGroups,
  getUserTypes,
  removeGroupMembers,
  removeRoleAssignments,
  updateGroup,
  updateRole,
  type CreateGroupRequest,
  type CreateRoleRequest,
  type ManagementRequestConfig,
  type RoleAssignmentInput,
  type UpdateGroupRequest,
  type UpdateRoleRequest,
} from '@thunderid/browser';
import {useGrantedPermissions, useManagementRequestConfig, useThunderID} from '@thunderid/nextjs';
import {useGrantedPermissions as useReactGrantedPermissions, useUser} from '@thunderid/react';
import {ChangeEvent, ReactElement, ReactNode, useState} from 'react';
import {describeError, logEvent} from '../lib/events';
import requireId from '../lib/requireId';
import {useServerSession} from '../lib/session';
import useApiMutation, {type ApiMutation} from '../lib/useApiMutation';
import useApiQuery, {type ApiQuery} from '../lib/useApiQuery';

type Query = Pick<ApiQuery<unknown>, 'data' | 'error' | 'isLoading'> & {refetch?: () => Promise<unknown>};

const stateOf = (query: Query): [string, string] => {
  if (query.isLoading) return ['Loading', ''];
  if (query.error) return ['Error', 'error'];
  if (query.data === undefined) return ['Idle', ''];

  return ['OK', 'ok'];
};

/** One call: its signature, what it returned, and a refetch button. */
const HookCard = ({
  children = null,
  name,
  query,
  signature,
  summary = '',
}: {
  children?: ReactNode;
  name: string;
  query: Query;
  signature: string;
  summary?: string;
}): ReactElement => {
  const [label, state] = stateOf(query);

  return (
    <section className="pg-card" aria-label={name}>
      <div className="pg-card-head">
        <div>
          <h2>{name}</h2>
          <div className="pg-hook-sig">{signature}</div>
        </div>
        <div className="pg-row" style={{alignItems: 'center'}}>
          <span className="pg-pill" data-state={state}>
            {label}
          </span>
          {query.refetch && (
            <button type="button" className="pg-btn" data-size="sm" onClick={() => void query.refetch?.()}>
              Refetch
            </button>
          )}
        </div>
      </div>
      {children && <div className="pg-card-body">{children}</div>}
      {query.error && <p className="pg-empty pg-hook-error">{describeError(query.error)}</p>}
      {!query.error && summary && <p className="pg-empty">{summary}</p>}
      {query.data !== undefined && <pre className="pg-json">{JSON.stringify(query.data, null, 2)}</pre>}
    </section>
  );
};

const IdInput = ({
  fallback,
  label,
  onChange,
  value,
}: {
  fallback: string | undefined;
  label: string;
  onChange: (value: string) => void;
  value: string;
}): ReactElement => (
  <label className="pg-hook-input">
    <span>{label}</span>
    <input
      className="pg-input"
      value={value}
      placeholder={fallback ? `${fallback} (first in the list)` : 'none found yet'}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value.trim())}
    />
  </label>
);

type Members = {id: string; type: 'user'}[];

type AnyMutation = Pick<ApiMutation<never, unknown>, 'error' | 'isLoading'>;

const MutationRow = ({label, mutation}: {label: string; mutation: AnyMutation}): ReactElement => (
  <>
    <dt>{label}</dt>
    <dd>{mutation.isLoading ? 'running…' : mutation.error ? describeError(mutation.error) : 'idle / ok'}</dd>
  </>
);

/**
 * The management API functions, called with `useManagementRequestConfig` from @thunderid/nextjs through
 * the playground's own data layer (lib/useApiQuery.ts and lib/useApiMutation.ts), and `useGrantedPermissions`. The config's
 * fetcher sends every request through the SDK's management server action, so each card works only with
 * a session; without one the server action answers HTTP 401 and the card shows it.
 */
const Hooks = (): ReactElement => {
  const sdk = useThunderID();
  const isSignedIn = !!sdk.isSignedIn;
  const {flattenedProfile, profile} = useUser();
  const {session} = useServerSession(isSignedIn);
  const sub: unknown = session?.claims?.['sub'];
  const ouIdValue: unknown = ((flattenedProfile ?? profile ?? {}) as Record<string, unknown>)['ouId'];
  const ouId: string | undefined = typeof ouIdValue === 'string' ? ouIdValue : undefined;

  const [groupInput, setGroupInput] = useState<string>('');
  const [roleInput, setRoleInput] = useState<string>('');
  const [agentInput, setAgentInput] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [required, setRequired] = useState<string>('system:group:view');
  const [createdGroup, setCreatedGroup] = useState<string | null>(null);
  const [createdRole, setCreatedRole] = useState<string | null>(null);

  const groupsConfig: ManagementRequestConfig = useManagementRequestConfig('groups');
  const rolesConfig: ManagementRequestConfig = useManagementRequestConfig('roles');
  const usersConfig: ManagementRequestConfig = useManagementRequestConfig('users');
  const agentsConfig: ManagementRequestConfig = useManagementRequestConfig('agents');
  const userTypesConfig: ManagementRequestConfig = useManagementRequestConfig('userTypes');
  const agentTypesConfig: ManagementRequestConfig = useManagementRequestConfig('agentTypes');

  // Lists, which also supply the default identifiers for the single-resource calls.
  const groups = useApiQuery(() => getGroups({...groupsConfig, limit: 5}));
  const roles = useApiQuery(() => getRoles({...rolesConfig, limit: 5}));
  const agents = useApiQuery(() => getAgents({...agentsConfig, limit: 5}));
  const userTypes = useApiQuery(() => getUserTypes({...userTypesConfig, limit: 10}));
  const agentTypes = useApiQuery(() => getAgentTypes({...agentTypesConfig, limit: 10}));

  const firstGroup: string | undefined = groups.data?.groups[0]?.id;
  const firstRole: string | undefined = roles.data?.roles[0]?.id;
  const firstAgent: string | undefined = agents.data?.agents[0]?.id;
  const groupId: string | undefined = groupInput || firstGroup;
  const roleId: string | undefined = roleInput || firstRole;
  const agentId: string | undefined = agentInput || firstAgent;
  const userId: string | undefined = userInput || (typeof sub === 'string' ? sub : undefined);

  // The ID-scoped calls wait for an ID and run again when it changes.
  const byGroup: {enabled: boolean; key?: string} = {enabled: !!groupId, key: groupId};
  const byRole: {enabled: boolean; key?: string} = {enabled: !!roleId, key: roleId};
  const byAgent: {enabled: boolean; key?: string} = {enabled: !!agentId, key: agentId};

  const group = useApiQuery(() => getGroup({...groupsConfig, groupId: requireId(groupId, 'groupId')}), byGroup);
  const members = useApiQuery(
    () => getGroupMembers({...groupsConfig, groupId: requireId(groupId, 'groupId'), limit: 5}),
    byGroup,
  );
  const role = useApiQuery(() => getRole({...rolesConfig, roleId: requireId(roleId, 'roleId')}), byRole);
  const assignments = useApiQuery(
    () => getRoleAssignments({...rolesConfig, limit: 5, roleId: requireId(roleId, 'roleId')}),
    byRole,
  );
  const userGroups = useApiQuery(() => getUserGroups({...usersConfig, userId: requireId(userId, 'userId')}), {
    enabled: !!userId,
    key: userId,
  });
  const agentGroups = useApiQuery(
    () => getAgentGroups({...agentsConfig, agentId: requireId(agentId, 'agentId')}),
    byAgent,
  );
  const agentRoles = useApiQuery(
    () => getAgentRoles({...agentsConfig, agentId: requireId(agentId, 'agentId')}),
    byAgent,
  );

  const granted = useGrantedPermissions();
  const reactGranted = useReactGrantedPermissions();

  const onError = (name: string) => (error: Error) => logEvent(`${name}:failed`, error.message, 'error');

  const createGroupCall = useApiMutation((payload: CreateGroupRequest) => createGroup({...groupsConfig, payload}), {
    onError: onError('createGroup'),
    onSuccess: (created: {id: string}) => setCreatedGroup(created.id),
  });
  const updateGroupCall = useApiMutation(
    ({groupId: id, payload}: {groupId: string; payload: UpdateGroupRequest}) =>
      updateGroup({...groupsConfig, groupId: id, payload}),
    {onError: onError('updateGroup')},
  );
  const addMembers = useApiMutation(
    ({groupId: id, members: identities}: {groupId: string; members: Members}) =>
      addGroupMembers({...groupsConfig, groupId: id, members: identities}),
    {onError: onError('addGroupMembers')},
  );
  const removeMembers = useApiMutation(
    ({groupId: id, members: identities}: {groupId: string; members: Members}) =>
      removeGroupMembers({...groupsConfig, groupId: id, members: identities}),
    {onError: onError('removeGroupMembers')},
  );
  const deleteGroupCall = useApiMutation((id: string) => deleteGroup({...groupsConfig, groupId: id}), {
    onError: onError('deleteGroup'),
    onSuccess: () => setCreatedGroup(null),
  });

  const createRoleCall = useApiMutation((payload: CreateRoleRequest) => createRole({...rolesConfig, payload}), {
    onError: onError('createRole'),
    onSuccess: (created: {id: string}) => setCreatedRole(created.id),
  });
  const updateRoleCall = useApiMutation(
    ({payload, roleId: id}: {payload: UpdateRoleRequest; roleId: string}) =>
      updateRole({...rolesConfig, payload, roleId: id}),
    {onError: onError('updateRole')},
  );
  const addAssignments = useApiMutation(
    ({assignments: list, roleId: id}: {assignments: RoleAssignmentInput[]; roleId: string}) =>
      addRoleAssignments({...rolesConfig, assignments: list, roleId: id}),
    {onError: onError('addRoleAssignments')},
  );
  const removeAssignments = useApiMutation(
    ({assignments: list, roleId: id}: {assignments: RoleAssignmentInput[]; roleId: string}) =>
      removeRoleAssignments({...rolesConfig, assignments: list, roleId: id}),
    {onError: onError('removeRoleAssignments')},
  );
  const deleteRoleCall = useApiMutation((id: string) => deleteRole({...rolesConfig, roleId: id}), {
    onError: onError('deleteRole'),
    onSuccess: () => setCreatedRole(null),
  });

  const name = (kind: string): string => `playground-${kind}-${Date.now().toString(36)}`;
  const me = (type: 'user'): {id: string; type: 'user'}[] => (userId ? [{id: userId, type}] : []);
  const writeBlocked: string | null = !isSignedIn
    ? 'sign in first'
    : !ouId
      ? 'the profile has no ouId'
      : !userId
        ? 'no user id'
        : null;

  return (
    <main className="pg-main">
      <div className="pg-heading">
        <div>
          <h1>Hooks</h1>
          <p>
            The management API functions (<span className="pg-mono">getGroups()</span>,{' '}
            <span className="pg-mono">createGroup()</span>, ...) called with{' '}
            <span className="pg-accent">useManagementRequestConfig(collection)</span> from @thunderid/nextjs through the
            playground&apos;s own small data layer, and <span className="pg-mono">useGrantedPermissions</span>. The
            config&apos;s fetcher runs each request through the SDK&apos;s management server action with the server-held
            session; the access token never reaches the browser.
          </p>
        </div>
      </div>

      {!isSignedIn && (
        <div className="pg-warning" role="status">
          {sdk.isLoading
            ? 'The SDK is still loading.'
            : 'Not signed in: every management call below fails with HTTP 401 from the server action. Sign in from the Overview page.'}
        </div>
      )}

      <div className="pg-section-label">Permissions</div>
      <div className="pg-grid-2">
        <HookCard
          name="useGrantedPermissions"
          signature="@thunderid/nextjs · getGrantedPermissionsAction (server action)"
          query={{data: granted.isLoading ? undefined : granted.permissions, error: null, isLoading: granted.isLoading}}
          summary={`${granted.permissions.length} permissions; can('${required}') = ${String(granted.can(required))}`}
        >
          <IdInput label="can()" value={required} fallback={undefined} onChange={setRequired} />
        </HookCard>
        <HookCard
          name="useGrantedPermissions (@thunderid/react)"
          signature="@thunderid/react · getAccessToken() in the browser"
          query={{
            data: reactGranted.isLoading ? undefined : reactGranted.permissions,
            error: null,
            isLoading: reactGranted.isLoading,
          }}
          summary="For comparison: under Next.js the browser holds no token, so this hook returns []. Use the @thunderid/nextjs hook."
        />
      </div>

      <div className="pg-section-label">Groups</div>
      <div className="pg-grid-2">
        <HookCard name="getGroups" signature="getGroups({...config, limit: 5})" query={groups} />
        <HookCard name="getGroup" signature="getGroup({...config, groupId})" query={group}>
          <IdInput label="groupId" value={groupInput} fallback={firstGroup} onChange={setGroupInput} />
        </HookCard>
        <HookCard name="getGroupMembers" signature="getGroupMembers({...config, groupId, limit: 5})" query={members} />
        <HookCard
          name="Group mutations"
          signature="createGroup · updateGroup · addGroupMembers · removeGroupMembers · deleteGroup"
          query={{data: createGroupCall.data ?? updateGroupCall.data, error: null, isLoading: false}}
          summary={
            writeBlocked
              ? `Writes are disabled: ${writeBlocked}.`
              : `Works on a temporary group${createdGroup ? ` (${createdGroup})` : ''}; delete it when done.`
          }
        >
          <div className="pg-row">
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!!writeBlocked || !!createdGroup}
              onClick={() => void createGroupCall.mutate({name: name('group'), ouId: ouId!})}
            >
              Create
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!createdGroup}
              onClick={() =>
                void updateGroupCall.mutate({
                  payload: {
                    description: `renamed ${new Date().toLocaleTimeString()}`,
                    name: name('group'),
                    ouId: ouId!,
                  },
                  groupId: createdGroup!,
                })
              }
            >
              Rename
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!createdGroup}
              onClick={() => void addMembers.mutate({groupId: createdGroup!, members: me('user')})}
            >
              Add me
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!createdGroup}
              onClick={() => void removeMembers.mutate({groupId: createdGroup!, members: me('user')})}
            >
              Remove me
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              data-variant="danger"
              disabled={!createdGroup}
              onClick={() => void deleteGroupCall.mutate(createdGroup!)}
            >
              Delete
            </button>
          </div>
          <dl className="pg-dl" style={{marginTop: 12}}>
            <MutationRow label="createGroup" mutation={createGroupCall} />
            <MutationRow label="updateGroup" mutation={updateGroupCall} />
            <MutationRow label="addGroupMembers" mutation={addMembers} />
            <MutationRow label="removeGroupMembers" mutation={removeMembers} />
            <MutationRow label="deleteGroup" mutation={deleteGroupCall} />
          </dl>
        </HookCard>
      </div>

      <div className="pg-section-label">Roles</div>
      <div className="pg-grid-2">
        <HookCard name="getRoles" signature="getRoles({...config, limit: 5})" query={roles} />
        <HookCard name="getRole" signature="getRole({...config, roleId})" query={role}>
          <IdInput label="roleId" value={roleInput} fallback={firstRole} onChange={setRoleInput} />
        </HookCard>
        <HookCard
          name="getRoleAssignments"
          signature="getRoleAssignments({...config, roleId, limit: 5})"
          query={assignments}
        />
        <HookCard
          name="Role mutations"
          signature="createRole · updateRole · addRoleAssignments · removeRoleAssignments · deleteRole"
          query={{data: createRoleCall.data ?? updateRoleCall.data, error: null, isLoading: false}}
          summary={
            writeBlocked
              ? `Writes are disabled: ${writeBlocked}.`
              : `Works on a temporary role${createdRole ? ` (${createdRole})` : ''}; delete it when done.`
          }
        >
          <div className="pg-row">
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!!writeBlocked || !!createdRole}
              onClick={() => void createRoleCall.mutate({name: name('role'), ouId: ouId!})}
            >
              Create
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!createdRole}
              onClick={() =>
                void updateRoleCall.mutate({
                  payload: {description: 'updated', name: name('role'), ouId: ouId!, permissions: []},
                  roleId: createdRole!,
                })
              }
            >
              Update
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!createdRole}
              onClick={() => void addAssignments.mutate({assignments: me('user'), roleId: createdRole!})}
            >
              Assign me
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!createdRole}
              onClick={() => void removeAssignments.mutate({assignments: me('user'), roleId: createdRole!})}
            >
              Unassign me
            </button>
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              data-variant="danger"
              disabled={!createdRole}
              onClick={() => void deleteRoleCall.mutate(createdRole!)}
            >
              Delete
            </button>
          </div>
          <dl className="pg-dl" style={{marginTop: 12}}>
            <MutationRow label="createRole" mutation={createRoleCall} />
            <MutationRow label="updateRole" mutation={updateRoleCall} />
            <MutationRow label="addRoleAssignments" mutation={addAssignments} />
            <MutationRow label="removeRoleAssignments" mutation={removeAssignments} />
            <MutationRow label="deleteRole" mutation={deleteRoleCall} />
          </dl>
        </HookCard>
      </div>

      <div className="pg-section-label">Users</div>
      <div className="pg-grid-2">
        <HookCard name="getUserGroups" signature="getUserGroups({...config, userId})" query={userGroups}>
          <IdInput
            label="userId"
            value={userInput}
            fallback={typeof sub === 'string' ? `${sub} (you)` : undefined}
            onChange={setUserInput}
          />
        </HookCard>
        <HookCard name="getUserTypes" signature="getUserTypes({...config, limit: 10})" query={userTypes} />
      </div>

      <div className="pg-section-label">Agents</div>
      <div className="pg-grid-2">
        <HookCard name="getAgentTypes" signature="getAgentTypes({...config, limit: 10})" query={agentTypes} />
        <HookCard name="getAgents" signature="getAgents({...config, limit: 5})" query={agents} />
        <HookCard name="getAgentGroups" signature="getAgentGroups({...config, agentId})" query={agentGroups}>
          <IdInput label="agentId" value={agentInput} fallback={firstAgent} onChange={setAgentInput} />
        </HookCard>
        <HookCard name="getAgentRoles" signature="getAgentRoles({...config, agentId})" query={agentRoles} />
      </div>
    </main>
  );
};

export default Hooks;
