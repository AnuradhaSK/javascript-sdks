// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDAPIError from '../../../errors/ThunderIDAPIError';
import {OrganizationUnitListResponse} from '../../../models/organization-unit';
import encodeHandlePath from '../../../utils/encodeHandlePath';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getOrganizationUnitChildren request.
 *
 * Address the parent by `ouId` or by its handle `path`. `organizationUnitId` is the earlier form and keeps
 * its earlier endpoint.
 */
export interface GetOrganizationUnitChildrenConfig extends Omit<RequestInit, 'method'> {
  /**
   * The base URL of the ThunderID server.
   * Used to derive the endpoint when `url` is not provided.
   */
  baseUrl?: string;
  /**
   * Optional custom fetcher function.
   * If not provided, native fetch will be used.
   */
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  /**
   * Narrows the children, such as `handle sw "eng"`. Applies with `ouId` or `path`.
   */
  filter?: string;
  /**
   * Maximum number of results to return.
   */
  limit?: number;
  /**
   * Zero-based offset for pagination.
   */
  offset?: number;
  /**
   * The identifier of the parent organization unit whose children to list, requested from
   * `{baseUrl}/api/server/v1/organization-units/{id}/children`.
   *
   * @deprecated Use `ouId`, which requests the organization units API's `{id}/ous` endpoint.
   */
  organizationUnitId?: string;
  /**
   * Identifier of the parent organization unit. Requests `{organization-units}/{ouId}/ous`.
   */
  ouId?: string;
  /**
   * Handle path of the parent organization unit, such as `engineering/platform`. Requests
   * `{organization-units}/tree/{path}/ous`, with each handle encoded and the slashes between them kept.
   */
  path?: string;
  /**
   * The absolute API endpoint URL. With `ouId` or `path` it is the organization units collection URL; with
   * `organizationUnitId` it is the full children URL, and `baseUrl` and `organizationUnitId` are not used.
   */
  url?: string;
}

/**
 * Retrieves the child organization units of a given organization unit, addressed by its identifier
 * (`ouId`) or its handle path (`path`).
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the list of child organization units.
 *
 * @example
 * ```typescript
 * const {organizationUnits} = await getOrganizationUnitChildren({baseUrl: 'https://localhost:8090', path: 'engineering'});
 * ```
 */
const getOrganizationUnitChildren = async ({
  url,
  baseUrl,
  filter,
  organizationUnitId,
  ouId,
  path,
  limit,
  offset,
  fetcher,
  body,
  ...requestConfig
}: GetOrganizationUnitChildrenConfig): Promise<OrganizationUnitListResponse> => {
  if (ouId !== undefined || path !== undefined || organizationUnitId === undefined) {
    return requestManagementResource<OrganizationUnitListResponse>(
      {...requestConfig, baseUrl, fetcher, url},
      {
        collection: 'organization-units',
        failureMessage: 'Failed to fetch organization unit children',
        id: path === undefined ? (ouId ?? '') : 'tree',
        method: 'GET',
        operation: 'getOrganizationUnitChildren',
        query: {filter, limit, offset},
        subPath: path === undefined ? 'ous' : `${encodeHandlePath('getOrganizationUnitChildren', path)}/ous`,
      },
    );
  }

  try {
    // eslint-disable-next-line no-new
    new URL((url ?? baseUrl)!);
  } catch (error) {
    throw new ThunderIDAPIError(
      `Invalid URL provided. ${String(error)}`,
      'getOrganizationUnitChildren-ValidationError-001',
      'javascript',
      400,
      'The provided `url` or `baseUrl` path does not adhere to the URL schema.',
    );
  }

  const fetchFn: typeof fetch = fetcher ?? fetch;

  const queryParams = new URLSearchParams();
  if (limit !== undefined) queryParams.set('limit', String(limit));
  if (offset !== undefined) queryParams.set('offset', String(offset));
  const query = queryParams.toString();

  const resolvedBase = url ?? `${baseUrl}/api/server/v1/organization-units/${organizationUnitId}/children`;
  const resolvedUrl = query ? `${resolvedBase}?${query}` : resolvedBase;

  const requestInit: RequestInit = {
    ...requestConfig,
    ...(body !== undefined ? {body} : {}),
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
        'getOrganizationUnitChildren-ResponseError-001',
        'javascript',
        response.status,
        response.statusText,
        'Failed to fetch organization unit children',
      );
    }

    return (await response.json()) as OrganizationUnitListResponse;
  } catch (error) {
    if (error instanceof ThunderIDAPIError) {
      throw error;
    }

    throw new ThunderIDAPIError(
      `Network or parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'getOrganizationUnitChildren-NetworkError-001',
      'javascript',
      0,
      'Network Error',
    );
  }
};

export default getOrganizationUnitChildren;
