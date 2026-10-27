// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {CaptureConfigurationVersionRequest, ConfigurationVersion} from '../../../models/configuration';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createConfigurationVersion request.
 */
export interface CreateConfigurationVersionConfig extends ManagementRequestConfig {
  /**
   * A name and note for the version.
   */
  payload?: CaptureConfigurationVersionRequest;
}

/**
 * Captures the current configuration as a version.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the version.
 *
 * @example
 * ```typescript
 * const version = await createConfigurationVersion({baseUrl: 'https://localhost:8090', payload: {name: 'Before launch'}});
 * ```
 */
const createConfigurationVersion = async ({
  payload,
  ...config
}: CreateConfigurationVersionConfig): Promise<ConfigurationVersion> =>
  requestManagementResource<ConfigurationVersion>(config, {
    body: payload,
    collection: 'configuration-versions',
    failureMessage: 'Failed to capture configuration version',
    method: 'POST',
    operation: 'createConfigurationVersion',
  });

export default createConfigurationVersion;
