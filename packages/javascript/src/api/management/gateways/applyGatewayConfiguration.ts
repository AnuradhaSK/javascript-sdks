// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ApplyGatewayConfigurationRequest, GatewayApplyResult} from '../../../models/gateway';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the applyGatewayConfiguration request.
 */
export interface ApplyGatewayConfigurationConfig extends ManagementRequestConfig {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
  /**
   * What to apply, and how.
   */
  payload?: ApplyGatewayConfigurationRequest;
}

/**
 * Applies a configuration version to a gateway, the latest unless `payload.version` names one. A dry run
 * reports what would change and records nothing.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the outcome.
 *
 * @example
 * ```typescript
 * const {diff, missing} = await applyGatewayConfiguration({baseUrl: 'https://localhost:8090', gatewayId, payload: {dryRun: true}});
 * ```
 */
const applyGatewayConfiguration = async ({
  gatewayId,
  payload,
  ...config
}: ApplyGatewayConfigurationConfig): Promise<GatewayApplyResult> =>
  requestManagementResource<GatewayApplyResult>(config, {
    body: payload,
    collection: 'gateways',
    failureMessage: 'Failed to apply gateway configuration',
    id: gatewayId,
    method: 'POST',
    operation: 'applyGatewayConfiguration',
    subPath: 'apply',
  });

export default applyGatewayConfiguration;
