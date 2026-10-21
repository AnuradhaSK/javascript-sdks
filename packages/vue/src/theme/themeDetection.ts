// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Re-exports of theme detection utilities from the Browser SDK.
 *
 * - `detectThemeMode` — Detects current theme mode based on system preference or DOM class.
 * - `createClassObserver` — Creates a MutationObserver watching for CSS class changes on a target element.
 * - `createMediaQueryListener` — Creates a media query listener for `prefers-color-scheme` changes.
 * - `BrowserThemeDetection` — Configuration interface for DOM-specific theme detection options.
 *
 * @see {@link @thunderid/browser#detectThemeMode}
 * @see {@link @thunderid/browser#createClassObserver}
 * @see {@link @thunderid/browser#createMediaQueryListener}
 */
export {
  detectThemeMode,
  createClassObserver,
  createMediaQueryListener,
  type BrowserThemeDetection,
  type MediaQueryListener,
} from '@thunderid/browser';
