// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ConnectionMetaResponse, ConnectionType} from '../../../models/connection';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getConnectionsMeta request.
 */
export interface GetConnectionsMetaConfig extends ManagementRequestConfig {
  /**
   * Describes only this vendor.
   */
  vendor?: ConnectionType;
}

/**
 * Describes the configurable options of the connection vendors, such as the outbound authentication methods
 * each supports.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the vendor descriptions.
 *
 * @example
 * ```typescript
 * const {vendors} = await getConnectionsMeta({baseUrl: 'https://localhost:8090'});
 * ```
 */
const getConnectionsMeta = async ({vendor, ...config}: GetConnectionsMetaConfig): Promise<ConnectionMetaResponse> =>
  requestManagementResource<ConnectionMetaResponse>(config, {
    collection: 'connections',
    failureMessage: 'Failed to fetch connection metadata',
    id: 'meta',
    method: 'GET',
    operation: 'getConnectionsMeta',
    query: {vendor},
  });

export default getConnectionsMeta;
