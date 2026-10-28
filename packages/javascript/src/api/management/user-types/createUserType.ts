// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {CreateUserTypeRequest, ManagedUserTypeDetails} from '../../../models/entity-type';
import requestManagementResource from '../../../utils/requestManagementResource';

export interface CreateUserTypeConfig extends ManagementRequestConfig {
  /**
   * The user type to create.
   */
  payload: CreateUserTypeRequest;
}

/**
 * Creates a user type.
 */
const createUserType = async ({payload, ...config}: CreateUserTypeConfig): Promise<ManagedUserTypeDetails> =>
  requestManagementResource<ManagedUserTypeDetails>(config, {
    body: payload,
    collection: 'user-types',
    failureMessage: 'Failed to create user type',
    method: 'POST',
    operation: 'createUserType',
  });

export default createUserType;
