// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ServerConfigLayers} from '../../../models/server-config';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateServerConfig request.
 */
export type UpdateServerConfigConfig<T = unknown> = ManagementRequestConfig & {
  /**
   * Name of the configuration section, such as `flow`.
   */
  name: string;
  /**
   * The section's new writable value.
   */
  payload: T;
};

/**
 * Updates the writable layer of a server configuration section.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the section.
 *
 * @example
 * ```typescript
 * const {merged} = await updateServerConfig({
 *   baseUrl: 'https://localhost:8090',
 *   name: 'notification',
 *   payload: {defaultEmailSenderId: connectionId},
 * });
 * ```
 */
const updateServerConfig = async <T = unknown>({
  name,
  payload,
  ...config
}: UpdateServerConfigConfig<T>): Promise<ServerConfigLayers<T>> =>
  requestManagementResource<ServerConfigLayers<T>>(config, {
    body: payload,
    collection: 'server-config',
    failureMessage: 'Failed to update server configuration section',
    id: name,
    method: 'PUT',
    operation: 'updateServerConfig',
  });

export default updateServerConfig;
