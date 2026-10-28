// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {VariableListResponse} from '../../../models/variable-store';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getVariables request.
 */
export interface GetVariablesConfig extends ManagementRequestConfig, ApiFilteringParams {
  /**
   * Returns only these names (at most 100). A name with nothing stored is absent from the result.
   */
  names?: string[];
}

/**
 * Retrieves a page of variables.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {variables} = await getVariables({baseUrl: 'https://localhost:8090', names: ['SMTP_HOST']});
 * ```
 */
const getVariables = async ({
  filter,
  limit,
  names,
  offset,
  ...config
}: GetVariablesConfig): Promise<VariableListResponse> =>
  requestManagementResource<VariableListResponse>(config, {
    collection: 'variables',
    failureMessage: 'Failed to fetch variables',
    method: 'GET',
    operation: 'getVariables',
    query: {filter, limit, names: names?.join(','), offset},
  });

export default getVariables;
