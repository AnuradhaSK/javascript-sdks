// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedTranslation, SetTranslationRequest} from '../../../models/i18n-management';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the setTranslation request.
 */
export interface SetTranslationConfig extends ManagementRequestConfig {
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
  /**
   * The translated value.
   */
  payload: SetTranslationRequest;
}

/**
 * Sets one translation.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the translation as the server stored it.
 *
 * @example
 * ```typescript
 * await setTranslation({
 *   baseUrl: 'https://localhost:8090',
 *   key: 'signin.title',
 *   language: 'en-US',
 *   namespace: 'auth',
 *   payload: {value: 'Welcome back'},
 * });
 * ```
 */
const setTranslation = async ({
  key,
  language,
  namespace,
  payload,
  ...config
}: SetTranslationConfig): Promise<ManagedTranslation> =>
  requestManagementResource<ManagedTranslation>(config, {
    body: payload,
    collection: 'i18n',
    failureMessage: 'Failed to set translation',
    id: 'languages',
    method: 'POST',
    operation: 'setTranslation',
    subPath: `${encodePathSegments('setTranslation', [language])}/translations/ns/${encodePathSegments('setTranslation', [namespace])}/keys/${encodePathSegments('setTranslation', [key])}`,
  });

export default setTranslation;
