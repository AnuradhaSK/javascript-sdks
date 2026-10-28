// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Variable} from '../../../models/variable-store';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getGatewayVariable request.
 */
export interface GetGatewayVariableConfig extends ManagementRequestConfig {
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
 * Retrieves a variable on a gateway.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the variable.
 *
 * @example
 * ```typescript
 * const variable = await getGatewayVariable({baseUrl: 'https://localhost:8090', gatewayId, name: 'SMTP_HOST'});
 * ```
 */
const getGatewayVariable = async ({gatewayId, name, ...config}: GetGatewayVariableConfig): Promise<Variable> =>
  requestManagementResource<Variable>(config, {
    collection: 'gateways',
    failureMessage: 'Failed to fetch variable',
    id: gatewayId,
    method: 'GET',
    operation: 'getGatewayVariable',
    subPath: `variables/${encodePathSegments('getGatewayVariable', [name])}`,
  });

export default getGatewayVariable;
