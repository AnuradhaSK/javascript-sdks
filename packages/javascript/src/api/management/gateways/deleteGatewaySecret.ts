// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteGatewaySecret request.
 */
export interface DeleteGatewaySecretConfig extends ManagementRequestConfig {
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
 * Deletes a secret on a gateway.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteGatewaySecret({baseUrl: 'https://localhost:8090', gatewayId, name: 'SMTP_HOST'});
 * ```
 */
const deleteGatewaySecret = async ({gatewayId, name, ...config}: DeleteGatewaySecretConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'gateways',
    failureMessage: 'Failed to delete secret',
    id: gatewayId,
    method: 'DELETE',
    operation: 'deleteGatewaySecret',
    subPath: `secrets/${encodePathSegments('deleteGatewaySecret', [name])}`,
  });
};

export default deleteGatewaySecret;
