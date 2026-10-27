// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDAPIError from '../../errors/ThunderIDAPIError';
import {User} from '../../models/user';

/**
 * Configuration for the getUsersMe request
 */
export interface GetUsersMeConfig extends Omit<RequestInit, 'method'> {
  /**
   * The base path of the API endpoint.
   */
  baseUrl?: string;
  /**
   * Optional custom fetcher function.
   * If not provided, native fetch will be used
   */
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  /**
   * The absolute API endpoint.
   */
  url?: string;
}

/**
 * Retrieves the user profile information from the specified /users/me endpoint.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the user profile information.
 * @example
 * ```typescript
 * // Using default fetch
 * try {
 *   const userProfile = await getUsersMe({
 *     url: "https://localhost:8090/users/me",
 *   });
 *   console.log(userProfile);
 * } catch (error) {
 *   if (error instanceof ThunderIDAPIError) {
 *     console.error('Failed to get user profile:', error.message);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Using custom fetcher (e.g., axios-based httpClient)
 * try {
 *   const userProfile = await getUsersMe({
 *     url: "https://localhost:8090/users/me",
 *     fetcher: async (url, config) => {
 *       const response = await httpClient({
 *         url,
 *         method: config.method,
 *         headers: config.headers,
 *         ...config
 *       });
 *       // Convert axios-like response to fetch-like Response
 *       return {
 *         ok: response.status >= 200 && response.status < 300,
 *         status: response.status,
 *         statusText: response.statusText,
 *         json: () => Promise.resolve(response.data),
 *         text: () => Promise.resolve(typeof response.data === 'string' ? response.data : JSON.stringify(response.data))
 *       } as Response;
 *     }
 *   });
 *   console.log(userProfile);
 * } catch (error) {
 *   if (error instanceof ThunderIDAPIError) {
 *     console.error('Failed to get user profile:', error.message);
 *   }
 * }
 * ```
 */
const getUsersMe = async ({url, baseUrl, fetcher, ...requestConfig}: GetUsersMeConfig): Promise<User> => {
  try {
    // eslint-disable-next-line no-new
    new URL((url ?? baseUrl)!);
  } catch (error) {
    throw new ThunderIDAPIError(
      `Invalid URL provided. ${error?.toString()}`,
      'getUsersMe-ValidationError-001',
      'javascript',
      400,
      'The provided `url` or `baseUrl` path does not adhere to the URL schema.',
    );
  }

  const fetchFn: typeof fetch = fetcher || fetch;
  const resolvedUrl: string = url ?? `${baseUrl}/users/me`;

  const requestInit: RequestInit = {
    ...requestConfig,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...requestConfig.headers,
    },
    method: 'GET',
  };

  try {
    const response: Response = await fetchFn(resolvedUrl, requestInit);

    if (!response?.ok) {
      const errorText: string = await response.text();

      throw new ThunderIDAPIError(
        errorText,
        'getUsersMe-ResponseError-001',
        'javascript',
        response.status,
        response.statusText,
        'Failed to fetch user profile',
      );
    }

    const user: User = (await response.json()) as User;
    const attributes: Record<string, unknown> = (user['attributes'] as Record<string, unknown>) ?? {};
    return {
      ...user,
      ...attributes,
    };
  } catch (error) {
    if (error instanceof ThunderIDAPIError) {
      throw error;
    }

    throw new ThunderIDAPIError(
      `Network or parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'getUsersMe-NetworkError-001',
      'javascript',
      0,
      'Network Error',
    );
  }
};

export default getUsersMe;
