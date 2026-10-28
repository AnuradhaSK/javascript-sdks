// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {GatewayApplyResult, RevertGatewayConfigurationRequest} from '../../../models/gateway';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the revertGatewayConfiguration request.
 */
export interface RevertGatewayConfigurationConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
  /**
   * How to revert.
   */
  payload?: RevertGatewayConfigurationRequest;
}

/**
 * Reverts a gateway to the configuration version it held before.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the outcome.
 *
 * @example
 * ```typescript
 * const result = await revertGatewayConfiguration({baseUrl: 'https://localhost:8090', gatewayId});
 * ```
 */
const revertGatewayConfiguration = async ({
  gatewayId,
  payload,
  ...config
}: RevertGatewayConfigurationConfig): Promise<GatewayApplyResult> =>
  requestManagementResource<GatewayApplyResult>(config, {
    body: payload,
    collection: 'gateways',
    failureMessage: 'Failed to revert gateway configuration',
    id: gatewayId,
    method: 'POST',
    operation: 'revertGatewayConfiguration',
    subPath: 'revert',
  });

export default revertGatewayConfiguration;
