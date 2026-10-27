// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ConfigurationExportRequest, ConfigurationExportResponse} from '../../../models/configuration';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the exportConfiguration request.
 */
export interface ExportConfigurationConfig extends ManagementRequestConfig {
  /**
   * The resources to export, by type.
   */
  payload: ConfigurationExportRequest;
}

/**
 * Exports resources as a declarative document, with the environment variables it refers to.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the exported document.
 *
 * @example
 * ```typescript
 * const {resources} = await exportConfiguration({baseUrl: 'https://localhost:8090', payload: {applications: ['*']}});
 * ```
 */
const exportConfiguration = async ({
  payload,
  ...config
}: ExportConfigurationConfig): Promise<ConfigurationExportResponse> =>
  requestManagementResource<ConfigurationExportResponse>(config, {
    body: payload,
    collection: 'export',
    failureMessage: 'Failed to export configuration',
    method: 'POST',
    operation: 'exportConfiguration',
  });

export default exportConfiguration;
