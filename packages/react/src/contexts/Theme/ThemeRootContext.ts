// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Context, createContext} from 'react';

export interface ThemeRootContextValue {
  /**
   * Hands the document root to a nested `ThemeProvider` until the returned release is called, so the
   * innermost provider's CSS variables and text direction are the ones on the page.
   */
  claim: () => () => void;
}

const ThemeRootContext: Context<ThemeRootContextValue | null> = createContext<ThemeRootContextValue | null>(null);

ThemeRootContext.displayName = 'ThemeRootContext';

export default ThemeRootContext;
