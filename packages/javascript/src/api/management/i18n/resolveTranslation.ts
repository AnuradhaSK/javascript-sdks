// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedTranslation} from '../../../models/i18n-management';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the resolveTranslation request.
 */
export interface ResolveTranslationConfig extends ManagementRequestConfig {
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
 * Resolves one translation.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the translation.
 *
 * @example
 * ```typescript
 * const {value} = await resolveTranslation({baseUrl: 'https://localhost:8090', key: 'signin.title', language: 'en-US', namespace: 'auth'});
 * ```
 */
const resolveTranslation = async ({
  key,
  language,
  namespace,
  ...config
}: ResolveTranslationConfig): Promise<ManagedTranslation> =>
  requestManagementResource<ManagedTranslation>(config, {
    collection: 'i18n',
    failureMessage: 'Failed to resolve translation',
    id: 'languages',
    method: 'GET',
    operation: 'resolveTranslation',
    subPath: `${encodePathSegments('resolveTranslation', [language])}/translations/ns/${encodePathSegments('resolveTranslation', [namespace])}/keys/${encodePathSegments('resolveTranslation', [key])}/resolve`,
  });

export default resolveTranslation;
