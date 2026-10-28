// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ConfigurationImportRequest, ConfigurationImportResponse} from '../../../models/configuration';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the importConfiguration request.
 */
export interface ImportConfigurationConfig extends ManagementRequestConfig {
  /**
   * The documents to import and the resources to remove.
   */
  payload: ConfigurationImportRequest;
}

/**
 * Imports declarative resources: upserts the documents in `content` and removes the resources in
 * `deletions`.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the outcome of each resource.
 *
 * @example
 * ```typescript
 * const {summary} = await importConfiguration({baseUrl: 'https://localhost:8090', payload: {content: yaml, dryRun: true}});
 * ```
 */
const importConfiguration = async ({
  payload,
  ...config
}: ImportConfigurationConfig): Promise<ConfigurationImportResponse> =>
  requestManagementResource<ConfigurationImportResponse>(config, {
    body: payload,
    collection: 'import',
    failureMessage: 'Failed to import configuration',
    method: 'POST',
    operation: 'importConfiguration',
  });

export default importConfiguration;
