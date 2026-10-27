// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {act, cleanup, renderHook, waitFor} from '@testing-library/react';
import {
  Application,
  ApplicationListResponse,
  ApplicationQueryKeys,
  ApiFetcher,
  CreateApplicationRequest,
  ManagedUserListResponse,
  UpdateApplicationRequest,
  UserQueryKeys,
  createApplication,
  createResourceInvalidator,
  deleteAgent,
  getApplication,
  getApplications,
  getOrganizationUnitUsers,
  getUsers,
  updateApplication,
} from '@thunderid/browser';
import {ReactElement, ReactNode} from 'react';
import {afterEach, describe, expect, it, vi, type Mock} from 'vitest';
import ThunderIDContext, {ThunderIDContextProps} from '../../../contexts/ThunderID/ThunderIDContext';
import useManagementEndpoint, {ManagementEndpoint} from '../useManagementEndpoint';
import useManagementRequestConfig from '../useManagementRequestConfig';
import useResourceMutation, {ResourceMutationOptions, ResourceMutationResult} from '../useResourceMutation';
import useResourceQuery, {ResourceQueryOptions, ResourceQueryResult} from '../useResourceQuery';

type FetcherMock = Mock<ApiFetcher>;

const baseUrl = 'https://localhost:8090';

const jsonResponse = (body: unknown, status = 200): Response =>
  ({
    json: () => Promise.resolve(body),
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 404 ? 'Not Found' : 'OK',
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as Response;

const createFetcher = (body: unknown = {}, status = 200): FetcherMock =>
  vi.fn<ApiFetcher>().mockImplementation(() => Promise.resolve(jsonResponse(body, status)));

const createWrapper = ({
  fetcher,
  ...overrides
}: Partial<ThunderIDContextProps> & {fetcher?: ApiFetcher} = {}): ((props: {children: ReactNode}) => ReactElement) => {
  const value = {
    baseUrl,
    endpoints: undefined,
    http: {fetcher},
    instanceId: 0,
    invalidator: createResourceInvalidator(),
    ...overrides,
  } as unknown as ThunderIDContextProps;

  function Wrapper({children}: {children: ReactNode}): ReactElement {
    return <ThunderIDContext.Provider value={value}>{children}</ThunderIDContext.Provider>;
  }

  return Wrapper;
};

interface UpdateApplicationVariables {
  applicationId: string;
  data: UpdateApplicationRequest;
}

// The admin components call the management API functions through the generic query layer this way.
const useApplications = (limit?: number): ResourceQueryResult<ApplicationListResponse> => {
  const endpoint: ManagementEndpoint = useManagementEndpoint('applications');

  return useResourceQuery([ApplicationQueryKeys.APPLICATIONS, {limit}], (fetcher: ApiFetcher) =>
    getApplications({...endpoint, fetcher, limit}),
  );
};

const useApplication = (applicationId: string | undefined): ResourceQueryResult<Application> => {
  const endpoint: ManagementEndpoint = useManagementEndpoint('applications');

  return useResourceQuery(
    [ApplicationQueryKeys.APPLICATION, applicationId],
    (fetcher: ApiFetcher) => getApplication({...endpoint, applicationId: applicationId!, fetcher}),
    {enabled: Boolean(applicationId)},
  );
};

const useUsers = (options?: ResourceQueryOptions): ResourceQueryResult<ManagedUserListResponse> => {
  const endpoint: ManagementEndpoint = useManagementEndpoint('users');

  return useResourceQuery(
    [UserQueryKeys.USERS, {}],
    (fetcher: ApiFetcher) => getUsers({...endpoint, fetcher}),
    options,
  );
};

const useUpdateApplication = (
  options?: ResourceMutationOptions<Application, UpdateApplicationVariables>,
): ResourceMutationResult<Application, UpdateApplicationVariables> => {
  const endpoint: ManagementEndpoint = useManagementEndpoint('applications');

  return useResourceMutation(
    ({applicationId, data}: UpdateApplicationVariables, fetcher: ApiFetcher) =>
      updateApplication({...endpoint, applicationId, fetcher, payload: data}),
    ({applicationId}: UpdateApplicationVariables) => [
      [ApplicationQueryKeys.APPLICATION, applicationId],
      [ApplicationQueryKeys.APPLICATIONS],
    ],
    options,
  );
};

const useDeleteAgent = (options?: ResourceMutationOptions<void, string>): ResourceMutationResult<void, string> => {
  const endpoint: ManagementEndpoint = useManagementEndpoint('agents');

  return useResourceMutation(
    (agentId: string, fetcher: ApiFetcher) => deleteAgent({...endpoint, agentId, fetcher}),
    () => [],
    options,
  );
};

const useCreateApplication = (): ResourceMutationResult<Application, CreateApplicationRequest> => {
  const endpoint: ManagementEndpoint = useManagementEndpoint('applications');

  return useResourceMutation(
    (payload: CreateApplicationRequest, fetcher: ApiFetcher) => createApplication({...endpoint, fetcher, payload}),
    () => [[ApplicationQueryKeys.APPLICATIONS]],
  );
};

afterEach(() => {
  cleanup();
});

describe('useResourceQuery with the management API functions', () => {
  it('loads data through the provider fetcher', async () => {
    const page = {applications: [{id: 'app-1', name: 'App'}], count: 1, totalResults: 1};
    const fetcher: FetcherMock = createFetcher(page);

    const {result} = renderHook(() => useApplications(10), {wrapper: createWrapper({fetcher})});

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(page);
    expect(result.current.error).toBeNull();
    expect(fetcher.mock.calls[0][0]).toBe(`${baseUrl}/applications?limit=10`);
  });

  it('prefers a per-query fetcher over the provider fetcher', async () => {
    const providerFetcher: FetcherMock = createFetcher();
    const hookFetcher: FetcherMock = createFetcher({count: 0, startIndex: 1, totalResults: 0, users: []});

    const {result} = renderHook(() => useUsers({fetcher: hookFetcher}), {
      wrapper: createWrapper({fetcher: providerFetcher}),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(hookFetcher).toHaveBeenCalledOnce();
    expect(providerFetcher).not.toHaveBeenCalled();
  });

  it('targets the endpoints override when the provider sets one', async () => {
    const fetcher: FetcherMock = createFetcher({id: 'app-1'});

    const {result} = renderHook(() => useApplication('app-1'), {
      wrapper: createWrapper({endpoints: {applications: 'https://rs.example.com/applications'}, fetcher}),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetcher.mock.calls[0][0]).toBe('https://rs.example.com/applications/app-1');
  });

  it('exposes a failed request as an error with a distinct code', async () => {
    const fetcher: FetcherMock = createFetcher({}, 404);

    const {result} = renderHook(() => useApplication('missing'), {wrapper: createWrapper({fetcher})});

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toMatchObject({code: 'getApplication-NotFoundError-001'});
    expect(result.current.data).toBeUndefined();
  });

  it('does not fetch a single resource until its identifier is known', () => {
    const fetcher: FetcherMock = createFetcher();

    const {result} = renderHook(() => useApplication(undefined), {wrapper: createWrapper({fetcher})});

    expect(result.current.isLoading).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('useResourceMutation with the management API functions', () => {
  it('refetches matching queries after a successful mutation and calls onSuccess', async () => {
    const fetcher: FetcherMock = createFetcher({applications: [], count: 0, id: 'app-1', totalResults: 0});
    const onSuccess: Mock = vi.fn();
    const wrapper = createWrapper({fetcher});

    const {result} = renderHook(
      () => ({
        detail: useApplication('app-1'),
        list: useApplications(),
        otherDetail: useApplication('app-2'),
        update: useUpdateApplication({onSuccess}),
      }),
      {wrapper},
    );

    await waitFor(() => expect(result.current.list.isLoading).toBe(false));
    await waitFor(() => expect(result.current.otherDetail.isLoading).toBe(false));
    fetcher.mockClear();

    await act(async () => {
      await result.current.update.mutate({applicationId: 'app-1', data: {name: 'Renamed'}});
    });

    const urls: string[] = fetcher.mock.calls.map(([url]: [string, RequestInit]) => url);
    expect(urls).toContain(`${baseUrl}/applications/app-1`);
    expect(urls).toContain(`${baseUrl}/applications`);
    expect(urls).not.toContain(`${baseUrl}/applications/app-2`);
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({id: 'app-1'}), {
      applicationId: 'app-1',
      data: {name: 'Renamed'},
    });
  });

  it('never rejects from mutate, but rejects from mutateAsync', async () => {
    const fetcher: FetcherMock = createFetcher({}, 404);
    const onError: Mock = vi.fn();

    const {result} = renderHook(() => useDeleteAgent({onError}), {wrapper: createWrapper({fetcher})});

    await act(async () => {
      await expect(result.current.mutate('ag-1')).resolves.toBeUndefined();
    });
    expect(result.current.error).toMatchObject({code: 'deleteAgent-NotFoundError-001'});
    expect(onError).toHaveBeenCalledOnce();

    await act(async () => {
      await expect(result.current.mutateAsync('ag-1')).rejects.toMatchObject({code: 'deleteAgent-NotFoundError-001'});
    });

    act(() => result.current.reset());
    expect(result.current.error).toBeNull();
  });

  it('sends the create payload through the resolved fetcher', async () => {
    const fetcher: FetcherMock = createFetcher({id: 'new', name: 'App'});

    const {result} = renderHook(() => useCreateApplication(), {wrapper: createWrapper({fetcher})});

    await act(async () => {
      await result.current.mutateAsync({name: 'App'});
    });

    expect(result.current.data).toEqual({id: 'new', name: 'App'});
    expect(fetcher.mock.calls[0][1]).toMatchObject({body: '{"name":"App"}', method: 'POST'});
  });
});

describe('useManagementRequestConfig', () => {
  afterEach(() => {
    cleanup();
  });

  it('hands the API functions the provider base URL and fetcher', async () => {
    const fetcher: FetcherMock = createFetcher({applications: [], count: 0, totalResults: 0});
    const {result} = renderHook(() => useManagementRequestConfig('applications'), {wrapper: createWrapper({fetcher})});

    expect(result.current).toEqual({baseUrl, fetcher, url: undefined});

    await getApplications(result.current);

    expect(fetcher).toHaveBeenCalledWith(`${baseUrl}/applications`, expect.objectContaining({method: 'GET'}));
  });

  it('targets the endpoints override for its collection', () => {
    const {result} = renderHook(() => useManagementRequestConfig('applications'), {
      wrapper: createWrapper({
        endpoints: {applications: 'https://mgmt.example.com/api/applications'},
        fetcher: createFetcher(),
      }),
    });

    expect(result.current.url).toBe('https://mgmt.example.com/api/applications');
  });

  it('addresses the newer management collections through their endpoints overrides', async () => {
    const fetcher: FetcherMock = createFetcher({organizationUnits: []});
    const {result} = renderHook(() => useManagementRequestConfig('organizationUnits'), {
      wrapper: createWrapper({endpoints: {organizationUnits: 'https://mgmt.example.com/ous'}, fetcher}),
    });

    await getOrganizationUnitUsers({...result.current, path: 'engineering/platform'});

    expect(fetcher).toHaveBeenCalledWith(
      'https://mgmt.example.com/ous/tree/engineering/platform/users?include=display',
      expect.objectContaining({method: 'GET'}),
    );
  });

  it('keeps the same config across renders so it can sit in a dependency list', () => {
    const {result, rerender} = renderHook(() => useManagementRequestConfig('applications'), {
      wrapper: createWrapper({fetcher: createFetcher()}),
    });
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
