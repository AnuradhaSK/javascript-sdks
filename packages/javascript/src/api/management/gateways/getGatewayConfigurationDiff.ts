// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {GatewayConfigurationDiff} from '../../../models/gateway';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getGatewayConfigurationDiff request.
 */
export interface GetGatewayConfigurationDiffConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
  /**
   * The version to compare: a version, its hash, a prefix of at least seven characters, or `latest`.
   * Defaults to `latest`.
   */
  version?: string;
}

/**
 * Compares a configuration version with what a gateway holds.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the difference.
 *
 * @example
 * ```typescript
 * const {changes, summary} = await getGatewayConfigurationDiff({baseUrl: 'https://localhost:8090', gatewayId});
 * ```
 */
const getGatewayConfigurationDiff = async ({
  gatewayId,
  version,
  ...config
}: GetGatewayConfigurationDiffConfig): Promise<GatewayConfigurationDiff> =>
  requestManagementResource<GatewayConfigurationDiff>(config, {
    collection: 'gateways',
    failureMessage: 'Failed to fetch gateway configuration diff',
    id: gatewayId,
    method: 'GET',
    operation: 'getGatewayConfigurationDiff',
    query: {version},
    subPath: 'diff',
  });

export default getGatewayConfigurationDiff;
