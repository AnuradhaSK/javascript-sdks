// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, renderHook} from '@testing-library/react';
import {ApiFetcher, EmbeddedFlowComponentType} from '@thunderid/browser';
import type {EmbeddedFlowComponent} from '@thunderid/browser';
import {ReactElement, ReactNode} from 'react';
import {afterEach, describe, expect, it, vi, type Mock} from 'vitest';
import ThunderIDContext, {ThunderIDContextProps} from '../../contexts/ThunderID/ThunderIDContext';
import useFetchAuthFlows from '../useFetchAuthFlows';
import useFetchUsers from '../useFetchUsers';
import useFetchUserTypes from '../useFetchUserTypes';

const baseUrl = 'https://localhost:8090';

const jsonResponse = (body: unknown): Response =>
  ({
    json: () => Promise.resolve(body),
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(''),
  }) as Response;

const createWrapper = (
  fetcher: Mock<ApiFetcher>,
  overrides: Partial<ThunderIDContextProps> = {},
): ((props: {children: ReactNode}) => ReactElement) => {
  const value = {
    baseUrl,
    endpoints: undefined,
    http: {fetcher},
    instanceId: 0,
    ...overrides,
  } as unknown as ThunderIDContextProps;

  function Wrapper({children}: {children: ReactNode}): ReactElement {
    return <ThunderIDContext.Provider value={value}>{children}</ThunderIDContext.Provider>;
  }

  return Wrapper;
};

const request = (overrides: Record<string, unknown> = {}) => ({
  component: {id: 'picker', type: EmbeddedFlowComponentType.UserSelect} as EmbeddedFlowComponent,
  limit: 30,
  offset: 60,
  signal: new AbortController().signal,
  ...overrides,
});

const usersPage = {count: 1, startIndex: 61, totalResults: 200, users: [{display: 'Ada Lovelace', id: 'user-1'}]};
const flowsPage = {
  count: 1,
  flows: [{activeVersion: 1, flowType: 'AUTHENTICATION', handle: 'password', id: 'flow-1', name: 'Password login'}],
  startIndex: 1,
  totalResults: 1,
};
const typesPage = {
  count: 1,
  startIndex: 1,
  totalResults: 1,
  types: [{displayName: 'Staff', handle: 'employee', id: 'type-1'}],
};

afterEach(cleanup);

describe('useFetchUsers', () => {
  it('asks the user directory for the requested page through the provider fetcher and returns options', async () => {
    const fetcher = vi.fn<ApiFetcher>().mockResolvedValue(jsonResponse(usersPage));
    const {result} = renderHook(() => useFetchUsers(), {wrapper: createWrapper(fetcher)});

    const controller = new AbortController();
    const page = await result.current(request({filter: 'department eq "Engineering"', signal: controller.signal}));

    const [url, init] = fetcher.mock.calls[0];
    expect(url).toContain(`${baseUrl}/users?`);
    expect(new URL(url).searchParams.get('limit')).toBe('30');
    expect(new URL(url).searchParams.get('offset')).toBe('60');
    expect(new URL(url).searchParams.get('filter')).toBe('department eq "Engineering"');
    expect(init.signal).toBe(controller.signal);
    expect(page).toMatchObject({nextOffset: 61, options: [{label: 'Ada Lovelace', value: 'user-1'}]});
  });

  it('uses the users endpoint override', async () => {
    const fetcher = vi.fn<ApiFetcher>().mockResolvedValue(jsonResponse(usersPage));
    const {result} = renderHook(() => useFetchUsers(), {
      wrapper: createWrapper(fetcher, {endpoints: {users: 'https://management.example/users'}} as never),
    });

    await result.current(request());

    expect(fetcher.mock.calls[0][0]).toContain('https://management.example/users?');
  });

  it('keeps the same function across renders, since a picker restarts its list when the loader changes', () => {
    const fetcher = vi.fn<ApiFetcher>();
    const {result, rerender} = renderHook(() => useFetchUsers(), {wrapper: createWrapper(fetcher)});
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});

describe('useFetchAuthFlows', () => {
  it('lists only authentication flows and shows each by its name', async () => {
    const fetcher = vi.fn<ApiFetcher>().mockResolvedValue(jsonResponse(flowsPage));
    const {result} = renderHook(() => useFetchAuthFlows(), {wrapper: createWrapper(fetcher)});

    const page = await result.current(request({offset: 0}));

    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(`${baseUrl}/flows`);
    expect(url.searchParams.get('flowType')).toBe('AUTHENTICATION');
    expect(page).toMatchObject({nextOffset: null, options: [{label: 'Password login', value: 'flow-1'}]});
  });

  it('never asks for more than the API serves in one page', async () => {
    const fetcher = vi.fn<ApiFetcher>().mockResolvedValue(jsonResponse(flowsPage));
    const {result} = renderHook(() => useFetchAuthFlows(), {wrapper: createWrapper(fetcher)});

    await result.current(request({limit: 500}));

    expect(new URL(fetcher.mock.calls[0][0]).searchParams.get('limit')).toBe('100');
  });
});

describe('useFetchUserTypes', () => {
  it('shows and submits each user type by its handle', async () => {
    const fetcher = vi.fn<ApiFetcher>().mockResolvedValue(jsonResponse(typesPage));
    const {result} = renderHook(() => useFetchUserTypes(), {wrapper: createWrapper(fetcher)});

    const page = await result.current(request({offset: 0}));

    expect(fetcher.mock.calls[0][0]).toContain(`${baseUrl}/user-types?`);
    expect(page).toMatchObject({nextOffset: null, options: [{label: 'employee', value: 'employee'}]});
  });

  it('never asks for more than the API serves in one page', async () => {
    const fetcher = vi.fn<ApiFetcher>().mockResolvedValue(jsonResponse(typesPage));
    const {result} = renderHook(() => useFetchUserTypes(), {wrapper: createWrapper(fetcher)});

    await result.current(request({limit: 500}));

    expect(new URL(fetcher.mock.calls[0][0]).searchParams.get('limit')).toBe('100');
  });
});
