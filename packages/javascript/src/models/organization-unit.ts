// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiPaginationLink} from './api';

/**
 * An organization unit as listed by the management API.
 */
export interface OrganizationUnitBasic {
  createdAt?: string;
  description?: string;
  handle: string;
  id: string;
  isReadOnly?: boolean;
  logoUrl?: string;
  name: string;
  updatedAt?: string;
}

/**
 * An organization unit with its configuration.
 */
export interface OrganizationUnit {
  authFlowId?: string;
  cookiePolicyUri?: string;
  createdAt?: string;
  description?: string;
  handle: string;
  id: string;
  isRecoveryFlowEnabled?: boolean;
  isRegistrationFlowEnabled?: boolean;
  layoutId?: string;
  logoUrl?: string;
  name: string;
  /**
   * Identifier of the parent organization unit, or `null` for a root.
   */
  parent?: string | null;
  policyUri?: string;
  recoveryFlowId?: string;
  registrationFlowId?: string;
  signOutFlowId?: string;
  themeId?: string;
  tosUri?: string;
  updatedAt?: string;
}

/**
 * A page of organization units.
 */
export interface OrganizationUnitListResponse {
  count?: number;
  links?: ApiPaginationLink[];
  organizationUnits: OrganizationUnitBasic[];
  startIndex?: number;
  totalResults?: number;
}

/**
 * The payload used to update an organization unit addressed by its handle path.
 */
export interface UpdateOrganizationUnitByPathRequest {
  authFlowId?: string;
  cookiePolicyUri?: string;
  description?: string;
  handle: string;
  isRecoveryFlowEnabled?: boolean;
  isRegistrationFlowEnabled?: boolean;
  layoutId?: string;
  logoUrl?: string;
  name: string;
  policyUri?: string;
  recoveryFlowId?: string;
  registrationFlowId?: string;
  signOutFlowId?: string;
  themeId?: string;
  tosUri?: string;
}

/**
 * The payload used to create an organization unit.
 */
export interface CreateOrganizationUnitRequest extends UpdateOrganizationUnitByPathRequest {
  /**
   * Identifier of the parent organization unit, or `null` to create a root.
   */
  parent: string | null;
}

/**
 * The payload used to update an organization unit addressed by its identifier.
 */
export type UpdateOrganizationUnitRequest = CreateOrganizationUnitRequest;

/**
 * Addresses an organization unit either by its identifier or by its handle path (for example
 * `engineering/platform`).
 */
export type OrganizationUnitReference = {ouId: string; path?: undefined} | {ouId?: undefined; path: string};

/**
 * A user that belongs to an organization unit.
 */
export interface OrganizationUnitUser {
  display?: string;
  id: string;
  isOwned?: boolean;
  type?: string;
}

/**
 * A page of the users in an organization unit.
 */
export interface OrganizationUnitUserListResponse {
  count?: number;
  links?: ApiPaginationLink[];
  startIndex?: number;
  totalResults?: number;
  users: OrganizationUnitUser[];
}

/**
 * A group that belongs to an organization unit.
 */
export interface OrganizationUnitGroup {
  id: string;
  name: string;
}

/**
 * A page of the groups in an organization unit.
 */
export interface OrganizationUnitGroupListResponse {
  count?: number;
  groups: OrganizationUnitGroup[];
  links?: ApiPaginationLink[];
  startIndex?: number;
  totalResults?: number;
}

/**
 * A role that belongs to an organization unit.
 */
export interface OrganizationUnitRole {
  description?: string;
  id: string;
  isReadOnly?: boolean;
  name: string;
}

/**
 * A page of the roles in an organization unit.
 */
export interface OrganizationUnitRoleListResponse {
  count?: number;
  links?: ApiPaginationLink[];
  roles: OrganizationUnitRole[];
  startIndex?: number;
  totalResults?: number;
}
