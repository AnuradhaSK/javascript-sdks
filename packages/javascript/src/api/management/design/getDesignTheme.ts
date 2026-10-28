// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {DesignTheme} from '../../../models/design';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getDesignTheme request.
 */
export interface GetDesignThemeConfig extends ManagementRequestConfig {
  /**
   * Identifier of the theme.
   */
  themeId: string;
}

/**
 * Retrieves a theme with its configuration.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the theme.
 *
 * @example
 * ```typescript
 * const theme = await getDesignTheme({baseUrl: 'https://localhost:8090', themeId});
 * ```
 */
const getDesignTheme = async ({themeId, ...config}: GetDesignThemeConfig): Promise<DesignTheme> =>
  requestManagementResource<DesignTheme>(config, {
    collection: 'design',
    failureMessage: 'Failed to fetch theme',
    id: 'themes',
    method: 'GET',
    operation: 'getDesignTheme',
    subPath: encodePathSegments('getDesignTheme', [themeId]),
  });

export default getDesignTheme;
