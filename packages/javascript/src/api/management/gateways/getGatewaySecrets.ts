// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {SecretListResponse} from '../../../models/variable-store';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getGatewaySecrets request.
 */
export interface GetGatewaySecretsConfig extends ManagementRequestConfig, ApiFilteringParams {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
  /**
   * Returns only these names (at most 100). A name with nothing stored is absent from the result.
   */
  names?: string[];
}

/**
 * Retrieves a page of secrets on a gateway. The request is passed to the gateway, which holds the secrets.
 * The value is write-only: the server only says whether one is held, and the SDK never logs it.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {secrets} = await getGatewaySecrets({baseUrl: 'https://localhost:8090', gatewayId, names: ['SMTP_HOST']});
 * ```
 */
const getGatewaySecrets = async ({
  filter,
  gatewayId,
  limit,
  names,
  offset,
  ...config
}: GetGatewaySecretsConfig): Promise<SecretListResponse> =>
  requestManagementResource<SecretListResponse>(config, {
    collection: 'gateways',
    failureMessage: 'Failed to fetch secrets',
    id: gatewayId,
    method: 'GET',
    operation: 'getGatewaySecrets',
    query: {filter, limit, names: names?.join(','), offset},
    subPath: 'secrets',
  });

export default getGatewaySecrets;
