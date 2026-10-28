// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Secret, SecretRequest} from '../../../models/variable-store';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createSecret request.
 */
export interface CreateSecretConfig extends ManagementRequestConfig {
  /**
   * The secret to add.
   */
  payload: SecretRequest;
}

/**
 * Adds a secret. The value is write-only: the server only says whether one is held, and the SDK never logs
 * it.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the secret as the server stored it.
 *
 * @example
 * ```typescript
 * const secret = await createSecret({baseUrl: 'https://localhost:8090', payload: {name: 'SMTP_HOST', value}});
 * ```
 */
const createSecret = async ({payload, ...config}: CreateSecretConfig): Promise<Secret> =>
  requestManagementResource<Secret>(config, {
    body: payload,
    collection: 'secrets',
    failureMessage: 'Failed to add secret',
    method: 'POST',
    operation: 'createSecret',
  });

export default createSecret;
