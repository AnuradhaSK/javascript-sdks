// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render} from '@testing-library/react';
import {FetchAuthFlows, FetchUsers, FetchUserTypes} from '@thunderid/browser';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import InviteUser from '../InviteUser';

const mocks = vi.hoisted(() => ({
  baseProps: {} as {fetchAuthFlows?: FetchAuthFlows; fetchUsers?: FetchUsers; fetchUserTypes?: FetchUserTypes},
  getFlows: vi.fn(),
  getUserTypes: vi.fn(),
  getUsers: vi.fn(),
  thunderID: {
    baseUrl: 'https://thunder.example',
    endpoints: undefined as {users?: string} | undefined,
    getAccessToken: vi.fn(),
    http: {request: vi.fn()},
    isInitialized: true,
  },
}));

vi.mock('../BaseInviteUser', () => ({
  default: (props: {
    fetchAuthFlows?: FetchAuthFlows;
    fetchUsers?: FetchUsers;
    fetchUserTypes?: FetchUserTypes;
  }): null => {
    mocks.baseProps = props;
    return null;
  },
}));
vi.mock('@thunderid/browser', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/browser')>()),
  getFlows: mocks.getFlows,
  getUserTypes: mocks.getUserTypes,
  getUsers: mocks.getUsers,
}));
vi.mock('../../../../../contexts/ThunderID/useThunderID', () => ({default: () => mocks.thunderID}));

const usersResponse = {
  count: 2,
  links: [],
  startIndex: 31,
  totalResults: 75,
  users: [
    {display: 'Ada Lovelace', id: 'user-1'},
    {display: 'Grace Hopper', id: 'user-2'},
  ],
};

const flowsResponse = {
  count: 2,
  flows: [
    {handle: 'password', id: 'flow-1', name: 'Password login'},
    {handle: 'passkey', id: 'flow-2', name: 'Passkey login'},
  ],
  startIndex: 31,
  totalResults: 75,
};

const userTypesResponse = {
  count: 2,
  startIndex: 31,
  totalResults: 75,
  types: [
    {displayName: 'Staff', handle: 'employee', id: 'type-1'},
    {displayName: 'Staff', handle: 'contractor', id: 'type-2'},
  ],
};

const request = (overrides: Record<string, unknown> = {}) => ({
  component: {id: 'picker_input', type: 'AUTH_FLOW_SELECT'} as never,
  limit: 30,
  offset: 30,
  signal: new AbortController().signal,
  ...overrides,
});

describe('InviteUser AUTH_FLOW_SELECT and USER_TYPE_SELECT data sources', () => {
  beforeEach(() => {
    mocks.baseProps = {};
    mocks.thunderID.endpoints = undefined;
    mocks.getFlows.mockReset().mockResolvedValue(flowsResponse);
    mocks.getUserTypes.mockReset().mockResolvedValue(userTypesResponse);
  });

  it('hands BaseInviteUser a data source for each picker type', () => {
    render(<InviteUser />);

    expect(mocks.baseProps.fetchAuthFlows).toBeTypeOf('function');
    expect(mocks.baseProps.fetchUserTypes).toBeTypeOf('function');
  });

  it('lists only authentication flows and turns the response into a picker page', async () => {
    render(<InviteUser />);
    const req = request();

    const page = await mocks.baseProps.fetchAuthFlows!(req);

    expect(mocks.getFlows).toHaveBeenCalledWith({
      baseUrl: 'https://thunder.example',
      fetcher: expect.any(Function) as unknown,
      flowType: 'AUTHENTICATION',
      limit: 30,
      offset: 30,
      signal: req.signal,
      url: undefined,
    });
    expect(page.nextOffset).toBe(32);
    expect(page.options).toEqual([
      {label: 'Password login', value: 'flow-1'},
      {label: 'Passkey login', value: 'flow-2'},
    ]);
  });

  it('lists user types and shows and submits their handle', async () => {
    render(<InviteUser />);
    const req = request({component: {id: 'picker_input', type: 'USER_TYPE_SELECT'}});

    const page = await mocks.baseProps.fetchUserTypes!(req);

    expect(mocks.getUserTypes).toHaveBeenCalledWith({
      baseUrl: 'https://thunder.example',
      fetcher: expect.any(Function) as unknown,
      limit: 30,
      offset: 30,
      signal: req.signal,
      url: undefined,
    });
    expect(page.options).toEqual([
      {label: 'employee', value: 'employee'},
      {label: 'contractor', value: 'contractor'},
    ]);
  });

  it('caps the page size at what the backend serves', async () => {
    render(<InviteUser />);

    await mocks.baseProps.fetchAuthFlows!(request({limit: 500}));
    await mocks.baseProps.fetchUserTypes!(request({limit: 500}));

    expect(mocks.getFlows).toHaveBeenCalledWith(expect.objectContaining({limit: 100}));
    expect(mocks.getUserTypes).toHaveBeenCalledWith(expect.objectContaining({limit: 100}));
  });

  it('honors the `flows` and `userTypes` endpoint overrides', async () => {
    mocks.thunderID.endpoints = {
      flows: 'https://resources.example/flows',
      userTypes: 'https://resources.example/user-types',
    } as never;
    render(<InviteUser />);

    await mocks.baseProps.fetchAuthFlows!(request());
    await mocks.baseProps.fetchUserTypes!(request());

    expect(mocks.getFlows).toHaveBeenCalledWith(expect.objectContaining({url: 'https://resources.example/flows'}));
    expect(mocks.getUserTypes).toHaveBeenCalledWith(
      expect.objectContaining({url: 'https://resources.example/user-types'}),
    );
  });

  it('keeps the same data sources across re-renders so an open picker keeps its list', () => {
    const {rerender} = render(<InviteUser />);
    const flows = mocks.baseProps.fetchAuthFlows;
    const types = mocks.baseProps.fetchUserTypes;

    rerender(<InviteUser />);

    expect(mocks.baseProps.fetchAuthFlows).toBe(flows);
    expect(mocks.baseProps.fetchUserTypes).toBe(types);
  });
});

