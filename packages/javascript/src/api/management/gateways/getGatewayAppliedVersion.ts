// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {GatewayAppliedVersion} from '../../../models/gateway';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getGatewayAppliedVersion request.
 */
export interface GetGatewayAppliedVersionConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
}

/**
 * Retrieves the configuration version a gateway holds.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the applied version.
 *
 * @example
 * ```typescript
 * const {appliedVersion} = await getGatewayAppliedVersion({baseUrl: 'https://localhost:8090', gatewayId});
 * ```
 */
const getGatewayAppliedVersion = async ({
  gatewayId,
  ...config
}: GetGatewayAppliedVersionConfig): Promise<GatewayAppliedVersion> =>
  requestManagementResource<GatewayAppliedVersion>(config, {
    collection: 'gateways',
    failureMessage: 'Failed to fetch gateway applied version',
    id: gatewayId,
    method: 'GET',
    operation: 'getGatewayAppliedVersion',
    subPath: 'applied-version',
  });

export default getGatewayAppliedVersion;
