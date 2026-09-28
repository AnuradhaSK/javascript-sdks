// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/typedef, sort-keys, @typescript-eslint/explicit-function-return-type */

import {ThunderIDAPIError, ThunderIDError} from '@thunderid/browser';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

import NuxtAPIRoutes from '../../src/runtime/constants/NuxtAPIRoutes';
import {fetchUsersFromServer} from '../../src/runtime/utils/fetchUsersFromServer';

const $fetch = vi.fn();
const request = {component: {} as never, limit: 30, offset: 60, signal: new AbortController().signal};

describe('fetchUsersFromServer', () => {
  beforeEach(() => {
    vi.stubGlobal('$fetch', $fetch);
    $fetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the users route with paging, filter and the abort signal, and returns the page', async () => {
    const page = {nextOffset: null, options: [{label: 'Jane Doe', value: 'user-1'}], totalResults: 1};
    $fetch.mockResolvedValue({page, success: true});

    const controller = new AbortController();
    await expect(
      fetchUsersFromServer({...request, filter: 'department eq "Engineering"', signal: controller.signal}),
    ).resolves.toEqual(page);

    expect($fetch).toHaveBeenCalledWith(NuxtAPIRoutes.USERS, {
      query: {filter: 'department eq "Engineering"', limit: 30, offset: 60},
      signal: controller.signal,
    });
  });

  it('re-throws the server message with its status as an API error, so onError can tell why', async () => {
    $fetch.mockResolvedValue({
      message: 'Failed to load options (HTTP 403).',
      statusCode: 403,
      success: false,
    });

    const thrown = await fetchUsersFromServer(request).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ThunderIDAPIError);
    expect(thrown).toMatchObject({code: 'users.get-Error-001', statusCode: 403});
  });

  it('re-throws the server message as an SDK error, so onError can report it', async () => {
    $fetch.mockResolvedValue({
      message: 'Failed to load options.',
      success: false,
    });

    const thrown = await fetchUsersFromServer(request).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ThunderIDError);
    expect((thrown as Error).message).toBe('Failed to load options.');
  });
});
