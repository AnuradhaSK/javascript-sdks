// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteLayout request.
 */
export interface DeleteLayoutConfig extends ManagementRequestConfig {
  /**
   * Identifier of the layout.
   */
  layoutId: string;
}

/**
 * Deletes a layout.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteLayout({baseUrl: 'https://localhost:8090', layoutId});
 * ```
 */
const deleteLayout = async ({layoutId, ...config}: DeleteLayoutConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'design',
    failureMessage: 'Failed to delete layout',
    id: 'layouts',
    method: 'DELETE',
    operation: 'deleteLayout',
    subPath: encodePathSegments('deleteLayout', [layoutId]),
  });
};

export default deleteLayout;
