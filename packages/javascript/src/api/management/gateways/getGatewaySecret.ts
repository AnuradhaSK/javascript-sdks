// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Secret} from '../../../models/variable-store';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getGatewaySecret request.
 */
export interface GetGatewaySecretConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
  /**
   * Name of the secret.
   */
  name: string;
}

/**
 * Retrieves a secret on a gateway. The value is write-only: the server only says whether one is held, and
 * the SDK never logs it.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the secret.
 *
 * @example
 * ```typescript
 * const secret = await getGatewaySecret({baseUrl: 'https://localhost:8090', gatewayId, name: 'SMTP_HOST'});
 * ```
 */
const getGatewaySecret = async ({gatewayId, name, ...config}: GetGatewaySecretConfig): Promise<Secret> =>
  requestManagementResource<Secret>(config, {
    collection: 'gateways',
    failureMessage: 'Failed to fetch secret',
    id: gatewayId,
    method: 'GET',
    operation: 'getGatewaySecret',
    subPath: `secrets/${encodePathSegments('getGatewaySecret', [name])}`,
  });

export default getGatewaySecret;
