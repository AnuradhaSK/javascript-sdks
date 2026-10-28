// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {DesignLayout, DesignLayoutRequest} from '../../../models/design';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateLayout request.
 */
export interface UpdateLayoutConfig extends ManagementRequestConfig {
  /**
   * Identifier of the layout.
   */
  layoutId: string;
  /**
   * The layout's new state.
   */
  payload: DesignLayoutRequest;
}

/**
 * Updates a layout.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the layout as the server stored it.
 *
 * @example
 * ```typescript
 * const layout = await updateLayout({
 *   baseUrl: 'https://localhost:8090',
 *   layoutId,
 *   payload: {handle: 'centered', displayName: 'Centered', layout: {}},
 * });
 * ```
 */
const updateLayout = async ({layoutId, payload, ...config}: UpdateLayoutConfig): Promise<DesignLayout> =>
  requestManagementResource<DesignLayout>(config, {
    body: payload,
    collection: 'design',
    failureMessage: 'Failed to update layout',
    id: 'layouts',
    method: 'PUT',
    operation: 'updateLayout',
    subPath: encodePathSegments('updateLayout', [layoutId]),
  });

export default updateLayout;
