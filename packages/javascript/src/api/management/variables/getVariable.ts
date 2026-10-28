// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Variable} from '../../../models/variable-store';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getVariable request.
 */
export interface GetVariableConfig extends ManagementRequestConfig {
  /**
   * Name of the variable.
   */
  name: string;
}

/**
 * Retrieves a variable.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the variable.
 *
 * @example
 * ```typescript
 * const variable = await getVariable({baseUrl: 'https://localhost:8090', name: 'SMTP_HOST'});
 * ```
 */
const getVariable = async ({name, ...config}: GetVariableConfig): Promise<Variable> =>
  requestManagementResource<Variable>(config, {
    collection: 'variables',
    failureMessage: 'Failed to fetch variable',
    id: name,
    method: 'GET',
    operation: 'getVariable',
  });

export default getVariable;
