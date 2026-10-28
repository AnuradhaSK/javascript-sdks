// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Variable, VariableUpdateRequest} from '../../../models/variable-store';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateGatewayVariable request.
 */
export interface UpdateGatewayVariableConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
  /**
   * Name of the variable.
   */
  name: string;
  /**
   * The variable's new value.
   */
  payload: VariableUpdateRequest;
}

/**
 * Sets or replaces a variable on a gateway, creating it when it does not exist.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the variable as the server stored it.
 *
 * @example
 * ```typescript
 * const variable = await updateGatewayVariable({baseUrl: 'https://localhost:8090', gatewayId, name: 'SMTP_HOST', payload: {value}});
 * ```
 */
const updateGatewayVariable = async ({
  gatewayId,
  name,
  payload,
  ...config
}: UpdateGatewayVariableConfig): Promise<Variable> =>
  requestManagementResource<Variable>(config, {
    body: payload,
    collection: 'gateways',
    failureMessage: 'Failed to update variable',
    id: gatewayId,
    method: 'PUT',
    operation: 'updateGatewayVariable',
    subPath: `variables/${encodePathSegments('updateGatewayVariable', [name])}`,
  });

export default updateGatewayVariable;
