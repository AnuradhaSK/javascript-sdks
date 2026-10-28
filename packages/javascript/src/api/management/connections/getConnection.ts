// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Connection, ConnectionType} from '../../../models/connection';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getConnection request.
 */
export interface GetConnectionConfig extends ManagementRequestConfig {
  /**
   * Identifier of the connection.
   */
  connectionId: string;
  /**
   * The connection type, such as `google` or `email-smtp`.
   */
  type: ConnectionType;
}

/**
 * Retrieves a connection with its configuration.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the connection.
 *
 * @example
 * ```typescript
 * const connection = await getConnection({baseUrl: 'https://localhost:8090', connectionId, type: 'google'});
 * ```
 */
const getConnection = async ({connectionId, type, ...config}: GetConnectionConfig): Promise<Connection> =>
  requestManagementResource<Connection>(config, {
    collection: 'connections',
    failureMessage: 'Failed to fetch connection',
    id: type,
    method: 'GET',
    operation: 'getConnection',
    subPath: encodePathSegments('getConnection', [connectionId]),
  });

export default getConnection;
