// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import {
  baseUrl,
  createFetcher,
  FetcherMock,
  itMapsForbiddenAndNotFound,
  itSendsRequests,
  requests,
} from './helpers/managementRequests';
import createOrganizationUnit from '../organization-units/createOrganizationUnit';
import deleteOrganizationUnit from '../organization-units/deleteOrganizationUnit';
import deleteOrganizationUnitByPath from '../organization-units/deleteOrganizationUnitByPath';
import getOrganizationUnit from '../organization-units/getOrganizationUnit';
import getOrganizationUnitByPath from '../organization-units/getOrganizationUnitByPath';
import getOrganizationUnitChildren from '../organization-units/getOrganizationUnitChildren';
import getOrganizationUnitGroups from '../organization-units/getOrganizationUnitGroups';
import getOrganizationUnitRoles from '../organization-units/getOrganizationUnitRoles';
import getOrganizationUnits from '../organization-units/getOrganizationUnits';
import getOrganizationUnitUsers from '../organization-units/getOrganizationUnitUsers';
import updateOrganizationUnit from '../organization-units/updateOrganizationUnit';
import updateOrganizationUnitByPath from '../organization-units/updateOrganizationUnitByPath';

const ou = {handle: 'platform', name: 'Platform', parent: 'ou-root'};

describe('organization units API', () => {
  itSendsRequests([
    [
      'getOrganizationUnits',
      (fetcher) => getOrganizationUnits({baseUrl, fetcher, filter: 'handle sw "eng"', limit: 5, offset: 10}),
      'GET',
      '/organization-units?filter=handle+sw+%22eng%22&limit=5&offset=10',
    ],
    [
      'getOrganizationUnit',
      (fetcher) => getOrganizationUnit({baseUrl, fetcher, ouId: 'ou 1'}),
      'GET',
      '/organization-units/ou%201',
    ],
    [
      'getOrganizationUnitByPath',
      (fetcher) => getOrganizationUnitByPath({baseUrl, fetcher, path: 'engineering/plat form'}),
      'GET',
      '/organization-units/tree/engineering/plat%20form',
    ],
    [
      'createOrganizationUnit',
      (fetcher) => createOrganizationUnit({baseUrl, fetcher, payload: ou}),
      'POST',
      '/organization-units',
      ou,
    ],
    [
      'updateOrganizationUnit',
      (fetcher) => updateOrganizationUnit({baseUrl, fetcher, ouId: 'ou-1', payload: ou}),
      'PUT',
      '/organization-units/ou-1',
      ou,
    ],
    [
      'updateOrganizationUnitByPath',
      (fetcher) =>
        updateOrganizationUnitByPath({
          baseUrl,
          fetcher,
          path: '/engineering/platform/',
          payload: {handle: 'platform', name: 'P'},
        }),
      'PUT',
      '/organization-units/tree/engineering/platform',
      {handle: 'platform', name: 'P'},
    ],
    [
      'deleteOrganizationUnit',
      (fetcher) => deleteOrganizationUnit({baseUrl, fetcher, ouId: 'ou-1'}),
      'DELETE',
      '/organization-units/ou-1',
    ],
    [
      'deleteOrganizationUnitByPath',
      (fetcher) => deleteOrganizationUnitByPath({baseUrl, fetcher, path: 'a/b?c'}),
      'DELETE',
      '/organization-units/tree/a/b%3Fc',
    ],
    [
      'getOrganizationUnitChildren by id',
      (fetcher) => getOrganizationUnitChildren({baseUrl, fetcher, filter: 'name eq "x"', limit: 2, ouId: 'ou-1'}),
      'GET',
      '/organization-units/ou-1/ous?filter=name+eq+%22x%22&limit=2',
    ],
    [
      'getOrganizationUnitChildren by path',
      (fetcher) => getOrganizationUnitChildren({baseUrl, fetcher, offset: 4, path: 'engineering/platform'}),
      'GET',
      '/organization-units/tree/engineering/platform/ous?offset=4',
    ],
    [
      'getOrganizationUnitUsers by id',
      (fetcher) => getOrganizationUnitUsers({baseUrl, fetcher, limit: 5, ouId: 'ou-1'}),
      'GET',
      '/organization-units/ou-1/users?include=display&limit=5',
    ],
    [
      'getOrganizationUnitUsers by path',
      (fetcher) => getOrganizationUnitUsers({baseUrl, fetcher, path: 'engineering/platform'}),
      'GET',
      '/organization-units/tree/engineering/platform/users?include=display',
    ],
    [
      'getOrganizationUnitGroups by id',
      (fetcher) => getOrganizationUnitGroups({baseUrl, fetcher, offset: 3, ouId: 'ou-1'}),
      'GET',
      '/organization-units/ou-1/groups?offset=3',
    ],
    [
      'getOrganizationUnitGroups by path',
      (fetcher) => getOrganizationUnitGroups({baseUrl, fetcher, path: 'engineering'}),
      'GET',
      '/organization-units/tree/engineering/groups',
    ],
    [
      'getOrganizationUnitRoles by id',
      (fetcher) => getOrganizationUnitRoles({baseUrl, fetcher, ouId: 'ou-1'}),
      'GET',
      '/organization-units/ou-1/roles',
    ],
    [
      'getOrganizationUnitRoles by path',
      (fetcher) => getOrganizationUnitRoles({baseUrl, fetcher, limit: 1, path: 'engineering/platform'}),
      'GET',
      '/organization-units/tree/engineering/platform/roles?limit=1',
    ],
  ]);

  itMapsForbiddenAndNotFound('getOrganizationUnitByPath', (fetcher) =>
    getOrganizationUnitByPath({baseUrl, fetcher, path: 'engineering'}),
  );

  it('uses the organizationUnits endpoint override as the collection URL', async () => {
    const fetcher: FetcherMock = createFetcher();

    await getOrganizationUnitUsers({
      baseUrl,
      fetcher,
      path: 'a/b',
      url: 'https://rs.example.com/api/organization-units/',
    });

    expect(requests(fetcher)[0].url).toBe(
      'https://rs.example.com/api/organization-units/tree/a/b/users?include=display',
    );
  });

  it('keeps the earlier children endpoint for organizationUnitId', async () => {
    const fetcher: FetcherMock = createFetcher({organizationUnits: []});

    await getOrganizationUnitChildren({baseUrl, fetcher, limit: 10, organizationUnitId: 'ou-1'});

    expect(requests(fetcher)[0].url).toBe(`${baseUrl}/api/server/v1/organization-units/ou-1/children?limit=10`);
  });

  it.each<[string, () => Promise<unknown>]>([
    ['an empty path', () => getOrganizationUnitByPath({baseUrl, fetcher: createFetcher(), path: '//'})],
    ['no organization unit', () => getOrganizationUnitRoles({baseUrl, fetcher: createFetcher()} as never)],
    ['no parent', () => getOrganizationUnitChildren({baseUrl, fetcher: createFetcher()})],
  ])('refuses %s before sending anything', async (_label: string, run: () => Promise<unknown>) => {
    await expect(run()).rejects.toMatchObject({code: expect.stringMatching(/-ValidationError-002$/) as string});
  });
});
