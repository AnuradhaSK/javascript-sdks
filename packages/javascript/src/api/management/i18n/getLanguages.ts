// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {LanguageListResponse} from '../../../models/i18n-management';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getLanguages request.
 */
export type GetLanguagesConfig = ManagementRequestConfig;

/**
 * Retrieves the languages the server holds translations for.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the languages.
 *
 * @example
 * ```typescript
 * const {languages} = await getLanguages({baseUrl: 'https://localhost:8090'});
 * ```
 */
const getLanguages = async (config: GetLanguagesConfig): Promise<LanguageListResponse> =>
  requestManagementResource<LanguageListResponse>(config, {
    collection: 'i18n',
    failureMessage: 'Failed to fetch languages',
    id: 'languages',
    method: 'GET',
    operation: 'getLanguages',
  });

export default getLanguages;
