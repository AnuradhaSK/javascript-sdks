// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it, vi} from 'vitest';
import {
  baseUrl,
  createFetcher,
  FetcherMock,
  itMapsForbiddenAndNotFound,
  itSendsRequests,
  requests,
  respond,
} from './helpers/managementRequests';
import {ApiFetcher} from '../../../models/api';
import createAction from '../resource-servers/createAction';
import createResource from '../resource-servers/createResource';
import createResourceServer from '../resource-servers/createResourceServer';
import deleteAction from '../resource-servers/deleteAction';
import deleteResource from '../resource-servers/deleteResource';
import deleteResourceServer from '../resource-servers/deleteResourceServer';
import getAction from '../resource-servers/getAction';
import getActions from '../resource-servers/getActions';
import getResource from '../resource-servers/getResource';
import getResources from '../resource-servers/getResources';
import getResourceServer from '../resource-servers/getResourceServer';
import getResourceServers from '../resource-servers/getResourceServers';
import updateAction from '../resource-servers/updateAction';
import updateResource from '../resource-servers/updateResource';
import updateResourceServer from '../resource-servers/updateResourceServer';

const rs = {identifier: 'https://api.example.com', name: 'Orders', ouId: 'ou-1'};
const resource = {handle: 'orders', name: 'Orders'};
const action = {handle: 'read', name: 'Read'};
const resourceServerId = 'rs-1';

describe('resource servers API', () => {
  itSendsRequests([
    [
      'getResourceServers',
      (fetcher) => getResourceServers({baseUrl, fetcher, limit: 5}),
      'GET',
      '/resource-servers?limit=5',
    ],
    [
      'getResourceServer',
      (fetcher) => getResourceServer({baseUrl, fetcher, resourceServerId}),
      'GET',
      '/resource-servers/rs-1',
    ],
    [
      'createResourceServer',
      (fetcher) => createResourceServer({baseUrl, fetcher, payload: rs}),
      'POST',
      '/resource-servers',
      rs,
    ],
    [
      'updateResourceServer',
      (fetcher) => updateResourceServer({baseUrl, fetcher, payload: rs, resourceServerId}),
      'PUT',
      '/resource-servers/rs-1',
      rs,
    ],
    [
      'deleteResourceServer',
      (fetcher) => deleteResourceServer({baseUrl, fetcher, resourceServerId}),
      'DELETE',
      '/resource-servers/rs-1',
    ],
    [
      'getResources',
      (fetcher) => getResources({baseUrl, fetcher, limit: 2, offset: 0, parentId: 'r-0', resourceServerId}),
      'GET',
      '/resource-servers/rs-1/resources?limit=2&offset=0&parentId=r-0',
    ],
    [
      'getResource',
      (fetcher) => getResource({baseUrl, fetcher, resourceId: 'r 1', resourceServerId}),
      'GET',
      '/resource-servers/rs-1/resources/r%201',
    ],
    [
      'createResource',
      (fetcher) => createResource({baseUrl, fetcher, payload: resource, resourceServerId}),
      'POST',
      '/resource-servers/rs-1/resources',
      resource,
    ],
    [
      'updateResource',
      (fetcher) => updateResource({baseUrl, fetcher, payload: {name: 'O'}, resourceId: 'r-1', resourceServerId}),
      'PUT',
      '/resource-servers/rs-1/resources/r-1',
      {name: 'O'},
    ],
    [
      'deleteResource',
      (fetcher) => deleteResource({baseUrl, fetcher, resourceId: 'r-1', resourceServerId}),
      'DELETE',
      '/resource-servers/rs-1/resources/r-1',
    ],
    [
      'getActions on the server',
      (fetcher) => getActions({baseUrl, fetcher, kind: 'tool', resourceServerId}),
      'GET',
      '/resource-servers/rs-1/actions?kind=tool',
    ],
    [
      'getActions on a resource',
      (fetcher) => getActions({baseUrl, fetcher, limit: 3, resourceId: 'r-1', resourceServerId}),
      'GET',
      '/resource-servers/rs-1/resources/r-1/actions?limit=3',
    ],
    [
      'getAction on the server',
      (fetcher) => getAction({actionId: 'a-1', baseUrl, fetcher, resourceServerId}),
      'GET',
      '/resource-servers/rs-1/actions/a-1',
    ],
    [
      'getAction on a resource',
      (fetcher) => getAction({actionId: 'a-1', baseUrl, fetcher, resourceId: 'r-1', resourceServerId}),
      'GET',
      '/resource-servers/rs-1/resources/r-1/actions/a-1',
    ],
    [
      'createAction on the server',
      (fetcher) => createAction({baseUrl, fetcher, payload: action, resourceServerId}),
      'POST',
      '/resource-servers/rs-1/actions',
      action,
    ],
    [
      'createAction on a resource',
      (fetcher) => createAction({baseUrl, fetcher, payload: action, resourceId: 'r-1', resourceServerId}),
      'POST',
      '/resource-servers/rs-1/resources/r-1/actions',
      action,
    ],
    [
      'updateAction on the server',
      (fetcher) => updateAction({actionId: 'a-1', baseUrl, fetcher, payload: {name: 'R'}, resourceServerId}),
      'PUT',
      '/resource-servers/rs-1/actions/a-1',
      {name: 'R'},
    ],
    [
      'updateAction on a resource',
      (fetcher) =>
        updateAction({actionId: 'a-1', baseUrl, fetcher, payload: {name: 'R'}, resourceId: 'r-1', resourceServerId}),
      'PUT',
      '/resource-servers/rs-1/resources/r-1/actions/a-1',
      {name: 'R'},
    ],
    [
      'deleteAction on the server',
      (fetcher) => deleteAction({actionId: 'a-1', baseUrl, fetcher, resourceServerId}),
      'DELETE',
      '/resource-servers/rs-1/actions/a-1',
    ],
    [
      'deleteAction on a resource',
      (fetcher) => deleteAction({actionId: 'a/1', baseUrl, fetcher, resourceId: 'r-1', resourceServerId}),
      'DELETE',
      '/resource-servers/rs-1/resources/r-1/actions/a%2F1',
    ],
  ]);

  itMapsForbiddenAndNotFound('getAction', (fetcher) =>
    getAction({actionId: 'a-1', baseUrl, fetcher, resourceServerId}),
  );

  it('uses the resourceServers endpoint override as the collection URL', async () => {
    const fetcher: FetcherMock = createFetcher();

    await getActions({
      baseUrl,
      fetcher,
      resourceId: 'r-1',
      resourceServerId,
      url: 'https://rs.example.com/resource-servers',
    });

    expect(requests(fetcher)[0].url).toBe('https://rs.example.com/resource-servers/rs-1/resources/r-1/actions');
  });
});

