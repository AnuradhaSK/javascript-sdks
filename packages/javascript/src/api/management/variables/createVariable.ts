// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Variable, VariableRequest} from '../../../models/variable-store';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createVariable request.
 */
export interface CreateVariableConfig extends ManagementRequestConfig {
  /**
   * The variable to add.
   */
  payload: VariableRequest;
}

/**
 * Adds a variable.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the variable as the server stored it.
 *
 * @example
 * ```typescript
 * const variable = await createVariable({baseUrl: 'https://localhost:8090', payload: {name: 'SMTP_HOST', value}});
 * ```
 */
const createVariable = async ({payload, ...config}: CreateVariableConfig): Promise<Variable> =>
  requestManagementResource<Variable>(config, {
    body: payload,
    collection: 'variables',
    failureMessage: 'Failed to add variable',
    method: 'POST',
    operation: 'createVariable',
  });

export default createVariable;
