// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {DesignTheme, DesignThemeRequest} from '../../../models/design';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateDesignTheme request.
 */
export interface UpdateDesignThemeConfig extends ManagementRequestConfig {
  /**
   * The theme's new state.
   */
  payload: DesignThemeRequest;
  /**
   * Identifier of the theme.
   */
  themeId: string;
}

/**
 * Updates a theme.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the theme as the server stored it.
 *
 * @example
 * ```typescript
 * const theme = await updateDesignTheme({
 *   baseUrl: 'https://localhost:8090',
 *   themeId,
 *   payload: {handle: 'brand', displayName: 'Brand', theme: {}},
 * });
 * ```
 */
const updateDesignTheme = async ({payload, themeId, ...config}: UpdateDesignThemeConfig): Promise<DesignTheme> =>
  requestManagementResource<DesignTheme>(config, {
    body: payload,
    collection: 'design',
    failureMessage: 'Failed to update theme',
    id: 'themes',
    method: 'PUT',
    operation: 'updateDesignTheme',
    subPath: encodePathSegments('updateDesignTheme', [themeId]),
  });

export default updateDesignTheme;