/**
 * A fetcher that answers like a server whose action deletion flow is `configured`, or unset.
 */
const createServer = (configured: boolean): FetcherMock =>
  vi.fn<ApiFetcher>((url: string) => {
    if (url === `${baseUrl}/server-config/flow`) {
      return Promise.resolve(
        respond({merged: configured ? {actionDeletionFlow: {defaultHandle: 'delete-action'}} : {}}),
      );
    }
    if (url.startsWith(`${baseUrl}/flows?`)) {
      return Promise.resolve(respond({flows: [{flowType: 'ADMINISTRATION', handle: 'delete-action', id: 'flow-1'}]}));
    }

    return Promise.resolve(respond({data: {additionalData: {}}, flowStatus: 'COMPLETE'}));
  });

describe('deleteAction in flow mode', () => {
  it.each<[string, string | undefined, Record<string, string>]>([
    ['on the server', undefined, {targetActionId: 'a-1', targetResourceServerId: 'rs-1'}],
    ['on a resource', 'r-1', {targetActionId: 'a-1', targetResourceId: 'r-1', targetResourceServerId: 'rs-1'}],
  ])('runs the action deletion flow for an action %s instead of the DELETE', async (_label, resourceId, inputs) => {
    const fetcher: FetcherMock = createServer(true);

    await deleteAction({actionId: 'a-1', administrationMode: 'flow', baseUrl, fetcher, resourceId, resourceServerId});

    const sent = requests(fetcher);
    expect(sent.find((request) => request.url === `${baseUrl}/flow/execute`)?.body).toEqual({flowId: 'flow-1', inputs});
    expect(sent.some((request) => request.method === 'DELETE')).toBe(false);
  });

  it('deletes the action directly when no flow is configured', async () => {
    const fetcher: FetcherMock = createServer(false);

    await deleteAction({
      actionId: 'a-1',
      administrationMode: 'flow',
      baseUrl,
      fetcher,
      resourceId: 'r-1',
      resourceServerId,
    });

    expect(requests(fetcher).map(({method, url}) => `${method} ${url}`)).toEqual([
      `GET ${baseUrl}/server-config/flow`,
      `DELETE ${baseUrl}/resource-servers/rs-1/resources/r-1/actions/a-1`,
    ]);
  });

  it('deletes the action directly in native mode, without reading the flow configuration', async () => {
    const fetcher: FetcherMock = createServer(true);

    await deleteAction({actionId: 'a-1', baseUrl, fetcher, resourceServerId});

    expect(requests(fetcher).map(({method, url}) => `${method} ${url}`)).toEqual([
      `DELETE ${baseUrl}/resource-servers/rs-1/actions/a-1`,
    ]);
  });

  it('refuses a blank action identifier before running a flow', async () => {
    const fetcher: FetcherMock = createServer(true);

    await expect(
      deleteAction({actionId: '', administrationMode: 'flow', baseUrl, fetcher, resourceServerId}),
    ).rejects.toMatchObject({code: 'deleteAction-ValidationError-002'});
    expect(fetcher).not.toHaveBeenCalled();
  });
});
