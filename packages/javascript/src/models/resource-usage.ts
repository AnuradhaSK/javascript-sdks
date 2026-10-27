// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * A resource that references another, such as an application that uses a flow or a theme.
 */
export interface ResourceUsage {
  /**
   * What happens to the referencing resource when the referenced one is deleted.
   */
  behaviorOnDelete: 'fallback' | 'cascade';
  displayName: string;
  id: string;
  resourceType: 'application' | 'agent';
}

/**
 * The resources that reference another.
 */
export interface ResourceUsagesResponse {
  count?: number;
  /**
   * The number of usages by resource type.
   */
  summary?: Record<string, number>;
  totalResults?: number | null;
  usages?: ResourceUsage[];
}
