// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedAction, UpdateActionRequest} from '../../../models/resource-server';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateAction request.
 */
export interface UpdateActionConfig extends ManagementRequestConfig {
  /**
   * Identifier of the action.
   */
  actionId: string;
  /**
   * The action's new state.
   */
  payload: UpdateActionRequest;
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
 * Updates an action of a resource server, or of one of its resources when `resourceId` is given.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the action as the server stored it.
 *
 * @example
 * ```typescript
 * const action = await updateAction({
 *   baseUrl: 'https://localhost:8090',
 *   actionId,
 *   resourceServerId,
 *   payload: {name: 'Read orders'},
 * });
 * ```
 */
const updateAction = async ({
  actionId,
  payload,
  resourceId,
  resourceServerId,
  ...config
}: UpdateActionConfig): Promise<ManagedAction> =>
  requestManagementResource<ManagedAction>(config, {
    body: payload,
    collection: 'resource-servers',
    failureMessage: 'Failed to update action',
    id: resourceServerId,
    method: 'PUT',
    operation: 'updateAction',
    subPath: `${resourceId === undefined ? '' : `resources/${encodePathSegments('updateAction', [resourceId])}/`}actions/${encodePathSegments('updateAction', [actionId])}`,
  });

export default updateAction;
