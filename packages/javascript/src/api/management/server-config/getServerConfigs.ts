// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getServerConfigs request.
 */
export type GetServerConfigsConfig = ManagementRequestConfig;

/**
 * Retrieves the names of the server configuration sections.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the section names.
 *
 * @example
 * ```typescript
 * const sections = await getServerConfigs({baseUrl: 'https://localhost:8090'});
 * ```
 */
const getServerConfigs = async (config: GetServerConfigsConfig): Promise<string[]> =>
  requestManagementResource<string[]>(config, {
    collection: 'server-config',
    failureMessage: 'Failed to fetch server configuration',
    method: 'GET',
    operation: 'getServerConfigs',
  });

export default getServerConfigs;
