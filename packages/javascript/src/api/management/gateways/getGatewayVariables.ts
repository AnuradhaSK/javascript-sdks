// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {VariableListResponse} from '../../../models/variable-store';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getGatewayVariables request.
 */
export interface GetGatewayVariablesConfig extends ManagementRequestConfig, ApiFilteringParams {
  /**
   * Identifier of the gateway.
   */
  gatewayId: string;
  /**
   * Returns only these names (at most 100). A name with nothing stored is absent from the result.
   */
  names?: string[];
}

/**
 * Retrieves a page of variables on a gateway. The request is passed to the gateway, which holds the
 * variables.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {variables} = await getGatewayVariables({baseUrl: 'https://localhost:8090', gatewayId, names: ['SMTP_HOST']});
 * ```
 */
const getGatewayVariables = async ({
  filter,
  gatewayId,
  limit,
  names,
  offset,
  ...config
}: GetGatewayVariablesConfig): Promise<VariableListResponse> =>
  requestManagementResource<VariableListResponse>(config, {
    collection: 'gateways',
    failureMessage: 'Failed to fetch variables',
    id: gatewayId,
    method: 'GET',
    operation: 'getGatewayVariables',
    query: {filter, limit, names: names?.join(','), offset},
    subPath: 'variables',
  });

export default getGatewayVariables;
