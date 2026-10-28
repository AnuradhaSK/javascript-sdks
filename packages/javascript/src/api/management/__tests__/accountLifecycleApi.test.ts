// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it, vi, type Mock} from 'vitest';
import {ApiFetcher} from '../../../models/api';
import runAccountLifecycleAction from '../administration/runAccountLifecycleAction';

type FetcherMock = Mock<ApiFetcher>;

const baseUrl = 'https://localhost:8090';

const respond = (body: unknown): Response =>
  ({
    json: () => Promise.resolve(body),
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as Response;

/**
 * A fetcher that configures one administration flow, `handle`, under `configKey`, and completes every
 * execution with the given data.
 */
const createServer = (configKey: string, handle: string, data: Record<string, string> = {}): FetcherMock =>
  vi.fn<ApiFetcher>((url: string) => {
    if (url === `${baseUrl}/server-config/flow`) {
      return Promise.resolve(respond({merged: {[configKey]: {defaultHandle: handle}}}));
    }
    if (url.startsWith(`${baseUrl}/flows?`)) {
      return Promise.resolve(respond({flows: [{flowType: 'ADMINISTRATION', handle, id: `id-${handle}`}]}));
    }

    return Promise.resolve(respond({data: {additionalData: data}, flowStatus: 'COMPLETE'}));
  });

const execution = (fetcher: FetcherMock): unknown => {
  const call: Parameters<ApiFetcher> | undefined = fetcher.mock.calls.find(
    ([url]: Parameters<ApiFetcher>) => url === `${baseUrl}/flow/execute`,
  );

  return call ? (JSON.parse(call[1]?.body as string) as unknown) : undefined;
};

describe('runAccountLifecycleAction', () => {
  it.each([
    ['user', 'suspend', 'userSuspendFlow'],
    ['user', 'unsuspend', 'userUnsuspendFlow'],
    ['user', 'unlock', 'userUnlockFlow'],
    ['agent', 'suspend', 'agentSuspendFlow'],
    ['agent', 'unsuspend', 'agentUnsuspendFlow'],
    ['agent', 'unlock', 'agentUnlockFlow'],
    ['application', 'suspend', 'applicationSuspendFlow'],
    ['application', 'unsuspend', 'applicationUnsuspendFlow'],
  ] as const)('runs the %s %s flow configured under %s', async (kind, action, configKey) => {
    const fetcher: FetcherMock = createServer(configKey, 'lifecycle');

    await runAccountLifecycleAction({action, baseUrl, fetcher, kind, subject: 's-1'});

    expect(execution(fetcher)).toEqual({flowId: 'id-lifecycle', inputs: {subject: 's-1'}});
  });

  it('passes the operator note and reports whether the notification was sent', async () => {
    const fetcher: FetcherMock = createServer('userSuspendFlow', 'suspend', {emailSent: 'false'});

    await expect(
      runAccountLifecycleAction({
        action: 'suspend',
        baseUrl,
        fetcher,
        kind: 'user',
        operatorNote: 'Ticket 4521',
        subject: 'u-1',
      }),
    ).resolves.toEqual({emailSent: false});
    expect(execution(fetcher)).toEqual({flowId: 'id-suspend', inputs: {operatorNote: 'Ticket 4521', subject: 'u-1'}});
  });

  it('fails with the operation error when no flow is configured', async () => {
    const fetcher: FetcherMock = vi.fn<ApiFetcher>(() => Promise.resolve(respond({merged: {}})));

    await expect(
      runAccountLifecycleAction({action: 'unlock', baseUrl, fetcher, kind: 'agent', subject: 'a-1'}),
    ).rejects.toMatchObject({code: 'unlockAgent-NotConfiguredError-001'});
  });

  it('refuses to unlock an application without calling the server', async () => {
    const fetcher: FetcherMock = vi.fn<ApiFetcher>();

    await expect(
      runAccountLifecycleAction({action: 'unlock', baseUrl, fetcher, kind: 'application', subject: 'app-1'}),
    ).rejects.toMatchObject({code: 'runAccountLifecycleAction-ValidationError-001'});
    expect(fetcher).not.toHaveBeenCalled();
  });
});
