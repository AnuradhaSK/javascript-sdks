// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {GatewayAppliedConfiguration} from '../../../models/gateway';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getGatewayAppliedConfiguration request.
 */
export interface GetGatewayAppliedConfigurationConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
}

/**
 * Retrieves the configuration a gateway runs.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the applied configuration.
 *
 * @example
 * ```typescript
 * const {resources} = await getGatewayAppliedConfiguration({baseUrl: 'https://localhost:8090', gatewayId});
 * ```
 */
const getGatewayAppliedConfiguration = async ({
  gatewayId,
  ...config
}: GetGatewayAppliedConfigurationConfig): Promise<GatewayAppliedConfiguration> =>
  requestManagementResource<GatewayAppliedConfiguration>(config, {
    collection: 'gateways',
    failureMessage: 'Failed to fetch gateway applied configuration',
    id: gatewayId,
    method: 'GET',
    operation: 'getGatewayAppliedConfiguration',
    subPath: 'applied-configuration',
  });

export default getGatewayAppliedConfiguration;
