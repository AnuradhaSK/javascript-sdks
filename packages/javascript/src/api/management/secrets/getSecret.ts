// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Secret} from '../../../models/variable-store';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getSecret request.
 */
export interface GetSecretConfig extends ManagementRequestConfig {
  /**
   * Name of the secret.
   */
  name: string;
}

/**
 * Retrieves a secret. The value is write-only: the server only says whether one is held, and the SDK never
 * logs it.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the secret.
 *
 * @example
 * ```typescript
 * const secret = await getSecret({baseUrl: 'https://localhost:8090', name: 'SMTP_HOST'});
 * ```
 */
const getSecret = async ({name, ...config}: GetSecretConfig): Promise<Secret> =>
  requestManagementResource<Secret>(config, {
    collection: 'secrets',
    failureMessage: 'Failed to fetch secret',
    id: name,
    method: 'GET',
    operation: 'getSecret',
  });

export default getSecret;
