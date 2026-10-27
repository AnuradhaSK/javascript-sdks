// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ConnectionType} from '../../../models/connection';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteConnection request.
 */
export interface DeleteConnectionConfig extends ManagementRequestConfig {
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
 * Deletes a connection.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteConnection({baseUrl: 'https://localhost:8090', connectionId, type: 'google'});
 * ```
 */
const deleteConnection = async ({connectionId, type, ...config}: DeleteConnectionConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'connections',
    failureMessage: 'Failed to delete connection',
    id: type,
    method: 'DELETE',
    operation: 'deleteConnection',
    subPath: encodePathSegments('deleteConnection', [connectionId]),
  });
};

export default deleteConnection;
