// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError, ThunderIDError, ThunderIDRuntimeError} from '@thunderid/node';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import getUsersAction from '../../server/actions/management/getUsersAction';
import fetchUsersFromServer from '../fetchUsersFromServer';

vi.mock('../../server/actions/management/getUsersAction', () => ({default: vi.fn()}));

const request = {component: {} as never, limit: 30, offset: 60, signal: new AbortController().signal};

describe('fetchUsersFromServer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the normalized page the server action produced', async () => {
    const page = {nextOffset: null, options: [{label: 'Jane Doe', value: 'user-1'}], totalResults: 1};
    vi.mocked(getUsersAction).mockResolvedValue({page, success: true});

    await expect(fetchUsersFromServer(request)).resolves.toEqual(page);
  });

  it('forwards only paging and filter — no signal, session, or URL crosses to the server', async () => {
    vi.mocked(getUsersAction).mockResolvedValue({page: {nextOffset: null, options: []}, success: true});

    await fetchUsersFromServer({...request, filter: 'department eq "Engineering"'});

    expect(getUsersAction).toHaveBeenCalledWith({filter: 'department eq "Engineering"', limit: 30, offset: 60});
  });

  it('re-throws the server message with its status as an API error, so onError can tell why', async () => {
    vi.mocked(getUsersAction).mockResolvedValue({
      message: 'Failed to load options (HTTP 403).',
      statusCode: 403,
      success: false,
    });

    const thrown = await fetchUsersFromServer(request).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ThunderIDAPIError);
    expect(thrown).toMatchObject({code: 'getUsersAction-Error-001', statusCode: 403});
  });

  it('re-throws the server message without a status as a runtime error', async () => {
    vi.mocked(getUsersAction).mockResolvedValue({
      message: 'Failed to load options.',
      success: false,
    });

    const thrown = await fetchUsersFromServer(request).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ThunderIDRuntimeError);
  });

  it('re-throws the server message as an SDK error, so onError can report it', async () => {
    vi.mocked(getUsersAction).mockResolvedValue({
      message: 'Failed to load options.',
      success: false,
    });

    const thrown = await fetchUsersFromServer(request).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ThunderIDError);
    expect((thrown as Error).message).toBe('Failed to load options.');
  });
});
