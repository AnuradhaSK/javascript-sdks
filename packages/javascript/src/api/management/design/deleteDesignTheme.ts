// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteDesignTheme request.
 */
export interface DeleteDesignThemeConfig extends ManagementRequestConfig {
  /**
   * Identifier of the theme.
   */
  themeId: string;
}

/**
 * Deletes a theme.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteDesignTheme({baseUrl: 'https://localhost:8090', themeId});
 * ```
 */
const deleteDesignTheme = async ({themeId, ...config}: DeleteDesignThemeConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'design',
    failureMessage: 'Failed to delete theme',
    id: 'themes',
    method: 'DELETE',
    operation: 'deleteDesignTheme',
    subPath: encodePathSegments('deleteDesignTheme', [themeId]),
  });
};

export default deleteDesignTheme;
