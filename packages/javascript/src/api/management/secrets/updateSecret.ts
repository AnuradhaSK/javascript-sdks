// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Secret, SecretUpdateRequest} from '../../../models/variable-store';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateSecret request.
 */
export interface UpdateSecretConfig extends ManagementRequestConfig {
  /**
   * Name of the secret.
   */
  name: string;
  /**
   * The secret's new value.
   */
  payload: SecretUpdateRequest;
}

/**
 * Sets or replaces a secret, creating it when it does not exist. The value is write-only: the server only
 * says whether one is held, and the SDK never logs it.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the secret as the server stored it.
 *
 * @example
 * ```typescript
 * const secret = await updateSecret({baseUrl: 'https://localhost:8090', name: 'SMTP_HOST', payload: {value}});
 * ```
 */
const updateSecret = async ({name, payload, ...config}: UpdateSecretConfig): Promise<Secret> =>
  requestManagementResource<Secret>(config, {
    body: payload,
    collection: 'secrets',
    failureMessage: 'Failed to update secret',
    id: name,
    method: 'PUT',
    operation: 'updateSecret',
  });

export default updateSecret;
