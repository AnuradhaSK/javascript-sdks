// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDError} from '@thunderid/node';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import getAuthFlowsAction from '../../server/actions/getAuthFlowsAction';
import fetchAuthFlowsFromServer from '../fetchAuthFlowsFromServer';

vi.mock('../../server/actions/getAuthFlowsAction', () => ({default: vi.fn()}));

const request = {component: {} as never, limit: 30, offset: 60, signal: new AbortController().signal};

describe('fetchAuthFlowsFromServer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the normalized page the server action produced', async () => {
    const page = {nextOffset: null, options: [{label: 'Password login', value: 'flow-1'}], totalResults: 1};
    vi.mocked(getAuthFlowsAction).mockResolvedValue({page, success: true});

    await expect(fetchAuthFlowsFromServer(request)).resolves.toEqual(page);
  });

  it('forwards only paging — no signal, filter, session, or URL crosses to the server', async () => {
    vi.mocked(getAuthFlowsAction).mockResolvedValue({page: {nextOffset: null, options: []}, success: true});

    await fetchAuthFlowsFromServer({...request, filter: 'ignored'});

    expect(getAuthFlowsAction).toHaveBeenCalledWith({limit: 30, offset: 60});
  });

  it('re-throws the server message as an SDK error, so onError can report it', async () => {
    vi.mocked(getAuthFlowsAction).mockResolvedValue({
      message: 'Failed to load options.',
      success: false,
    });

    const thrown = await fetchAuthFlowsFromServer(request).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ThunderIDError);
    expect((thrown as Error).message).toBe('Failed to load options.');
  });
});
