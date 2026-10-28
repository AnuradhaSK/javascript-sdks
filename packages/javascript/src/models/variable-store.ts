// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiPaginationLink} from './api';

/**
 * A named variable. Its value is readable.
 */
export interface Variable {
  createdAt?: string;
  description?: string;
  name: string;
  updatedAt?: string;
  value: string;
}

/**
 * A named secret. Its value is write-only: the server only says whether one is held.
 */
export interface Secret {
  createdAt?: string;
  description?: string;
  /**
   * Whether a value is held.
   */
  exists: boolean;
  name: string;
  updatedAt?: string;
}

/**
 * A page of variables.
 */
export interface VariableListResponse {
  count: number;
  links?: ApiPaginationLink[];
  startIndex: number;
  totalResults: number;
  variables: Variable[];
}

/**
 * A page of secrets.
 */
export interface SecretListResponse {
  count: number;
  links?: ApiPaginationLink[];
  secrets: Secret[];
  startIndex: number;
  totalResults: number;
}

/**
 * The payload used to add a variable.
 */
export interface VariableRequest {
  description?: string;
  name: string;
  value: string;
}

/**
 * The payload used to create or replace a variable.
 */
export interface VariableUpdateRequest {
  description?: string;
  value: string;
}

/**
 * The payload used to add a secret. The value is write-only.
 */
export interface SecretRequest {
  description?: string;
  name: string;
  value: string;
}

/**
 * The payload used to set or replace a secret. The value is write-only.
 */
export interface SecretUpdateRequest {
  description?: string;
  value: string;
}
