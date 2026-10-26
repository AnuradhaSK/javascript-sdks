// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getFlowMeta, ThunderIDAPIError} from '@thunderid/node';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import getClient from '../../../getClient';
import getFlowMetaAction from '../getFlowMetaAction';

vi.mock('../../../getClient', () => ({default: vi.fn()}));
vi.mock('@thunderid/node', async (importOriginal: () => Promise<Record<string, unknown>>) => ({
  ...(await importOriginal()),
  getFlowMeta: vi.fn(),
}));

const mockGetConfiguration = vi.fn();

const meta = {design: {}, i18n: {}} as unknown as Awaited<ReturnType<typeof getFlowMeta>>;

describe('getFlowMetaAction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getClient).mockReturnValue({
      getConfiguration: mockGetConfiguration,
    } as unknown as ReturnType<typeof getClient>);
  });

  it('returns an error result instead of throwing when no base URL is configured', async () => {
    mockGetConfiguration.mockResolvedValue({applicationId: 'app-1'});

    const result = await getFlowMetaAction();

    expect(result).toEqual({message: 'Failed to load flow metadata: no base URL is configured.', success: false});
    expect(getFlowMeta).not.toHaveBeenCalled();
  });

  it('fetches with an endpoints.flowMeta override even without a base URL', async () => {
    mockGetConfiguration.mockResolvedValue({endpoints: {flowMeta: 'https://rs.example.com/flow/meta'}});
    vi.mocked(getFlowMeta).mockResolvedValue(meta);

    await expect(getFlowMetaAction()).resolves.toEqual({meta, success: true});
    expect(getFlowMeta).toHaveBeenCalledWith(expect.objectContaining({url: 'https://rs.example.com/flow/meta'}));
  });

  it('returns the metadata for the configured application and requested language', async () => {
    mockGetConfiguration.mockResolvedValue({applicationId: 'app-1', baseUrl: 'https://localhost:8090'});
    vi.mocked(getFlowMeta).mockResolvedValue(meta);

    const result = await getFlowMetaAction({language: 'fr'});

    expect(result).toEqual({meta, success: true});
    expect(getFlowMeta).toHaveBeenCalledWith({
      baseUrl: 'https://localhost:8090',
      id: 'app-1',
      language: 'fr',
      type: 'APP',
      url: undefined,
    });
  });

  it('maps an API failure to a plain result with the status, without the upstream reply text', async () => {
    mockGetConfiguration.mockResolvedValue({baseUrl: 'https://localhost:8090'});
    vi.mocked(getFlowMeta).mockRejectedValue(
      new ThunderIDAPIError('upstream secret detail', 'getFlowMeta-ResponseError-001', 'javascript', 404),
    );

    await expect(getFlowMetaAction()).resolves.toEqual({
      message: 'Failed to load flow metadata (HTTP 404).',
      statusCode: 404,
      success: false,
    });
  });

  it('maps any other failure to a plain result', async () => {
    mockGetConfiguration.mockResolvedValue({baseUrl: 'https://localhost:8090'});
    vi.mocked(getFlowMeta).mockRejectedValue(new TypeError('fetch failed'));

    await expect(getFlowMetaAction()).resolves.toEqual({message: 'Failed to load flow metadata.', success: false});
  });
});
