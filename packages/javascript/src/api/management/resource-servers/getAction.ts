// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedAction} from '../../../models/resource-server';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getAction request.
 */
export interface GetActionConfig extends ManagementRequestConfig {
  /**
   * Identifier of the action.
   */
  actionId: string;
  /**
   * Identifier of the resource the action belongs to. Omit it for an action on the resource server
   * itself.
   */
  resourceId?: string;
  /**
   * Identifier of the resource server.
   */
  resourceServerId: string;
}

/**
 * Retrieves an action of a resource server, or of one of its resources when `resourceId` is given.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the action.
 *
 * @example
 * ```typescript
 * const action = await getAction({baseUrl: 'https://localhost:8090', actionId, resourceServerId});
 * ```
 */
const getAction = async ({
  actionId,
  resourceId,
  resourceServerId,
  ...config
}: GetActionConfig): Promise<ManagedAction> =>
  requestManagementResource<ManagedAction>(config, {
    collection: 'resource-servers',
    failureMessage: 'Failed to fetch action',
    id: resourceServerId,
    method: 'GET',
    operation: 'getAction',
    subPath: `${resourceId === undefined ? '' : `resources/${encodePathSegments('getAction', [resourceId])}/`}actions/${encodePathSegments('getAction', [actionId])}`,
  });

export default getAction;
