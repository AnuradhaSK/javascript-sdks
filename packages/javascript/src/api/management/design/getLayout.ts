// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {DesignLayout} from '../../../models/design';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getLayout request.
 */
export interface GetLayoutConfig extends ManagementRequestConfig {
  /**
   * Identifier of the layout.
   */
  layoutId: string;
}

/**
 * Retrieves a layout with its configuration.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the layout.
 *
 * @example
 * ```typescript
 * const layout = await getLayout({baseUrl: 'https://localhost:8090', layoutId});
 * ```
 */
const getLayout = async ({layoutId, ...config}: GetLayoutConfig): Promise<DesignLayout> =>
  requestManagementResource<DesignLayout>(config, {
    collection: 'design',
    failureMessage: 'Failed to fetch layout',
    id: 'layouts',
    method: 'GET',
    operation: 'getLayout',
    subPath: encodePathSegments('getLayout', [layoutId]),
  });

export default getLayout;
