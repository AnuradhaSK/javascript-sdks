// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThemeDetection, ThemeMode, createPackageComponentLogger} from '@thunderid/javascript';

const logger: ReturnType<typeof createPackageComponentLogger> = createPackageComponentLogger(
  '@thunderid/browser',
  'ThemeDetection',
);

/**
 * Extended theme detection config that includes DOM-specific options
 */
export interface BrowserThemeDetection extends ThemeDetection {
  /**
   * The element to observe for class changes
   * @default document.documentElement (html element)
   */
  targetElement?: HTMLElement;
}

/**
 * Detects the current theme mode based on the specified method
 */
export const detectThemeMode = (mode: ThemeMode, config: BrowserThemeDetection = {}): 'light' | 'dark' => {
  const {
    darkClass = 'dark',
    lightClass = 'light',
    targetElement = typeof document !== 'undefined' ? document.documentElement : null,
  } = config;

  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';

  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  if (mode === 'class') {
    if (!targetElement) {
      logger.warn('ThemeDetection: targetElement is required for class-based detection, falling back to light mode');
      return 'light';
    }

    const {classList} = targetElement;

    // Check for explicit dark class first
    if (classList.contains(darkClass)) {
      return 'dark';
    }

    // Check for explicit light class
    if (classList.contains(lightClass)) {
      return 'light';
    }

    // If neither class is present, default to light
    return 'light';
  }

  return 'light';
};

/**
 * Creates a MutationObserver to watch for class changes on the target element
 */
export const createClassObserver = (
  targetElement: HTMLElement,
  callback: (isDark: boolean) => void,
  config: BrowserThemeDetection = {},
): MutationObserver => {
  const {darkClass = 'dark', lightClass = 'light'} = config;

  const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]) => {
    mutations.forEach((mutation: MutationRecord) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const {classList} = targetElement;

        if (classList.contains(darkClass)) {
          callback(true);
        } else if (classList.contains(lightClass)) {
          callback(false);
        }
        // If neither class is present, we don't trigger the callback
        // to avoid unnecessary re-renders
      }
    });
  });

  observer.observe(targetElement, {
    attributeFilter: ['class'],
    attributes: true,
  });

  return observer;
};

/**
 * A `MediaQueryList` returned by `createMediaQueryListener`, with a `disconnect()` that removes the
 * listener it registered.
 */
export type MediaQueryListener = MediaQueryList & {
  /** Stops calling the callback on system theme changes. */
  disconnect: () => void;
};

/**
 * Creates a media query listener for system theme changes. Call `disconnect()` on the returned
 * object to remove the listener.
 */
export const createMediaQueryListener = (callback: (isDark: boolean) => void): MediaQueryListener | null => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return null;
  }

  const mediaQuery: MediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent): void => {
    callback(e.matches);
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
  }

  return Object.assign(mediaQuery, {
    disconnect: (): void => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    },
  });
};
