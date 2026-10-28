// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ResolvedOverlay} from '../../../models/sharing-policy';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getApplicationOverlayRules request.
 */
export interface GetApplicationOverlayRulesConfig extends ManagementRequestConfig {
  /**
   * Identifier of the application.
   */
  applicationId: string;
  /**
   * Identifier of the organization unit to resolve the rules for.
   */
  ouId: string;
}

/**
 * Retrieves the overlay rules that apply to an application in an organization unit.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the resolved overlay.
 *
 * @example
 * ```typescript
 * const {rules} = await getApplicationOverlayRules({baseUrl: 'https://localhost:8090', applicationId, ouId});
 * ```
 */
const getApplicationOverlayRules = async ({
  applicationId,
  ouId,
  ...config
}: GetApplicationOverlayRulesConfig): Promise<ResolvedOverlay> =>
  requestManagementResource<ResolvedOverlay>(config, {
    collection: 'applications',
    failureMessage: 'Failed to fetch overlay rules',
    id: applicationId,
    method: 'GET',
    operation: 'getApplicationOverlayRules',
    query: {ouId},
    subPath: 'overlay-rules',
  });

export default getApplicationOverlayRules;
