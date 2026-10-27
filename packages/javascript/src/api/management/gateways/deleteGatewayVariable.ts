// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteGatewayVariable request.
 */
export interface DeleteGatewayVariableConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
  /**
   * Name of the variable.
   */
  name: string;
}

/**
 * Deletes a variable on a gateway.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteGatewayVariable({baseUrl: 'https://localhost:8090', gatewayId, name: 'SMTP_HOST'});
 * ```
 */
const deleteGatewayVariable = async ({gatewayId, name, ...config}: DeleteGatewayVariableConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'gateways',
    failureMessage: 'Failed to delete variable',
    id: gatewayId,
    method: 'DELETE',
    operation: 'deleteGatewayVariable',
    subPath: `variables/${encodePathSegments('deleteGatewayVariable', [name])}`,
  });
};

export default deleteGatewayVariable;
