// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ConnectionTypeWithUsages, ConnectionUsagesResponse} from '../../../models/connection';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getConnectionUsages request.
 */
export interface GetConnectionUsagesConfig extends ManagementRequestConfig {
  /**
   * Identifier of the connection.
   */
  connectionId: string;
  /**
   * The connection type, such as `google` or `email-smtp`.
   */
  type: ConnectionTypeWithUsages;
}

/**
 * Retrieves the flows that use a connection. Every connection type but `http` has usages.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the usages.
 *
 * @example
 * ```typescript
 * const {usages} = await getConnectionUsages({baseUrl: 'https://localhost:8090', connectionId, type: 'google'});
 * ```
 */
const getConnectionUsages = async ({
  connectionId,
  type,
  ...config
}: GetConnectionUsagesConfig): Promise<ConnectionUsagesResponse> =>
  requestManagementResource<ConnectionUsagesResponse>(config, {
    collection: 'connections',
    failureMessage: 'Failed to fetch connection usages',
    id: type,
    method: 'GET',
    operation: 'getConnectionUsages',
    subPath: `${encodePathSegments('getConnectionUsages', [connectionId])}/usages`,
  });

export default getConnectionUsages;
