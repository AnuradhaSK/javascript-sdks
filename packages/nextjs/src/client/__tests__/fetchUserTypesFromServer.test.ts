// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDError} from '@thunderid/node';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import getUserTypesAction from '../../server/actions/getUserTypesAction';
import fetchUserTypesFromServer from '../fetchUserTypesFromServer';

vi.mock('../../server/actions/getUserTypesAction', () => ({default: vi.fn()}));

const request = {component: {} as never, limit: 30, offset: 60, signal: new AbortController().signal};

describe('fetchUserTypesFromServer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the normalized page the server action produced', async () => {
    const page = {nextOffset: null, options: [{label: 'employee', value: 'employee'}], totalResults: 1};
    vi.mocked(getUserTypesAction).mockResolvedValue({page, success: true});

    await expect(fetchUserTypesFromServer(request)).resolves.toEqual(page);
  });

  it('forwards only paging — no signal, filter, session, or URL crosses to the server', async () => {
    vi.mocked(getUserTypesAction).mockResolvedValue({page: {nextOffset: null, options: []}, success: true});

    await fetchUserTypesFromServer({...request, filter: 'ignored'});

    expect(getUserTypesAction).toHaveBeenCalledWith({limit: 30, offset: 60});
  });

  it('re-throws the server message as an SDK error, so onError can report it', async () => {
    vi.mocked(getUserTypesAction).mockResolvedValue({
      message: 'Failed to load options.',
      success: false,
    });

    const thrown = await fetchUserTypesFromServer(request).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ThunderIDError);
    expect((thrown as Error).message).toBe('Failed to load options.');
  });
});
