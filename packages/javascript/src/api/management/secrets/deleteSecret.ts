// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteSecret request.
 */
export interface DeleteSecretConfig extends ManagementRequestConfig {
  /**
   * Name of the secret.
   */
  name: string;
}

/**
 * Deletes a secret.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteSecret({baseUrl: 'https://localhost:8090', name: 'SMTP_HOST'});
 * ```
 */
const deleteSecret = async ({name, ...config}: DeleteSecretConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'secrets',
    failureMessage: 'Failed to delete secret',
    id: name,
    method: 'DELETE',
    operation: 'deleteSecret',
  });
};

export default deleteSecret;
