// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Gateway, UpdateGatewayRequest} from '../../../models/gateway';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateGateway request.
 */
export interface UpdateGatewayConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
  /**
   * The gateway's new state.
   */
  payload: UpdateGatewayRequest;
}

/**
 * Changes a gateway.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the gateway as the server stored it.
 *
 * @example
 * ```typescript
 * const gateway = await updateGateway({baseUrl: 'https://localhost:8090', gatewayId, payload: {name: 'Edge EU'}});
 * ```
 */
const updateGateway = async ({gatewayId, payload, ...config}: UpdateGatewayConfig): Promise<Gateway> =>
  requestManagementResource<Gateway>(config, {
    body: payload,
    collection: 'gateways',
    failureMessage: 'Failed to update gateway',
    id: gatewayId,
    method: 'PUT',
    operation: 'updateGateway',
  });

export default updateGateway;
