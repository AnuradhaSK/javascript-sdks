// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {InjectionKey} from 'vue';
import type {
  ThunderIDContext,
  FlowContextValue,
  FlowMetaContextValue,
  I18nContextValue,
  ThemeContextValue,
  ThemeRootContextValue,
  UserContextValue,
} from './models/contexts';

/**
 * Injection key for the core ThunderID authentication context.
 */
export const THUNDERID_KEY: InjectionKey<ThunderIDContext> = Symbol('thunderid');

/**
 * Injection key for the User context (profile, schemas, update operations).
 */
export const USER_KEY: InjectionKey<UserContextValue> = Symbol('thunderid-user');

/**
 * Injection key for the Flow context (embedded flow UI state).
 */
export const FLOW_KEY: InjectionKey<FlowContextValue> = Symbol('thunderid-flow');

/**
 * Injection key for the FlowMeta context (server-driven flow metadata).
 */
export const FLOW_META_KEY: InjectionKey<FlowMetaContextValue> = Symbol('thunderid-flow-meta');

/**
 * Injection key for the Theme context (color scheme, CSS variables, toggle).
 */
export const THEME_KEY: InjectionKey<ThemeContextValue> = Symbol('thunderid-theme');

/**
 * Injection key a nested ThemeProvider uses to take the document root from the one above it.
 */
export const THEME_ROOT_KEY: InjectionKey<ThemeRootContextValue> = Symbol('thunderid-theme-root');

/**
 * Injection key for the I18n context (translation function, language switching).
 */
export const I18N_KEY: InjectionKey<I18nContextValue> = Symbol('thunderid-i18n');
