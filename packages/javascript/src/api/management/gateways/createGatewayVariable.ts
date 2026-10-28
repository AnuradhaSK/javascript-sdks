// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Variable, VariableRequest} from '../../../models/variable-store';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createGatewayVariable request.
 */
export interface CreateGatewayVariableConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
  /**
   * The variable to add.
   */
  payload: VariableRequest;
}

/**
 * Adds a variable on a gateway.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the variable as the server stored it.
 *
 * @example
 * ```typescript
 * const variable = await createGatewayVariable({baseUrl: 'https://localhost:8090', gatewayId, payload: {name: 'SMTP_HOST', value}});
 * ```
 */
const createGatewayVariable = async ({gatewayId, payload, ...config}: CreateGatewayVariableConfig): Promise<Variable> =>
  requestManagementResource<Variable>(config, {
    body: payload,
    collection: 'gateways',
    failureMessage: 'Failed to add variable',
    id: gatewayId,
    method: 'POST',
    operation: 'createGatewayVariable',
    subPath: 'variables',
  });

export default createGatewayVariable;
