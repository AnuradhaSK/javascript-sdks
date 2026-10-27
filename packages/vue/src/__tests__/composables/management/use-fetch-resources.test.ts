// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EmbeddedFlowComponentType, createHttpClientFetcher} from '@thunderid/browser';
import type {EmbeddedFlowComponent, FetchSelectPage} from '@thunderid/browser';
import {mount} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi, type Mock} from 'vitest';
import {defineComponent, h} from 'vue';
import useFetchAuthFlows from '../../../composables/auth/useFetchAuthFlows';
import useFetchUsers from '../../../composables/management/useFetchUsers';
import useFetchUserTypes from '../../../composables/management/useFetchUserTypes';
import {THUNDERID_KEY} from '../../../keys';

vi.mock('@thunderid/browser', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/browser')>()),
  createHttpClientFetcher: vi.fn(),
}));

const baseUrl = 'https://localhost:8090';

const jsonResponse = (body: unknown): Response =>
  ({
    json: () => Promise.resolve(body),
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(''),
  }) as Response;

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

const mounted: {unmount: () => void}[] = [];

/** Runs a composable inside a component that has the ThunderID context, and returns what it gave back. */
const useInContext = <T>(composable: () => T, context: Record<string, unknown> = {}): T => {
  let result!: T;
  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable();

        return () => h('div');
      },
    }),
    {global: {provide: {[THUNDERID_KEY as symbol]: {baseUrl, endpoints: undefined, instanceId: 0, ...context}}}},
  );
  mounted.push(wrapper);

  return result;
};

describe('the management fetch composables (vue)', () => {
  let fetcher: Mock<(url: string, init: RequestInit) => Promise<Response>>;

  beforeEach(() => {
    fetcher = vi.fn<(url: string, init: RequestInit) => Promise<Response>>();
    vi.mocked(createHttpClientFetcher).mockReturnValue(fetcher as never);
  });

  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
    vi.mocked(createHttpClientFetcher).mockReset();
  });

  describe.each([
    {body: usersPage, name: 'useFetchUsers', use: useFetchUsers},
    {body: flowsPage, name: 'useFetchAuthFlows', use: useFetchAuthFlows},
    {body: typesPage, name: 'useFetchUserTypes', use: useFetchUserTypes},
  ] as {body: unknown; name: string; use: () => FetchSelectPage}[])('$name', ({body, use}) => {
    it('uses the HTTP client of the provider instance, not always instance 0', async () => {
      fetcher.mockResolvedValue(jsonResponse(body));
      const load = useInContext(use, {instanceId: 3});

      await load(request());

      expect(createHttpClientFetcher).toHaveBeenCalledWith(3);
    });

    it('passes the abort signal to the request', async () => {
      fetcher.mockResolvedValue(jsonResponse(body));
      const load = useInContext(use);
      const controller = new AbortController();

      await load(request({signal: controller.signal}));

      expect(fetcher.mock.calls[0][1]?.signal).toBe(controller.signal);
    });
  });

  it.each([
    {body: flowsPage, name: 'useFetchAuthFlows', use: useFetchAuthFlows},
    {body: typesPage, name: 'useFetchUserTypes', use: useFetchUserTypes},
  ] as {body: unknown; name: string; use: () => FetchSelectPage}[])(
    '$name never asks for more than the API serves in one page',
    async ({body, use}) => {
      fetcher.mockResolvedValue(jsonResponse(body));
      const load = useInContext(use);

      await load(request({limit: 500}));

      expect(new URL(fetcher.mock.calls[0][0]).searchParams.get('limit')).toBe('100');
    },
  );

  it('useFetchUsers returns options and the next offset from the directory page', async () => {
    fetcher.mockResolvedValue(jsonResponse(usersPage));
    const load = useInContext(useFetchUsers);

    const page = await load(request({filter: 'department eq "Engineering"'}));

    expect(new URL(fetcher.mock.calls[0][0]).searchParams.get('filter')).toBe('department eq "Engineering"');
    expect(page).toMatchObject({nextOffset: 61, options: [{label: 'Ada Lovelace', value: 'user-1'}]});
  });

  it('useFetchAuthFlows lists only authentication flows', async () => {
    fetcher.mockResolvedValue(jsonResponse(flowsPage));
    const load = useInContext(useFetchAuthFlows);

    await load(request());

    expect(new URL(fetcher.mock.calls[0][0]).searchParams.get('flowType')).toBe('AUTHENTICATION');
  });

  it('useFetchUserTypes shows and submits each type by its handle', async () => {
    fetcher.mockResolvedValue(jsonResponse(typesPage));
    const load = useInContext(useFetchUserTypes);

    const page = await load(request());

    expect(page).toMatchObject({options: [{label: 'employee', value: 'employee'}]});
  });

  it('uses the endpoint override of the provider', async () => {
    fetcher.mockResolvedValue(jsonResponse(usersPage));
    const load = useInContext(useFetchUsers, {endpoints: {users: 'https://management.example/users'}});

    await load(request());

    expect(fetcher.mock.calls[0][0]).toContain('https://management.example/users?');
  });
});
