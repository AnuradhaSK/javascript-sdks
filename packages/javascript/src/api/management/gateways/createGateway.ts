// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {GatewayRegistration, RegisterGatewayRequest} from '../../../models/gateway';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createGateway request.
 */
export interface CreateGatewayConfig extends ManagementRequestConfig {
  /**
   * The gateway to register.
   */
  payload: RegisterGatewayRequest;
}

/**
 * Registers a gateway. The result carries the gateway's key, which is returned only here.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the registration.
 *
 * @example
 * ```typescript
 * const {id, key} = await createGateway({
 *   baseUrl: 'https://localhost:8090',
 *   payload: {baseUrl: 'https://gw.example.com', name: 'Edge'},
 * });
 * ```
 */
const createGateway = async ({payload, ...config}: CreateGatewayConfig): Promise<GatewayRegistration> =>
  requestManagementResource<GatewayRegistration>(config, {
    body: payload,
    collection: 'gateways',
    failureMessage: 'Failed to register gateway',
    method: 'POST',
    operation: 'createGateway',
  });

export default createGateway;
