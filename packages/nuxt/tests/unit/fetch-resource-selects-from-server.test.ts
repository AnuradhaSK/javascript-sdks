// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/typedef, sort-keys, @typescript-eslint/explicit-function-return-type */

import {ThunderIDError} from '@thunderid/browser';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

import NuxtAPIRoutes from '../../src/runtime/constants/NuxtAPIRoutes';
import {fetchAuthFlowsFromServer} from '../../src/runtime/utils/fetchAuthFlowsFromServer';
import {fetchUserTypesFromServer} from '../../src/runtime/utils/fetchUserTypesFromServer';

const $fetch = vi.fn();
const request = {component: {} as never, limit: 30, offset: 60, signal: new AbortController().signal};

describe.each([
  {fetchFromServer: fetchAuthFlowsFromServer, name: 'fetchAuthFlowsFromServer', route: NuxtAPIRoutes.AUTH_FLOWS},
  {fetchFromServer: fetchUserTypesFromServer, name: 'fetchUserTypesFromServer', route: NuxtAPIRoutes.USER_TYPES},
])('$name', ({fetchFromServer, route}) => {
  beforeEach(() => {
    vi.stubGlobal('$fetch', $fetch);
    $fetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls its route with only paging and the abort signal, and returns the page', async () => {
    const page = {nextOffset: null, options: [{label: 'one', value: 'one'}], totalResults: 1};
    $fetch.mockResolvedValue({page, success: true});

    const controller = new AbortController();
    await expect(fetchFromServer({...request, filter: 'ignored', signal: controller.signal})).resolves.toEqual(page);

    expect($fetch).toHaveBeenCalledWith(route, {query: {limit: 30, offset: 60}, signal: controller.signal});
  });

  it('re-throws the server message as an SDK error, so onError can report it', async () => {
    $fetch.mockResolvedValue({
      message: 'Failed to load options.',
      success: false,
    });

    const thrown = await fetchFromServer(request).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ThunderIDError);
    expect((thrown as Error).message).toBe('Failed to load options.');
  });
});
