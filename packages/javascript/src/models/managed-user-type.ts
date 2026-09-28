// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiPaginationLink} from './api';

/**
 * A user type as listed by the ThunderID management API. A user type is identified by its
 * immutable `handle`; `displayName` is not unique.
 */
export interface ManagedUserType {
  allowSelfRegistration?: boolean;
  displayName?: string;
  handle: string;
  id: string;
  isReadOnly?: boolean;
  ouHandle?: string;
  ouId?: string;
}

/**
 * A page of user types.
 */
export interface ManagedUserTypeListResponse {
  count: number;
  links?: ApiPaginationLink[];
  startIndex: number;
  totalResults: number;
  types: ManagedUserType[];
}
