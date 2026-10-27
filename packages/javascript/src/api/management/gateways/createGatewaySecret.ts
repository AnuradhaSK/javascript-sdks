// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Secret, SecretRequest} from '../../../models/variable-store';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createGatewaySecret request.
 */
export interface CreateGatewaySecretConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
  /**
   * The secret to add.
   */
  payload: SecretRequest;
}

/**
 * Adds a secret on a gateway. The value is write-only: the server only says whether one is held, and the
 * SDK never logs it.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the secret as the server stored it.
 *
 * @example
 * ```typescript
 * const secret = await createGatewaySecret({baseUrl: 'https://localhost:8090', gatewayId, payload: {name: 'SMTP_HOST', value}});
 * ```
 */
const createGatewaySecret = async ({gatewayId, payload, ...config}: CreateGatewaySecretConfig): Promise<Secret> =>
  requestManagementResource<Secret>(config, {
    body: payload,
    collection: 'gateways',
    failureMessage: 'Failed to add secret',
    id: gatewayId,
    method: 'POST',
    operation: 'createGatewaySecret',
    subPath: 'secrets',
  });

export default createGatewaySecret;
