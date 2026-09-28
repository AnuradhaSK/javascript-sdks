// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {FetchAuthFlows, FetchUserTypes} from '@thunderid/browser';
import {mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import InviteUser from '../../components/presentation/invite-user/InviteUser';

const mocks = vi.hoisted(() => ({
  baseProps: {} as {fetchAuthFlows?: FetchAuthFlows; fetchUserTypes?: FetchUserTypes},
  getFlows: vi.fn(),
  getUserTypes: vi.fn(),
  thunderID: {
    baseUrl: 'https://thunder.example',
    endpoints: undefined as {flows?: string; userTypes?: string} | undefined,
    http: {request: vi.fn()},
    isInitialized: {value: true},
  },
}));

// A stand-in for BaseInviteUser that records what InviteUser hands it, so this file tests only
// InviteUser's own job: building the default data sources for AUTH_FLOW_SELECT and USER_TYPE_SELECT fields.
vi.mock('../../components/presentation/invite-user/BaseInviteUser', async () => {
  const {defineComponent: define, h: render} = await import('vue');
  return {
    default: define({
      name: 'BaseInviteUser',
      props: {
        fetchAuthFlows: {default: undefined, type: Function},
        fetchUserTypes: {default: undefined, type: Function},
      },
      setup(props: {fetchAuthFlows?: FetchAuthFlows; fetchUserTypes?: FetchUserTypes}) {
        mocks.baseProps = props;
        return () => render('div');
      },
    }),
  };
});
vi.mock('@thunderid/browser', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/browser')>()),
  getFlows: mocks.getFlows,
  getUserTypes: mocks.getUserTypes,
}));
vi.mock('../../composables/useThunderID', () => ({default: () => mocks.thunderID}));

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

describe('InviteUser AUTH_FLOW_SELECT and USER_TYPE_SELECT data sources (vue)', () => {
  beforeEach(() => {
    mocks.baseProps = {};
    mocks.thunderID.endpoints = undefined;
    mocks.getFlows.mockReset().mockResolvedValue(flowsResponse);
    mocks.getUserTypes.mockReset().mockResolvedValue(userTypesResponse);
  });

  it('hands BaseInviteUser a data source for each picker type', () => {
    mount(InviteUser);

    expect(mocks.baseProps.fetchAuthFlows).toBeTypeOf('function');
    expect(mocks.baseProps.fetchUserTypes).toBeTypeOf('function');
  });

  it('lists only authentication flows and turns the response into a picker page', async () => {
    mount(InviteUser);
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
    mount(InviteUser);
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
    mount(InviteUser);

    await mocks.baseProps.fetchAuthFlows!(request({limit: 500}));
    await mocks.baseProps.fetchUserTypes!(request({limit: 500}));

    expect(mocks.getFlows).toHaveBeenCalledWith(expect.objectContaining({limit: 100}));
    expect(mocks.getUserTypes).toHaveBeenCalledWith(expect.objectContaining({limit: 100}));
  });

  it('honors the `flows` and `userTypes` endpoint overrides', async () => {
    mocks.thunderID.endpoints = {
      flows: 'https://resources.example/flows',
      userTypes: 'https://resources.example/user-types',
    };
    mount(InviteUser);

    await mocks.baseProps.fetchAuthFlows!(request());
    await mocks.baseProps.fetchUserTypes!(request());

    expect(mocks.getFlows).toHaveBeenCalledWith(expect.objectContaining({url: 'https://resources.example/flows'}));
    expect(mocks.getUserTypes).toHaveBeenCalledWith(
      expect.objectContaining({url: 'https://resources.example/user-types'}),
    );
  });
});
