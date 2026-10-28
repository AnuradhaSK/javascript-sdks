// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {LanguageTranslationsResponse, SetTranslationsRequest} from '../../../models/i18n-management';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the setTranslations request.
 */
export interface SetTranslationsConfig extends ManagementRequestConfig {
  /**
   * The language tag, such as `en-US`.
   */
  language: string;
  /**
   * The translations, keyed by namespace and then by key.
   */
  payload: SetTranslationsRequest;
}

/**
 * Sets translations of a language.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the translations as the server stored them.
 *
 * @example
 * ```typescript
 * await setTranslations({
 *   baseUrl: 'https://localhost:8090',
 *   language: 'en-US',
 *   payload: {translations: {auth: {'signin.title': 'Welcome back'}}},
 * });
 * ```
 */
const setTranslations = async ({
  language,
  payload,
  ...config
}: SetTranslationsConfig): Promise<LanguageTranslationsResponse> =>
  requestManagementResource<LanguageTranslationsResponse>(config, {
    body: payload,
    collection: 'i18n',
    failureMessage: 'Failed to set translations',
    id: 'languages',
    method: 'POST',
    operation: 'setTranslations',
    subPath: `${encodePathSegments('setTranslations', [language])}/translations`,
  });

export default setTranslations;
