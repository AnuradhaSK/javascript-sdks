// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Gateway} from '../../../models/gateway';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getGateways request.
 */
export type GetGatewaysConfig = ManagementRequestConfig;

/**
 * Retrieves the registered gateways.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the gateways.
 *
 * @example
 * ```typescript
 * const gateways = await getGateways({baseUrl: 'https://localhost:8090'});
 * ```
 */
const getGateways = async (config: GetGatewaysConfig): Promise<Gateway[]> =>
  requestManagementResource<Gateway[]>(config, {
    collection: 'gateways',
    failureMessage: 'Failed to fetch gateways',
    method: 'GET',
    operation: 'getGateways',
  });

export default getGateways;
