// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteTranslation request.
 */
export interface DeleteTranslationConfig extends ManagementRequestConfig {
  /**
   * The translation key.
   */
  key: string;
  /**
   * The language tag, such as `en-US`.
   */
  language: string;
  /**
   * The translation namespace.
   */
  namespace: string;
}

/**
 * Clears one custom translation.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteTranslation({baseUrl: 'https://localhost:8090', key: 'signin.title', language: 'en-US', namespace: 'auth'});
 * ```
 */
const deleteTranslation = async ({key, language, namespace, ...config}: DeleteTranslationConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'i18n',
    failureMessage: 'Failed to delete translation',
    id: 'languages',
    method: 'DELETE',
    operation: 'deleteTranslation',
    subPath: `${encodePathSegments('deleteTranslation', [language])}/translations/ns/${encodePathSegments('deleteTranslation', [namespace])}/keys/${encodePathSegments('deleteTranslation', [key])}`,
  });
};

export default deleteTranslation;
