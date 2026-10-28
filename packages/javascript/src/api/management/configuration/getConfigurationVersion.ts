// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ConfigurationVersion} from '../../../models/configuration';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getConfigurationVersion request.
 */
export interface GetConfigurationVersionConfig extends ManagementRequestConfig {
  /**
   * The version, its hash, or a prefix of at least seven of its characters.
   */
  version: string;
}

/**
 * Retrieves a captured configuration version.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the version.
 *
 * @example
 * ```typescript
 * const {resources} = await getConfigurationVersion({baseUrl: 'https://localhost:8090', version: 'a1b2c3d'});
 * ```
 */
const getConfigurationVersion = async ({
  version,
  ...config
}: GetConfigurationVersionConfig): Promise<ConfigurationVersion> =>
  requestManagementResource<ConfigurationVersion>(config, {
    collection: 'configuration-versions',
    failureMessage: 'Failed to fetch configuration version',
    id: version,
    method: 'GET',
    operation: 'getConfigurationVersion',
  });

export default getConfigurationVersion;
