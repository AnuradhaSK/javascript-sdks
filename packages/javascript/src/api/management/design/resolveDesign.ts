// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {DesignResolveResponse, DesignResolveType} from '../../../models/design';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the resolveDesign request.
 */
export interface ResolveDesignConfig extends ManagementRequestConfig {
  /**
   * Identifier of the application or organization unit.
   */
  id: string;
  /**
   * What to resolve the design for: `APP` or `OU`.
   */
  type: DesignResolveType;
}

/**
 * Resolves the theme and layout that apply to an application or an organization unit.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the resolved theme and layout.
 *
 * @example
 * ```typescript
 * const {theme, layout} = await resolveDesign({baseUrl: 'https://localhost:8090', id: applicationId, type: 'APP'});
 * ```
 */
const resolveDesign = async ({id, type, ...config}: ResolveDesignConfig): Promise<DesignResolveResponse> =>
  requestManagementResource<DesignResolveResponse>(config, {
    collection: 'design',
    failureMessage: 'Failed to resolve design',
    id: 'resolve',
    method: 'GET',
    operation: 'resolveDesign',
    query: {id, type},
  });

export default resolveDesign;
