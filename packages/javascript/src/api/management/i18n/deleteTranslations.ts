// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteTranslations request.
 */
export interface DeleteTranslationsConfig extends ManagementRequestConfig {
  /**
   * The language tag, such as `en-US`.
   */
  language: string;
}

/**
 * Clears every custom translation of a language.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteTranslations({baseUrl: 'https://localhost:8090', language: 'en-US'});
 * ```
 */
const deleteTranslations = async ({language, ...config}: DeleteTranslationsConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'i18n',
    failureMessage: 'Failed to delete translations',
    id: 'languages',
    method: 'DELETE',
    operation: 'deleteTranslations',
    subPath: `${encodePathSegments('deleteTranslations', [language])}/translations`,
  });
};

export default deleteTranslations;
