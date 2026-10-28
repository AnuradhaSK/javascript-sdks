// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Connection, ConnectionRequest, ConnectionType} from '../../../models/connection';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createConnection request.
 */
export interface CreateConnectionConfig extends ManagementRequestConfig {
  /**
   * The connection to create, in the type's shape.
   */
  payload: ConnectionRequest;
  /**
   * The connection type, such as `google` or `email-smtp`.
   */
  type: ConnectionType;
}

/**
 * Creates a connection of a type.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the connection as the server stored it.
 *
 * @example
 * ```typescript
 * const connection = await createConnection({
 *   baseUrl: 'https://localhost:8090',
 *   type: 'google',
 *   payload: {clientId, clientSecret, name: 'Google', redirectUri},
 * });
 * ```
 */
const createConnection = async ({payload, type, ...config}: CreateConnectionConfig): Promise<Connection> =>
  requestManagementResource<Connection>(config, {
    body: payload,
    collection: 'connections',
    failureMessage: 'Failed to create connection',
    id: type,
    method: 'POST',
    operation: 'createConnection',
  });

export default createConnection;
