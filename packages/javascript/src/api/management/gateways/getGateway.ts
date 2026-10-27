// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Gateway} from '../../../models/gateway';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getGateway request.
 */
export interface GetGatewayConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
}

/**
 * Retrieves a gateway.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the gateway.
 *
 * @example
 * ```typescript
 * const gateway = await getGateway({baseUrl: 'https://localhost:8090', gatewayId});
 * ```
 */
const getGateway = async ({gatewayId, ...config}: GetGatewayConfig): Promise<Gateway> =>
  requestManagementResource<Gateway>(config, {
    collection: 'gateways',
    failureMessage: 'Failed to fetch gateway',
    id: gatewayId,
    method: 'GET',
    operation: 'getGateway',
  });

export default getGateway;
