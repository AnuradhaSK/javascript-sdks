// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {DesignLayout, DesignLayoutRequest} from '../../../models/design';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createLayout request.
 */
export interface CreateLayoutConfig extends ManagementRequestConfig {
  /**
   * The layout to create.
   */
  payload: DesignLayoutRequest;
}

/**
 * Creates a layout.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the layout as the server stored it.
 *
 * @example
 * ```typescript
 * const layout = await createLayout({
 *   baseUrl: 'https://localhost:8090',
 *   payload: {handle: 'centered', displayName: 'Centered', layout: {}},
 * });
 * ```
 */
const createLayout = async ({payload, ...config}: CreateLayoutConfig): Promise<DesignLayout> =>
  requestManagementResource<DesignLayout>(config, {
    body: payload,
    collection: 'design',
    failureMessage: 'Failed to create layout',
    id: 'layouts',
    method: 'POST',
    operation: 'createLayout',
  });

export default createLayout;
