// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDAPIError from '../../errors/ThunderIDAPIError';
import {User} from '../../models/user';

/**
 * Retrieves the user information from the specified OIDC userinfo endpoint.
 *
 * @param requestConfig - Request configuration object.
 * @returns A promise that resolves with the user information.
 * @throw
 *   const userInfo = await getUserInfo({
 *     url: "https://localhost:8090/oauth2/userinfo",
 *   });
 *   console.log(userInfo);
 * } catch (error) {
 *   if (error instanceof ThunderIDAPIError) {
 *     console.error('Failed to get user info:', error.message);
 *   }
 * }
 * ```
 */
const getUserInfo = async ({url, ...requestConfig}: Partial<Request>): Promise<User> => {
  try {
    // eslint-disable-next-line no-new
    new URL(url!);
  } catch (error) {
    throw new ThunderIDAPIError(
      'Invalid endpoint URL provided',
      'getUserInfo-ValidationError-001',
      'javascript',
      400,
      'Invalid Request',
    );
  }

  try {
    const response: Response = await fetch(url!, {
      ...requestConfig,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...requestConfig.headers,
      } as HeadersInit,
      method: 'GET',
    });

    if (!response.ok) {
      const errorText: string = await response.text();

      throw new ThunderIDAPIError(
        errorText,
        'getUserInfo-ResponseError-001',
        'javascript',
        response.status,
        response.statusText,
        'Failed to fetch user info',
      );
    }

    return (await response.json()) as User;
  } catch (error) {
    if (error instanceof ThunderIDAPIError) {
      throw error;
    }
    throw new ThunderIDAPIError(
      `Network or parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'getUserInfo-NetworkError-001',
      'javascript',
      0,
      'Network Error',
    );
  }
};

export default getUserInfo;
