// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ResolvedOverlay} from '../../../models/sharing-policy';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getUserOverlayRules request.
 */
export interface GetUserOverlayRulesConfig extends ManagementRequestConfig {
  /**
   * Identifier of the organization unit to resolve the rules for.
   */
  ouId: string;
  /**
   * Identifier of the user.
   */
  userId: string;
}

/**
 * Retrieves the overlay rules that apply to a user in an organization unit.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the resolved overlay.
 *
 * @example
 * ```typescript
 * const {rules} = await getUserOverlayRules({baseUrl: 'https://localhost:8090', userId, ouId});
 * ```
 */
const getUserOverlayRules = async ({ouId, userId, ...config}: GetUserOverlayRulesConfig): Promise<ResolvedOverlay> =>
  requestManagementResource<ResolvedOverlay>(config, {
    collection: 'users',
    failureMessage: 'Failed to fetch overlay rules',
    id: userId,
    method: 'GET',
    operation: 'getUserOverlayRules',
    query: {ouId},
    subPath: 'overlay-rules',
  });

export default getUserOverlayRules;
