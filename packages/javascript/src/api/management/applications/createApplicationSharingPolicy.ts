// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {SharingPolicy, SharingPolicyRequest} from '../../../models/sharing-policy';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createApplicationSharingPolicy request.
 */
export interface CreateApplicationSharingPolicyConfig extends ManagementRequestConfig {
  /**
   * Identifier of the application.
   */
  applicationId: string;
  /**
   * The policy to create.
   */
  payload: SharingPolicyRequest;
}

/**
 * Creates a sharing policy for an application: the organization units it reaches beyond its owner.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the policy as the server stored it.
 *
 * @example
 * ```typescript
 * const policy = await createApplicationSharingPolicy({
 *   baseUrl: 'https://localhost:8090',
 *   applicationId,
 *   payload: {childUnits: {mode: 'all'}},
 * });
 * ```
 */
const createApplicationSharingPolicy = async ({
  applicationId,
  payload,
  ...config
}: CreateApplicationSharingPolicyConfig): Promise<SharingPolicy> =>
  requestManagementResource<SharingPolicy>(config, {
    body: payload,
    collection: 'applications',
    failureMessage: 'Failed to create sharing policy',
    id: applicationId,
    method: 'POST',
    operation: 'createApplicationSharingPolicy',
    subPath: 'sharing-policies',
  });

export default createApplicationSharingPolicy;
