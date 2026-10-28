// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Variable, VariableUpdateRequest} from '../../../models/variable-store';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateVariable request.
 */
export interface UpdateVariableConfig extends ManagementRequestConfig {
  /**
   * Name of the variable.
   */
  name: string;
  /**
   * The variable's new value.
   */
  payload: VariableUpdateRequest;
}

/**
 * Sets or replaces a variable, creating it when it does not exist.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the variable as the server stored it.
 *
 * @example
 * ```typescript
 * const variable = await updateVariable({baseUrl: 'https://localhost:8090', name: 'SMTP_HOST', payload: {value}});
 * ```
 */
const updateVariable = async ({name, payload, ...config}: UpdateVariableConfig): Promise<Variable> =>
  requestManagementResource<Variable>(config, {
    body: payload,
    collection: 'variables',
    failureMessage: 'Failed to update variable',
    id: name,
    method: 'PUT',
    operation: 'updateVariable',
  });

export default updateVariable;
