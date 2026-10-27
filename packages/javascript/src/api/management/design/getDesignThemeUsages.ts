// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {ResourceUsagesResponse} from '../../../models/resource-usage';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getDesignThemeUsages request.
 */
export interface GetDesignThemeUsagesConfig
  extends ManagementRequestConfig,
    Pick<ApiFilteringParams, 'limit' | 'offset'> {
  /**
   * Identifier of the theme.
   */
  themeId: string;
}

/**
 * Retrieves a page of the applications and agents that use a theme.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the usages.
 *
 * @example
 * ```typescript
 * const {usages} = await getDesignThemeUsages({baseUrl: 'https://localhost:8090', themeId});
 * ```
 */
const getDesignThemeUsages = async ({
  limit,
  offset,
  themeId,
  ...config
}: GetDesignThemeUsagesConfig): Promise<ResourceUsagesResponse> =>
  requestManagementResource<ResourceUsagesResponse>(config, {
    collection: 'design',
    failureMessage: 'Failed to fetch theme usages',
    id: 'themes',
    method: 'GET',
    operation: 'getDesignThemeUsages',
    query: {limit, offset},
    subPath: `${encodePathSegments('getDesignThemeUsages', [themeId])}/usages`,
  });

export default getDesignThemeUsages;