describe('InviteUser USER_SELECT data source', () => {
  beforeEach(() => {
    mocks.baseProps = {};
    mocks.thunderID.endpoints = undefined;
    mocks.getUsers.mockReset().mockResolvedValue(usersResponse);
    mocks.getFlows.mockReset().mockResolvedValue(flowsResponse);
    mocks.getUserTypes.mockReset().mockResolvedValue(userTypesResponse);
  });

  it('hands BaseInviteUser a data source for USER_SELECT fields', () => {
    render(<InviteUser />);

    expect(mocks.baseProps.fetchUsers).toBeTypeOf('function');
  });

  it('pages the user directory from the base URL and turns the response into a picker page', async () => {
    render(<InviteUser />);
    const signal = new AbortController().signal;

    const page = await mocks.baseProps.fetchUsers!({
      component: {id: 'owner_input', type: 'USER_SELECT'},
      filter: undefined,
      limit: 30,
      offset: 30,
      signal,
    });

    const anyFetcher: unknown = expect.any(Function);
    expect(mocks.getUsers).toHaveBeenCalledWith({
      baseUrl: 'https://thunder.example',
      fetcher: anyFetcher,
      filter: undefined,
      limit: 30,
      offset: 30,
      signal,
      url: undefined,
    });
    expect(page.nextOffset).toBe(32);
    expect(page.totalResults).toBe(75);
    expect(page.options).toEqual([
      {label: 'Ada Lovelace', value: 'user-1'},
      {label: 'Grace Hopper', value: 'user-2'},
    ]);
  });

  it('honors the `users` endpoint override', async () => {
    mocks.thunderID.endpoints = {users: 'https://resources.example/users'};
    render(<InviteUser />);

    await mocks.baseProps.fetchUsers!({
      component: {id: 'owner_input', type: 'USER_SELECT'},
      limit: 30,
      offset: 0,
      signal: new AbortController().signal,
    });

    expect(mocks.getUsers).toHaveBeenCalledWith(expect.objectContaining({url: 'https://resources.example/users'}));
  });

  it('keeps the same data source across re-renders so an open picker keeps its list', () => {
    mocks.thunderID.endpoints = {users: 'https://resources.example/users'};
    const {rerender} = render(<InviteUser />);
    const first = mocks.baseProps.fetchUsers;

    mocks.thunderID.endpoints = {users: 'https://resources.example/users'};
    rerender(<InviteUser />);

    expect(mocks.baseProps.fetchUsers).toBe(first);
  });
});
