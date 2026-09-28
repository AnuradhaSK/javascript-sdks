// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiPaginationLink} from './api';

/**
 * A flow definition as listed by the ThunderID management API.
 */
export interface ManagedFlow {
  activeVersion: number;
  createdAt?: string;
  flowType: string;
  handle: string;
  id: string;
  isReadOnly?: boolean;
  name: string;
  updatedAt?: string;
}

/**
 * A page of flows.
 */
export interface ManagedFlowListResponse {
  count: number;
  flows: ManagedFlow[];
  links?: ApiPaginationLink[];
  startIndex: number;
  totalResults: number;
}
