// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ServerConfigLayers} from '../../../models/server-config';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getServerConfig request.
 */
export interface GetServerConfigConfig extends ManagementRequestConfig {
  /**
   * Name of the configuration section, such as `flow`.
   */
  name: string;
}

/**
 * Retrieves a server configuration section in its layers. `merged` is what the server applies.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the section.
 *
 * @example
 * ```typescript
 * const {merged} = await getServerConfig<{defaultEmailSenderId?: string}>({baseUrl: 'https://localhost:8090', name: 'notification'});
 * ```
 */
const getServerConfig = async <T = unknown>({name, ...config}: GetServerConfigConfig): Promise<ServerConfigLayers<T>> =>
  requestManagementResource<ServerConfigLayers<T>>(config, {
    collection: 'server-config',
    failureMessage: 'Failed to fetch server configuration section',
    id: name,
    method: 'GET',
    operation: 'getServerConfig',
  });

export default getServerConfig;
