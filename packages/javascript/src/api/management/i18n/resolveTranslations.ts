// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {LanguageTranslationsResponse} from '../../../models/i18n-management';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the resolveTranslations request.
 */
export interface ResolveTranslationsConfig extends ManagementRequestConfig {
  /**
   * The language tag, such as `en-US`.
   */
  language: string;
  /**
   * Resolves only this namespace.
   */
  namespace?: string;
}

/**
 * Resolves the translations of a language, with the server defaults filled in, optionally for one
 * namespace.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the translations.
 *
 * @example
 * ```typescript
 * const {translations} = await resolveTranslations({baseUrl: 'https://localhost:8090', language: 'en-US'});
 * ```
 */
const resolveTranslations = async ({
  language,
  namespace,
  ...config
}: ResolveTranslationsConfig): Promise<LanguageTranslationsResponse> =>
  requestManagementResource<LanguageTranslationsResponse>(config, {
    collection: 'i18n',
    failureMessage: 'Failed to resolve translations',
    id: 'languages',
    method: 'GET',
    operation: 'resolveTranslations',
    query: {namespace},
    subPath: `${encodePathSegments('resolveTranslations', [language])}/translations/resolve`,
  });

export default resolveTranslations;
