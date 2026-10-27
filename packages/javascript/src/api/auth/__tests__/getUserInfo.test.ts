// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, it, expect, vi, beforeEach} from 'vitest';
import ThunderIDAPIError from '../../../errors/ThunderIDAPIError';
import {User} from '../../../models/user';
import getUserInfo from '../getUserInfo';

describe('getUserInfo', (): void => {
  beforeEach((): void => {
    vi.resetAllMocks();
  });

  it('should fetch user info successfully', async (): Promise<void> => {
    const mockUserInfo: User = {
      email: 'test@example.com',
      groups: ['group1'],
      id: 'test-id',
      name: 'Test User',
      roles: ['user'],
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockUserInfo),
      ok: true,
    });

    const url = 'https://localhost:8090/oauth2/userinfo';
    const result: User = await getUserInfo({url});

    expect(fetch).toHaveBeenCalledWith(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    expect(result).toEqual({
      email: 'test@example.com',
      groups: ['group1'],
      id: 'test-id',
      name: 'Test User',
      roles: ['user'],
    });
  });

  it('should handle missing optional fields', async (): Promise<void> => {
    const mockUserInfo: User = {
      email: 'test@example.com',
      id: 'test-id',
      name: 'Test User',
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockUserInfo),
      ok: true,
    });

    const url = 'https://localhost:8090/oauth2/userinfo';
    const result: User = await getUserInfo({url});

    expect(result).toEqual({
      email: 'test@example.com',
      id: 'test-id',
      name: 'Test User',
    });
  });

  it('should throw ThunderIDAPIError on fetch failure', async (): Promise<void> => {
    const errorText = 'Failed to fetch';

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve(errorText),
    });

    const url = 'https://localhost:8090/oauth2/userinfo';

    await expect(getUserInfo({url})).rejects.toThrow(ThunderIDAPIError);
    await expect(getUserInfo({url})).rejects.toThrow(`Failed to fetch user info: ${errorText}`);

    const error: ThunderIDAPIError = await getUserInfo({url}).catch((e: ThunderIDAPIError) => e);

    expect(error.code).toBe('getUserInfo-ResponseError-001');
    expect(error.name).toBe('ThunderIDAPIError');
  });

  it('should throw ThunderIDAPIError for invalid URL', async (): Promise<void> => {
    const invalidUrl = 'not-a-valid-url';

    await expect(getUserInfo({url: invalidUrl})).rejects.toThrow(ThunderIDAPIError);

    const error: ThunderIDAPIError = await getUserInfo({url: invalidUrl}).catch((e: ThunderIDAPIError) => e);

    expect(error.message).toBe('Invalid endpoint URL provided');
    expect(error.code).toBe('getUserInfo-ValidationError-001');
    expect(error.name).toBe('ThunderIDAPIError');
  });

  it('should throw ThunderIDAPIError for undefined URL', async (): Promise<void> => {
    await expect(getUserInfo({})).rejects.toThrow(ThunderIDAPIError);

    const error: ThunderIDAPIError = await getUserInfo({}).catch((e: ThunderIDAPIError) => e);

    expect(error.message).toBe('Invalid endpoint URL provided');
    expect(error.code).toBe('getUserInfo-ValidationError-001');
    expect(error.name).toBe('ThunderIDAPIError');
  });

  it('should throw ThunderIDAPIError for empty string URL', async (): Promise<void> => {
    await expect(getUserInfo({url: ''})).rejects.toThrow(ThunderIDAPIError);

    const error: ThunderIDAPIError = await getUserInfo({url: ''}).catch((e: ThunderIDAPIError) => e);

    expect(error.message).toBe('Invalid endpoint URL provided');
    expect(error.code).toBe('getUserInfo-ValidationError-001');
    expect(error.name).toBe('ThunderIDAPIError');
  });

  it('should handle network errors', async () => {
    const mockFetch: typeof fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    global.fetch = mockFetch;

    await expect(
      getUserInfo({
        url: 'https://localhost:8090/oauth2/userinfo',
      }),
    ).rejects.toThrow(ThunderIDAPIError);
    await expect(
      getUserInfo({
        url: 'https://localhost:8090/oauth2/userinfo',
      }),
    ).rejects.toThrow('Network or parsing error: Network error');
  });

  it('should handle non-Error rejections', async (): Promise<void> => {
    global.fetch = vi.fn().mockRejectedValue('unexpected failure');

    const url = 'https://localhost:8090';

    await expect(getUserInfo({url})).rejects.toThrow(ThunderIDAPIError);
    await expect(getUserInfo({url})).rejects.toThrow('Network or parsing error: Unknown error');
  });

  it('should pass through custom headers', async () => {
    const mockUserInfo: User = {
      email: 'test@example.com',
      groups: ['group1'],
      id: 'test-id',
      name: 'Test User',
      roles: ['user'],
    };
    const mockFetch: typeof fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockUserInfo),
      ok: true,
    });
    global.fetch = mockFetch;
    const customHeaders: Record<string, string> = {
      Authorization: 'Bearer token',
      'X-Custom-Header': 'custom-value',
    };
    const url = 'https://localhost:8090/oauth2/userinfo';
    const result: User = await getUserInfo({headers: customHeaders, url});

    expect(result).toEqual(mockUserInfo);
    expect(mockFetch).toHaveBeenCalledWith(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...customHeaders,
      },
      method: 'GET',
    });
  });
});
