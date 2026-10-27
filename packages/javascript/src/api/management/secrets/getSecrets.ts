// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {SecretListResponse} from '../../../models/variable-store';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getSecrets request.
 */
export interface GetSecretsConfig extends ManagementRequestConfig, ApiFilteringParams {
  /**
   * Returns only these names (at most 100). A name with nothing stored is absent from the result.
   */
  names?: string[];
}

/**
 * Retrieves a page of secrets. The value is write-only: the server only says whether one is held, and the
 * SDK never logs it.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {secrets} = await getSecrets({baseUrl: 'https://localhost:8090', names: ['SMTP_HOST']});
 * ```
 */
const getSecrets = async ({filter, limit, names, offset, ...config}: GetSecretsConfig): Promise<SecretListResponse> =>
  requestManagementResource<SecretListResponse>(config, {
    collection: 'secrets',
    failureMessage: 'Failed to fetch secrets',
    method: 'GET',
    operation: 'getSecrets',
    query: {filter, limit, names: names?.join(','), offset},
  });

export default getSecrets;
