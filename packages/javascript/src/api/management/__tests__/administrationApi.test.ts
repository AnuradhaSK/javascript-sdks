// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, it, expect, vi, type Mock} from 'vitest';
import AdministrationFlowError from '../../../errors/AdministrationFlowError';
import {ApiFetcher} from '../../../models/api';
import findAdministrationFlows from '../administration/findAdministrationFlows';
import getAgentType from '../agent-types/getAgentType';
import updateAgentType from '../agent-types/updateAgentType';
import regenerateAgentSecret from '../agents/regenerateAgentSecret';
import deleteApplication from '../applications/deleteApplication';
import previewCimdDocument from '../applications/previewCimdDocument';
import regenerateClientSecret from '../applications/regenerateClientSecret';
import regenerateFlowSecret from '../applications/regenerateFlowSecret';
import deleteGroup from '../groups/deleteGroup';
import removeGroupMembers from '../groups/removeGroupMembers';
import deleteRole from '../roles/deleteRole';
import removeRoleAssignments from '../roles/removeRoleAssignments';
import updateRole from '../roles/updateRole';
import createUserType from '../user-types/createUserType';
import deleteUserType from '../user-types/deleteUserType';
import getUserType from '../user-types/getUserType';
import updateUserType from '../user-types/updateUserType';
import deleteUser from '../users/deleteUser';
import getUserUsages from '../users/getUserUsages';
import updateUserCredentials from '../users/updateUserCredentials';

type FetcherMock = Mock<ApiFetcher>;

interface SentRequest {
  body: unknown;
  method: string | undefined;
  url: string;
}

const baseUrl = 'https://localhost:8090';

