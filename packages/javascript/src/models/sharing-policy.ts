// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiPaginationLink} from './api';

/**
 * Every organization unit in the deployment. Only a resource file or an imported document may introduce
 * it; an edit restates it to change its exclusions.
 */
export interface SharingPolicyAllUnits {
  excludedOuIds?: string[];
}

/**
 * Everything beneath the issuing organization unit, including units created later.
 */
export interface SharingPolicyChildUnitsAll {
  /**
   * Organization units directly beneath the issuer to withhold, with everything beneath them.
   */
  excludedOuIds?: string[];
  mode: 'all';
}

/**
 * A named organization unit directly beneath the issuer.
 */
export interface SharingPolicyChildUnit {
  ouId: string;
  /**
   * `unit` reaches the named organization unit only; `subtree` reaches it and everything below it.
   */
  reach: 'unit' | 'subtree';
}

/**
 * Named organization units directly beneath the issuer.
 */
export interface SharingPolicyChildUnitsSelected {
  mode: 'selected';
  units: SharingPolicyChildUnit[];
}

/**
 * The organization units beneath the issuer that a policy reaches.
 */
export type SharingPolicyChildUnits = SharingPolicyChildUnitsAll | SharingPolicyChildUnitsSelected;

/**
 * Named root organization units of other trees.
 */
export interface SharingPolicyOtherTreeRootsSelected {
  mode: 'selected';
  units: {ouId: string}[];
}

/**
 * The root organization unit of every other tree. Only a resource file or an imported document may
 * introduce it.
 */
export interface SharingPolicyOtherTreeRootsAll {
  excludedOuIds?: string[];
  mode: 'all';
}

/**
 * The roots of other trees that a policy reaches.
 */
export type SharingPolicyOtherTreeRoots = SharingPolicyOtherTreeRootsSelected | SharingPolicyOtherTreeRootsAll;

/**
 * A sharing policy: one organization unit's decision about which other organization units a user or an
 * application reaches.
 */
export interface SharingPolicy {
  allUnits?: SharingPolicyAllUnits;
  childUnits?: SharingPolicyChildUnits;
  id?: string;
  initiatingOuId?: string;
  isReadOnly?: boolean;
  otherTreeRoots?: SharingPolicyOtherTreeRoots;
  parentPolicyId?: string;
  stage?: 'share' | 'reshare';
  version?: number;
}

/**
 * A page of sharing policies.
 */
export interface SharingPolicyListResponse {
  count?: number;
  links?: ApiPaginationLink[];
  policies: SharingPolicy[];
  startIndex?: number;
  totalResults?: number;
}

/**
 * The payload used to create a sharing policy. It states `childUnits`, `otherTreeRoots`, or both.
 */
export interface SharingPolicyRequest {
  childUnits?: SharingPolicyChildUnits;
  /**
   * The organization unit whose decision this is. Omitted means the owner.
   */
  initiatingOuId?: string;
  otherTreeRoots?: SharingPolicyOtherTreeRootsSelected;
  version?: number;
}

/**
 * The payload used to replace a sharing policy's sections.
 */
export interface SharingPolicyUpdateRequest {
  allUnits?: SharingPolicyAllUnits;
  childUnits?: SharingPolicyChildUnits;
  otherTreeRoots?: SharingPolicyOtherTreeRoots;
  /**
   * The policy version being edited. An edit against any other version is refused.
   */
  version: number;
}

/**
 * The rule a sharing policy places on one attribute in an organization unit.
 */
export interface OverlayRule {
  allowedValues?: string[];
  editable?: boolean;
  excludedValues?: string[];
  value?: string[];
}

/**
 * The overlay rules that apply to a user or an application in one organization unit.
 */
export interface ResolvedOverlay {
  isOwned?: boolean;
  ouId?: string;
  policyIds?: string[];
  rules?: Record<string, OverlayRule>;
  visible?: boolean;
}
