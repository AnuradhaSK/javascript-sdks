// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {DesignTheme, DesignThemeRequest} from '../../../models/design';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createDesignTheme request.
 */
export interface CreateDesignThemeConfig extends ManagementRequestConfig {
  /**
   * The theme to create.
   */
  payload: DesignThemeRequest;
}

/**
 * Creates a theme.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the theme as the server stored it.
 *
 * @example
 * ```typescript
 * const theme = await createDesignTheme({
 *   baseUrl: 'https://localhost:8090',
 *   payload: {handle: 'brand', displayName: 'Brand', theme: {}},
 * });
 * ```
 */
const createDesignTheme = async ({payload, ...config}: CreateDesignThemeConfig): Promise<DesignTheme> =>
  requestManagementResource<DesignTheme>(config, {
    body: payload,
    collection: 'design',
    failureMessage: 'Failed to create theme',
    id: 'themes',
    method: 'POST',
    operation: 'createDesignTheme',
  });

export default createDesignTheme;
