// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  User,
  HttpResponse,
  FetchHttpClient,
  HttpRequestConfig,
  getUsersMe as baseGetUsersMe,
  GetUsersMeConfig as BaseGetUsersMeConfig,
} from '@thunderid/browser';

/**
 * Configuration for the getUsersMe request (React-specific)
 */
export interface GetUsersMeConfig extends Omit<BaseGetUsersMeConfig, 'fetcher'> {
  /**
   * Optional custom fetcher function. If not provided, the ThunderID SPA client's httpClient will be used
   * which is a wrapper around axios http.request
   */
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  /**
   * Optional instance ID for multi-instance support. Defaults to 0.
   */
  instanceId?: number;
}

/**
 * Retrieves the user profile information from the specified /users/me endpoint.
 * This function uses the ThunderID SPA client's httpClient by default, but allows for custom fetchers.
 *
 * @param requestConfig - Request configuration object.
 * @returns A promise that resolves with the user profile information.
 * @example
 * ```typescript
 * // Using default ThunderID SPA client httpClient
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
 * // Using custom fetcher
 * try {
 *   const userProfile = await getUsersMe({
 *     url: "https://localhost:8090/users/me",
 *     fetcher: customFetchFunction
 *   });
 *   console.log(userProfile);
 * } catch (error) {
 *   if (error instanceof ThunderIDAPIError) {
 *     console.error('Failed to get user profile:', error.message);
 *   }
 * }
 * ```
 */
const getUsersMe = async ({fetcher, instanceId = 0, ...requestConfig}: GetUsersMeConfig): Promise<User> => {
  const defaultFetcher = async (url: string, config: RequestInit): Promise<Response> => {
    const httpClient: FetchHttpClient = FetchHttpClient.getInstance(instanceId);
    const response: HttpResponse<any> = await httpClient.request({
      headers: config.headers as Record<string, string>,
      method: config.method || 'GET',
      url,
    } as HttpRequestConfig);

    return {
      json: () => Promise.resolve(response.data),
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText || '',
      text: () => Promise.resolve(typeof response.data === 'string' ? response.data : JSON.stringify(response.data)),
    } as Response;
  };

  return baseGetUsersMe({
    ...requestConfig,
    fetcher: fetcher || defaultFetcher,
  });
};

export default getUsersMe;
