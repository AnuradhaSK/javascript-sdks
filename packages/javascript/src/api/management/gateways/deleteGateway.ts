// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteGateway request.
 */
export interface DeleteGatewayConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
}

/**
 * Removes a gateway.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteGateway({baseUrl: 'https://localhost:8090', gatewayId});
 * ```
 */
const deleteGateway = async ({gatewayId, ...config}: DeleteGatewayConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'gateways',
    failureMessage: 'Failed to remove gateway',
    id: gatewayId,
    method: 'DELETE',
    operation: 'deleteGateway',
  });
};

export default deleteGateway;
