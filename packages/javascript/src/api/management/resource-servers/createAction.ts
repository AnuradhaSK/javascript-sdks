// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {CreateActionRequest, ManagedAction} from '../../../models/resource-server';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createAction request.
 */
export interface CreateActionConfig extends ManagementRequestConfig {
  /**
   * The action to create.
   */
  payload: CreateActionRequest;
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
 * Creates an action on a resource server, or on one of its resources when `resourceId` is given.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the action as the server stored it.
 *
 * @example
 * ```typescript
 * const action = await createAction({
 *   baseUrl: 'https://localhost:8090',
 *   resourceId,
 *   resourceServerId,
 *   payload: {handle: 'read', name: 'Read'},
 * });
 * ```
 */
const createAction = async ({
  payload,
  resourceId,
  resourceServerId,
  ...config
}: CreateActionConfig): Promise<ManagedAction> =>
  requestManagementResource<ManagedAction>(config, {
    body: payload,
    collection: 'resource-servers',
    failureMessage: 'Failed to create action',
    id: resourceServerId,
    method: 'POST',
    operation: 'createAction',
    subPath:
      resourceId === undefined ? 'actions' : `resources/${encodePathSegments('createAction', [resourceId])}/actions`,
  });

export default createAction;
