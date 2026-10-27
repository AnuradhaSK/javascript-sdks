// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Secret, SecretUpdateRequest} from '../../../models/variable-store';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateGatewaySecret request.
 */
export interface UpdateGatewaySecretConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
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
 * Sets or replaces a secret on a gateway, creating it when it does not exist. The value is write-only: the
 * server only says whether one is held, and the SDK never logs it.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the secret as the server stored it.
 *
 * @example
 * ```typescript
 * const secret = await updateGatewaySecret({baseUrl: 'https://localhost:8090', gatewayId, name: 'SMTP_HOST', payload: {value}});
 * ```
 */
const updateGatewaySecret = async ({gatewayId, name, payload, ...config}: UpdateGatewaySecretConfig): Promise<Secret> =>
  requestManagementResource<Secret>(config, {
    body: payload,
    collection: 'gateways',
    failureMessage: 'Failed to update secret',
    id: gatewayId,
    method: 'PUT',
    operation: 'updateGatewaySecret',
    subPath: `secrets/${encodePathSegments('updateGatewaySecret', [name])}`,
  });

export default updateGatewaySecret;
