// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDAPIError from '../../errors/ThunderIDAPIError';

/**
 * Attribute schema metadata returned by GET /users/me/meta
 */
export interface AttributeSchema {
  credential?: boolean;
  description?: string;
  displayName?: string;
  mutability?: string;
  readOnly?: boolean;
  regex?: string;
  required?: boolean;
  subAttributes?: AttributeSchema[];
  type?: string;
  unique?: boolean;
}

/**
 * Configuration for the getUsersMeMeta request
 */
export interface GetUsersMeMetaConfig extends Omit<RequestInit, 'method' | 'headers'> {
  /**
   * The base path of the API endpoint.
   */
  baseUrl?: string;
  /**
   * Optional custom fetcher function.
   * If not provided, native fetch will be used.
   */
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  /**
   * Custom HTTP headers as a plain object.
   */
  headers?: Record<string, string>;
  /**
   * The absolute API endpoint.
   */
  url?: string;
}

/**
 * Response structure for GET /users/me/meta
 */
export interface UsersMeMetaResponse {
  schema?: Record<string, AttributeSchema>;
}

/**
 * Retrieves the user schema metadata from the specified /users/me/meta endpoint.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the user schema metadata.
 */
const getUsersMeMeta = async ({
  baseUrl,
  fetcher,
  url,
  ...requestConfig
}: GetUsersMeMetaConfig): Promise<UsersMeMetaResponse> => {
  try {
    // eslint-disable-next-line no-new
    new URL((url ?? baseUrl)!);
  } catch (error) {
    throw new ThunderIDAPIError(
      `Invalid URL provided. ${error instanceof Error ? error.message : String(error)}`,
      'getUsersMeMeta-ValidationError-001',
      'javascript',
      400,
      'The provided `url` or `baseUrl` path does not adhere to the URL schema.',
    );
  }

  const fetchFn: typeof fetch = fetcher ?? fetch;
  const resolvedUrl: string = url ?? `${baseUrl?.replace(/\/$/, '')}/users/me/meta`;

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
        'getUsersMeMeta-ResponseError-001',
        'javascript',
        response.status,
        response.statusText,
        'Failed to fetch user schema metadata',
      );
    }

    return (await response.json()) as UsersMeMetaResponse;
  } catch (error) {
    if (error instanceof ThunderIDAPIError) {
      throw error;
    }

    throw new ThunderIDAPIError(
      `Network or parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'getUsersMeMeta-NetworkError-001',
      'javascript',
      0,
      'Network Error',
    );
  }
};

export default getUsersMeMeta;
