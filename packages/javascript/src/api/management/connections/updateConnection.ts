// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {Connection, ConnectionRequest, ConnectionType} from '../../../models/connection';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateConnection request.
 */
export interface UpdateConnectionConfig extends ManagementRequestConfig {
  /**
   * Identifier of the connection.
   */
  connectionId: string;
  /**
   * The connection's new state, in the type's shape.
   */
  payload: ConnectionRequest;
  /**
   * The connection type, such as `google` or `email-smtp`.
   */
  type: ConnectionType;
}

/**
 * Updates a connection.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the connection as the server stored it.
 *
 * @example
 * ```typescript
 * const connection = await updateConnection({
 *   baseUrl: 'https://localhost:8090',
 *   connectionId,
 *   type: 'google',
 *   payload: {clientId, name: 'Google', redirectUri},
 * });
 * ```
 */
const updateConnection = async ({
  connectionId,
  payload,
  type,
  ...config
}: UpdateConnectionConfig): Promise<Connection> =>
  requestManagementResource<Connection>(config, {
    body: payload,
    collection: 'connections',
    failureMessage: 'Failed to update connection',
    id: type,
    method: 'PUT',
    operation: 'updateConnection',
    subPath: encodePathSegments('updateConnection', [connectionId]),
  });

export default updateConnection;
