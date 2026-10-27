// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {ManagedActionKind, ManagedActionListResponse} from '../../../models/resource-server';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getActions request.
 */
export interface GetActionsConfig extends ManagementRequestConfig, Pick<ApiFilteringParams, 'limit' | 'offset'> {
  /**
   * Lists only the actions of this kind.
   */
  kind?: ManagedActionKind;
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
 * Retrieves a page of the actions of a resource server, or of one of its resources when `resourceId` is
 * given.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {actions} = await getActions({baseUrl: 'https://localhost:8090', resourceId, resourceServerId});
 * ```
 */
const getActions = async ({
  kind,
  limit,
  offset,
  resourceId,
  resourceServerId,
  ...config
}: GetActionsConfig): Promise<ManagedActionListResponse> =>
  requestManagementResource<ManagedActionListResponse>(config, {
    collection: 'resource-servers',
    failureMessage: 'Failed to fetch actions',
    id: resourceServerId,
    method: 'GET',
    operation: 'getActions',
    query: {kind, limit, offset},
    subPath:
      resourceId === undefined ? 'actions' : `resources/${encodePathSegments('getActions', [resourceId])}/actions`,
  });

export default getActions;
