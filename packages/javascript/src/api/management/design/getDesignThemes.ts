// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {DesignThemeListResponse} from '../../../models/design';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getDesignThemes request.
 */
export type GetDesignThemesConfig = ManagementRequestConfig & Pick<ApiFilteringParams, 'limit' | 'offset'>;

/**
 * Retrieves a page of themes.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {themes} = await getDesignThemes({baseUrl: 'https://localhost:8090', limit: 20});
 * ```
 */
const getDesignThemes = async ({limit, offset, ...config}: GetDesignThemesConfig): Promise<DesignThemeListResponse> =>
  requestManagementResource<DesignThemeListResponse>(config, {
    collection: 'design',
    failureMessage: 'Failed to fetch themes',
    id: 'themes',
    method: 'GET',
    operation: 'getDesignThemes',
    query: {limit, offset},
  });

export default getDesignThemes;