const respond = (body: unknown): Response =>
  ({
    json: () => Promise.resolve(body),
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as Response;

interface Server {
  /**
   * The `flow` server-config section: the configured handle for each operation.
   */
  config?: Record<string, {defaultHandle?: string}>;
  /**
   * The response of `POST /flow/execute`.
   */
  execution?: unknown;
  /**
   * The administration flows the listing returns.
   */
  flows?: {flowType: string; handle: string; id: string}[];
  /**
   * The response of any other request.
   */
  resource?: unknown;
}

/**
 * A fetcher that answers like the server: the flow configuration, the flow listing, flow execution, and
 * a resource for every other request.
 */
const createServer = ({config = {}, execution, flows = [], resource = {}}: Server = {}): FetcherMock =>
  vi.fn<ApiFetcher>((url: string) => {
    if (url === `${baseUrl}/server-config/flow`) {
      return Promise.resolve(respond({merged: config}));
    }
    if (url.startsWith(`${baseUrl}/flows?`)) {
      return Promise.resolve(respond({flows}));
    }
    if (url === `${baseUrl}/flow/execute`) {
      return Promise.resolve(respond(execution ?? {data: {additionalData: {}}, flowStatus: 'COMPLETE'}));
    }

    return Promise.resolve(respond(resource));
  });

const requests = (fetcher: FetcherMock): SentRequest[] =>
  fetcher.mock.calls.map(([url, init]: Parameters<ApiFetcher>) => ({
    body: init?.body ? (JSON.parse(init.body as string) as unknown) : undefined,
    method: init?.method,
    url,
  }));

const executions = (fetcher: FetcherMock): unknown[] =>
  requests(fetcher)
    .filter((request: SentRequest) => request.url === `${baseUrl}/flow/execute`)
    .map((request: SentRequest) => request.body);

const deletionFlow = {
  config: {userDeletionFlow: {defaultHandle: 'delete-user'}},
  flows: [{flowType: 'ADMINISTRATION', handle: 'delete-user', id: 'flow-1'}],
};

describe('management API additions', () => {
  it.each<[string, (fetcher: ApiFetcher) => Promise<unknown>, string, string, unknown]>([
    [
      'getUserUsages',
      (f) => getUserUsages({baseUrl, fetcher: f, userId: 'u-1'}),
      'GET',
      '/users/u-1/usages',
      undefined,
    ],
    [
      'updateUserCredentials',
      (f) => updateUserCredentials({baseUrl, fetcher: f, payload: {credentials: {password: 'p'}}, userId: 'u-1'}),
      'POST',
      '/users/u-1/update-credentials',
      {credentials: {password: 'p'}},
    ],
    [
      'getUserType',
      (f) => getUserType({baseUrl, fetcher: f, userTypeId: 't-1'}),
      'GET',
      '/user-types/t-1?include=display',
      undefined,
    ],
    [
      'createUserType',
      (f) =>
        createUserType({
          baseUrl,
          fetcher: f,
          payload: {displayName: 'Staff', handle: 'staff', ouId: 'ou-1', schema: {}},
        }),
      'POST',
      '/user-types',
      {displayName: 'Staff', handle: 'staff', ouId: 'ou-1', schema: {}},
    ],
    [
      'updateUserType',
      (f) =>
        updateUserType({
          baseUrl,
          fetcher: f,
          payload: {displayName: 'Staff', ouId: 'ou-1', schema: {}},
          userTypeId: 't-1',
        }),
      'PUT',
      '/user-types/t-1',
      {displayName: 'Staff', ouId: 'ou-1', schema: {}},
    ],
    [
      'deleteUserType',
      (f) => deleteUserType({baseUrl, fetcher: f, userTypeId: 't-1'}),
      'DELETE',
      '/user-types/t-1',
      undefined,
    ],
    [
      'getAgentType',
      (f) => getAgentType({agentTypeId: 'a-1', baseUrl, fetcher: f}),
      'GET',
      '/agent-types/a-1?include=display',
      undefined,
    ],
    [
      'updateAgentType',
      (f) =>
        updateAgentType({
          agentTypeId: 'a-1',
          baseUrl,
          fetcher: f,
          payload: {displayName: 'Bot', ouId: 'ou-1', schema: {}},
        }),
      'PUT',
      '/agent-types/a-1',
      {displayName: 'Bot', ouId: 'ou-1', schema: {}},
    ],
    [
      'previewCimdDocument',
      (f) => previewCimdDocument({baseUrl, clientId: 'https://client.example/cimd.json', fetcher: f}),
      'POST',
      '/cimd/preview',
      {clientId: 'https://client.example/cimd.json'},
    ],
    // The applications collection URL a caller passes does not move the preview endpoint.
    [
      'previewCimdDocument with an applications url',
      (f) =>
        previewCimdDocument({
          baseUrl,
          clientId: 'https://client.example/cimd.json',
          fetcher: f,
          url: 'https://rs.example.com/applications',
        }),
      'POST',
      '/cimd/preview',
      {clientId: 'https://client.example/cimd.json'},
    ],
  ])('%s calls the right endpoint', async (_name, run, method, path, body) => {
    const fetcher: FetcherMock = createServer();

    await run(fetcher);

    expect(requests(fetcher)).toEqual([{body, method, url: `${baseUrl}${path}`}]);
  });
});

describe('administration flows', () => {
  it('calls the API directly by default, without reading the flow configuration', async () => {
    const fetcher: FetcherMock = createServer(deletionFlow);

    await deleteUser({baseUrl, fetcher, userId: 'u-1'});

    expect(requests(fetcher).map((request: SentRequest) => `${request.method} ${request.url}`)).toEqual([
      `DELETE ${baseUrl}/users/u-1`,
    ]);
  });

  it('runs the configured flow in flow mode instead of calling the API', async () => {
    const fetcher: FetcherMock = createServer(deletionFlow);

    await deleteUser({administrationMode: 'flow', baseUrl, fetcher, userId: 'u-1'});

    expect(executions(fetcher)).toEqual([{flowId: 'flow-1', inputs: {subject: 'u-1'}}]);
    expect(requests(fetcher).some((request: SentRequest) => request.method === 'DELETE')).toBe(false);
  });

  it('calls the API directly in flow mode when no flow is configured', async () => {
    const fetcher: FetcherMock = createServer();

    await deleteGroup({administrationMode: 'flow', baseUrl, fetcher, groupId: 'g-1'});

    expect(executions(fetcher)).toEqual([]);
    expect(requests(fetcher).at(-1)).toMatchObject({method: 'DELETE', url: `${baseUrl}/groups/g-1`});
  });

  it('refuses when the configured flow no longer exists, rather than skipping the revocation', async () => {
    const fetcher: FetcherMock = createServer({config: {roleDeletionFlow: {defaultHandle: 'gone'}}});

    await expect(deleteRole({administrationMode: 'flow', baseUrl, fetcher, roleId: 'r-1'})).rejects.toBeInstanceOf(
      AdministrationFlowError,
    );
    expect(requests(fetcher).some((request: SentRequest) => request.method === 'DELETE')).toBe(false);
  });

  it("reports a refused step with the step's own code", async () => {
    const fetcher: FetcherMock = createServer({
      config: {applicationDeletionFlow: {defaultHandle: 'delete-app'}},
      execution: {error: {code: 'FLW-4001', message: {defaultValue: 'Not allowed'}}, flowStatus: 'ERROR'},
      flows: [{flowType: 'ADMINISTRATION', handle: 'delete-app', id: 'flow-2'}],
    });

    const error: unknown = await deleteApplication({
      administrationMode: 'flow',
      applicationId: 'app-1',
      baseUrl,
      fetcher,
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AdministrationFlowError);
    expect(error).toMatchObject({code: 'FLW-4001', flowError: {code: 'FLW-4001'}});
    expect((error as AdministrationFlowError).message).toContain('Not allowed');
  });

  it('refuses a flow that asks for more input', async () => {
    const fetcher: FetcherMock = createServer({...deletionFlow, execution: {flowStatus: 'INCOMPLETE'}});

    await expect(deleteUser({administrationMode: 'flow', baseUrl, fetcher, userId: 'u-1'})).rejects.toBeInstanceOf(
      AdministrationFlowError,
    );
  });

  it('needs the server URL to run a flow', async () => {
    const fetcher: FetcherMock = createServer(deletionFlow);

    await expect(
      deleteUser({administrationMode: 'flow', fetcher, url: `${baseUrl}/users`, userId: 'u-1'}),
    ).rejects.toMatchObject({code: 'resolveAdministrationFlowHandles-ValidationError-003'});
  });

  it('runs the removal flow once for each member, and for each assignee', async () => {
    const fetcher: FetcherMock = createServer({
      config: {
        groupMembershipRemovalFlow: {defaultHandle: 'remove-member'},
        roleAssignmentRemovalFlow: {defaultHandle: 'remove-assignment'},
      },
      flows: [
        {flowType: 'ADMINISTRATION', handle: 'remove-member', id: 'flow-m'},
        {flowType: 'ADMINISTRATION', handle: 'remove-assignment', id: 'flow-a'},
      ],
    });

    await removeGroupMembers({
      administrationMode: 'flow',
      baseUrl,
      fetcher,
      groupId: 'g-1',
      members: [
        {id: 'u-1', type: 'user'},
        {id: 'u-2', type: 'user'},
      ],
    });
    await removeRoleAssignments({
      administrationMode: 'flow',
      assignments: [{id: 'g-1', type: 'group'}],
      baseUrl,
      fetcher,
      roleId: 'r-1',
    });

    expect(
      requests(fetcher).find((request: SentRequest) => request.url.startsWith(`${baseUrl}/groups/g-1`)),
    ).toMatchObject({method: 'GET'});
    expect(executions(fetcher)).toEqual([
      {flowId: 'flow-m', inputs: {targetGroupId: 'g-1', targetMemberId: 'u-1'}},
      {flowId: 'flow-m', inputs: {targetGroupId: 'g-1', targetMemberId: 'u-2'}},
      {flowId: 'flow-a', inputs: {targetAssigneeId: 'g-1', targetRoleId: 'r-1'}},
    ]);
  });

  it('walks the flow listing page by page until the handle is found', async () => {
    const firstPage: {flowType: string; handle: string; id: string}[] = Array.from(
      {length: 100},
      (_, index: number) => ({
        flowType: 'ADMINISTRATION',
        handle: `flow-${index}`,
        id: `id-${index}`,
      }),
    );
    const fetcher: FetcherMock = vi.fn<ApiFetcher>((url: string) =>
      Promise.resolve(
        respond({
          flows: url.includes('offset=0') ? firstPage : [{flowType: 'ADMINISTRATION', handle: 'late', id: 'id-late'}],
        }),
      ),
    );

    const found: Record<string, {id: string}> = await findAdministrationFlows({baseUrl, fetcher}, ['late']);

    expect(found['late'].id).toBe('id-late');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe('updateRole in flow mode', () => {
  const role = {
    id: 'r-1',
    name: 'Viewer',
    ouId: 'ou-1',
    permissions: [{permissions: ['read', 'write'], resourceServerId: 'rs-1'}],
  };
  const flow = {
    config: {rolePermissionRemovalFlow: {defaultHandle: 'remove-permission'}},
    flows: [{flowType: 'ADMINISTRATION', handle: 'remove-permission', id: 'flow-p'}],
    resource: role,
  };

  it('saves directly when no permission is removed', async () => {
    const fetcher: FetcherMock = createServer(flow);

    await updateRole({
      administrationMode: 'flow',
      baseUrl,
      current: role,
      fetcher,
      payload: {...role, permissions: [{permissions: ['read', 'write', 'admin'], resourceServerId: 'rs-1'}]},
      roleId: 'r-1',
    });

    expect(executions(fetcher)).toEqual([]);
    expect(requests(fetcher).at(-1)).toMatchObject({method: 'PUT', url: `${baseUrl}/roles/r-1`});
  });

  it('runs the flow for a removed permission, after saving the other fields with the old permissions', async () => {
    const fetcher: FetcherMock = createServer(flow);
    const permissions = [{permissions: ['read'], resourceServerId: 'rs-1'}];

    const updated: unknown = await updateRole({
      administrationMode: 'flow',
      baseUrl,
      fetcher,
      payload: {name: 'Reader', ouId: 'ou-1', permissions},
      roleId: 'r-1',
    });

    const sent: SentRequest[] = requests(fetcher);
    const put: SentRequest | undefined = sent.find((request: SentRequest) => request.method === 'PUT');
    expect(sent[0]).toMatchObject({method: 'GET', url: `${baseUrl}/roles/r-1?include=display`});
    expect(put?.body).toEqual({name: 'Reader', ouId: 'ou-1', permissions: role.permissions});
    expect(executions(fetcher)).toEqual([
      {flowId: 'flow-p', inputs: {targetPermissions: JSON.stringify(permissions), targetRoleId: 'r-1'}},
    ]);
    expect(updated).toMatchObject({permissions});
  });
});

describe('secret regeneration', () => {
  const application = {
    createdAt: 'yesterday',
    id: 'app-1',
    inboundAuthConfig: [{config: {clientId: 'client', clientSecret: 'old'}, type: 'oauth2'}],
    name: 'Shop',
  };

  it('returns the secret a regeneration flow produced', async () => {
    const fetcher: FetcherMock = createServer({
      config: {secretRegenerationFlow: {defaultHandle: 'rotate'}},
      execution: {data: {additionalData: {clientSecret: 'from-flow'}}, flowStatus: 'COMPLETE'},
      flows: [{flowType: 'ADMINISTRATION', handle: 'rotate', id: 'flow-s'}],
    });

    await expect(
      regenerateClientSecret({administrationMode: 'flow', applicationId: 'app-1', baseUrl, fetcher}),
    ).resolves.toEqual({clientSecret: 'from-flow'});
  });

  it('refuses a regeneration flow that returns no secret', async () => {
    const fetcher: FetcherMock = createServer({
      config: {secretRegenerationFlow: {defaultHandle: 'rotate'}},
      flows: [{flowType: 'ADMINISTRATION', handle: 'rotate', id: 'flow-s'}],
    });

    await expect(
      regenerateClientSecret({administrationMode: 'flow', applicationId: 'app-1', baseUrl, fetcher}),
    ).rejects.toBeInstanceOf(AdministrationFlowError);
  });

  it('otherwise saves a newly generated client secret on the application', async () => {
    const fetcher: FetcherMock = createServer({resource: application});

    const {clientSecret} = await regenerateClientSecret({applicationId: 'app-1', baseUrl, fetcher});

    const put: SentRequest | undefined = requests(fetcher).find((request: SentRequest) => request.method === 'PUT');
    expect(clientSecret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(put?.body).toEqual({
      inboundAuthConfig: [{config: {clientId: 'client', clientSecret}, type: 'oauth2'}],
      name: 'Shop',
    });
  });

  it('refuses to regenerate a client secret for an application without an OAuth client', async () => {
    const fetcher: FetcherMock = createServer({resource: {id: 'app-1', inboundAuthConfig: [], name: 'Shop'}});

    await expect(regenerateClientSecret({applicationId: 'app-1', baseUrl, fetcher})).rejects.toMatchObject({
      code: 'regenerateClientSecret-ValidationError-001',
    });
    expect(requests(fetcher).some((request: SentRequest) => request.method === 'PUT')).toBe(false);
  });

  it('saves a newly generated flow secret on the application', async () => {
    const fetcher: FetcherMock = createServer({resource: application});

    const {flowSecret} = await regenerateFlowSecret({applicationId: 'app-1', baseUrl, fetcher});

    const put: SentRequest | undefined = requests(fetcher).find((request: SentRequest) => request.method === 'PUT');
    expect(put?.body).toMatchObject({flowSecret, name: 'Shop'});
    expect(put?.body).not.toHaveProperty('id');
  });

  it("saves a newly generated secret on the agent's OAuth client", async () => {
    const fetcher: FetcherMock = createServer({
      resource: {
        clientId: 'client',
        id: 'a-1',
        inboundAuthConfig: [{config: {grantTypes: ['client_credentials']}, type: 'oauth2'}],
        name: 'Bot',
        ouHandle: 'default',
        ouId: 'ou-1',
        type: 'bot',
      },
    });

    const {clientSecret} = await regenerateAgentSecret({agentId: 'a-1', baseUrl, fetcher});

    const put: SentRequest | undefined = requests(fetcher).find((request: SentRequest) => request.method === 'PUT');
    // The display-only organization unit handle stays out of the update.
    expect(put?.body).toEqual({
      delegated: false,
      inboundAuthConfig: [{config: {clientSecret, grantTypes: ['client_credentials']}, type: 'oauth2'}],
      name: 'Bot',
      ouId: 'ou-1',
      type: 'bot',
    });
  });

  // The server does not store the delegated flag, so the update restates it from the grant types.
  it('keeps a delegated agent held to the delegated grant rules', async () => {
    const fetcher: FetcherMock = createServer({
      resource: {
        id: 'a-1',
        inboundAuthConfig: [{config: {grantTypes: ['authorization_code', 'refresh_token']}, type: 'oauth2'}],
        name: 'Assistant',
        ouId: 'ou-1',
        type: 'bot',
      },
    });

    await regenerateAgentSecret({agentId: 'a-1', baseUrl, fetcher});

    const put: SentRequest | undefined = requests(fetcher).find((request: SentRequest) => request.method === 'PUT');
    expect(put?.body).toMatchObject({delegated: true});
  });

  it('refuses to regenerate the secret of an agent with no OAuth client', async () => {
    const fetcher: FetcherMock = createServer({resource: {id: 'a-1', name: 'Bot', ouId: 'ou-1', type: 'bot'}});

    await expect(regenerateAgentSecret({agentId: 'a-1', baseUrl, fetcher})).rejects.toMatchObject({
      code: 'regenerateAgentSecret-ValidationError-001',
    });
  });
});
