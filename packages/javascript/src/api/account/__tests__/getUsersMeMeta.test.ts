// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, it, expect, vi} from 'vitest';
import getUsersMeMeta from '../getUsersMeMeta';
import ThunderIDAPIError from '../../../errors/ThunderIDAPIError';

describe('getUsersMeMeta', () => {
  it('fetches user schema metadata successfully with custom fetcher', async () => {
    const mockSchema = {
      schema: {
        givenName: {
          displayName: 'First Name',
          type: 'STRING',
          required: true,
        },
      },
    };

    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSchema,
    } as Response);

    const result = await getUsersMeMeta({
      baseUrl: 'https://api.example.com',
      fetcher: mockFetcher,
    });

    expect(mockFetcher).toHaveBeenCalledWith(
      'https://api.example.com/users/me/meta',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(result).toEqual(mockSchema);
  });

  it('throws ThunderIDAPIError for invalid URL', async () => {
    await expect(
      getUsersMeMeta({
        baseUrl: 'invalid-url',
        fetcher: vi.fn(),
      }),
    ).rejects.toThrow(ThunderIDAPIError);
  });

  it('throws ThunderIDAPIError when server returns non-ok response', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Server error',
    } as Response);

    await expect(
      getUsersMeMeta({
        baseUrl: 'https://api.example.com',
        fetcher: mockFetcher,
      }),
    ).rejects.toThrow(ThunderIDAPIError);
  });

  it('handles network failure', async () => {
    const mockFetcher = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      getUsersMeMeta({
        baseUrl: 'https://api.example.com',
        fetcher: mockFetcher,
      }),
    ).rejects.toThrow(ThunderIDAPIError);
  });
});
