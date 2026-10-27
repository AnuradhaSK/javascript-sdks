// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiPaginationLink} from './api';

/**
 * A theme as listed.
 */
export interface DesignThemeListItem {
  createdAt?: string;
  defaultColorScheme?: string;
  description?: string;
  displayName?: string;
  handle?: string;
  id?: string;
  isReadOnly?: boolean;
  primaryColor?: string;
  updatedAt?: string;
}

/**
 * A page of themes.
 */
export interface DesignThemeListResponse {
  count?: number;
  links?: ApiPaginationLink[];
  startIndex?: number;
  themes?: DesignThemeListItem[];
  totalResults?: number;
}

/**
 * A theme with its configuration.
 */
export interface DesignTheme {
  createdAt?: string;
  description?: string;
  displayName?: string;
  handle?: string;
  id?: string;
  isReadOnly?: boolean;
  /**
   * The theme configuration: color schemes, typography, shape and the like.
   */
  theme?: Record<string, unknown>;
  updatedAt?: string;
}

/**
 * The payload used to create or update a theme.
 */
export interface DesignThemeRequest {
  description?: string;
  displayName: string;
  handle: string;
  theme: Record<string, unknown>;
}

/**
 * A layout as listed.
 */
export interface DesignLayoutListItem {
  createdAt?: string;
  description?: string;
  displayName?: string;
  handle?: string;
  id?: string;
  isReadOnly?: boolean;
  updatedAt?: string;
}

/**
 * A page of layouts.
 */
export interface DesignLayoutListResponse {
  count?: number;
  layouts?: DesignLayoutListItem[];
  links?: ApiPaginationLink[];
  startIndex?: number;
  totalResults?: number;
}

/**
 * A layout with its configuration.
 */
export interface DesignLayout {
  createdAt?: string;
  description?: string;
  displayName?: string;
  handle?: string;
  id?: string;
  isReadOnly?: boolean;
  /**
   * The layout configuration.
   */
  layout?: Record<string, unknown>;
  updatedAt?: string;
}

/**
 * The payload used to create or update a layout.
 */
export interface DesignLayoutRequest {
  description?: string;
  displayName: string;
  handle: string;
  layout: Record<string, unknown>;
}

/**
 * What a design is resolved for: an application or an organization unit.
 */
export type DesignResolveType = 'APP' | 'OU';

/**
 * The theme and layout that apply to an application or an organization unit.
 */
export interface DesignResolveResponse {
  layout?: Record<string, unknown>;
  theme?: Record<string, unknown>;
}
