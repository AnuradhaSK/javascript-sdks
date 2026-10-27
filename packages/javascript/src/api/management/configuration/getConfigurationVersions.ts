// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ConfigurationVersion} from '../../../models/configuration';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getConfigurationVersions request.
 */
export type GetConfigurationVersionsConfig = ManagementRequestConfig;

/**
 * Retrieves the captured configuration versions.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the versions.
 *
 * @example
 * ```typescript
 * const versions = await getConfigurationVersions({baseUrl: 'https://localhost:8090'});
 * ```
 */
const getConfigurationVersions = async (config: GetConfigurationVersionsConfig): Promise<ConfigurationVersion[]> =>
  requestManagementResource<ConfigurationVersion[]>(config, {
    collection: 'configuration-versions',
    failureMessage: 'Failed to fetch configuration versions',
    method: 'GET',
    operation: 'getConfigurationVersions',
  });

export default getConfigurationVersions;
