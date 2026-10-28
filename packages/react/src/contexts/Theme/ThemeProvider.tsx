// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  createClassObserver,
  createMediaQueryListener,
  createTheme,
  detectThemeMode,
  FlowMetaTheme,
  RecursivePartial,
  Theme,
  ThemeConfig,
  ThemeMode,
} from '@thunderid/browser';
import {
  FC,
  MutableRefObject,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ThemeContext from './ThemeContext';
import ThemeRootContext, {ThemeRootContextValue} from './ThemeRootContext';
import applyThemeToDOM from '../../utils/applyThemeToDOM';
import buildThemeConfigFromFlowMeta from '../../utils/buildThemeConfigFromFlowMeta';
import normalizeThemeConfig from '../../utils/normalizeThemeConfig';
import FlowMetaContext, {FlowMetaContextValue} from '../FlowMeta/FlowMetaContext';

export interface ThemeProviderProps {
  /**
   * A Design theme to use instead of the one the server returns in flow meta, for example the theme an
   * app configuration names. `theme` overrides are still applied on top.
   */
  designTheme?: FlowMetaTheme | null;
  /**
   * Color scheme override. Overrides the server default when provided, and the color scheme follows it
   * when it changes.
   */
  mode?: ThemeMode;

  /**
   * Optional theme overrides merged on top of the server-side flow meta theme.
   * User-supplied values take highest precedence.
   */
  theme?: RecursivePartial<ThemeConfig>;
}

/**
 * ThemeProvider is the v2 drop-in replacement for `ThemeProvider`.
 *
 * It reads the design theme from the nearest `FlowMetaContext` (provided by
 * `FlowMetaProvider`) and publishes a resolved `Theme` object through the
 * **same** `ThemeContext` that `useTheme` consumes.  This means all existing
 * components that call `useTheme` continue to work without any changes.
 *
 * The `defaultColorScheme` field returned by the server is used to seed the
 * active color scheme; the user can still toggle it locally via the
 * `toggleTheme` value exposed in the context.
 *
 * @example
 * ```tsx
 * <FlowMetaProvider config={{ baseUrl, type: FlowMetaType.App, id: appId }}>
 *   <ThemeProvider>
 *     <App />   {/* useTheme() works here as usual *\/}
 *   </ThemeProvider>
 * </FlowMetaProvider>
 * ```
 *
 * @example
 * With user theme overrides (user values win over server values):
 * ```tsx
 * <ThemeProvider theme={{ colors: { primary: { main: '#ff0000' } } }}>
 *   <App />
 * </ThemeProvider>
 * ```
 */
const ThemeProvider: FC<PropsWithChildren<ThemeProviderProps>> = ({
  children,
  designTheme = undefined,
  mode,
  theme: themeOverrideProp,
}: PropsWithChildren<ThemeProviderProps>): ReactElement => {
  const themeOverride: RecursivePartial<ThemeConfig> | undefined = normalizeThemeConfig(themeOverrideProp);
  const flowMetaContext: FlowMetaContextValue | null = useContext(FlowMetaContext);

  const flowMetaTheme: FlowMetaTheme | null = designTheme ?? flowMetaContext?.meta?.design?.theme ?? null;
  const isLoading: boolean = flowMetaContext?.isLoading ?? false;
  const error: Error | null = flowMetaContext?.error ?? null;

  // Seed the color scheme: a fixed mode wins outright, 'system'/'class' detect it from the
  // environment via the same shared utilities Vue's ThemeProvider uses, and no mode falls back
  // to the server's default (unchanged pre-`mode` behavior).
  const getInitialColorScheme = (): 'light' | 'dark' => {
    if (mode === 'light' || mode === 'dark') return mode;
    if (mode === 'system' || mode === 'class') return detectThemeMode(mode);
    return flowMetaTheme?.defaultColorScheme ?? 'light';
  };

  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(getInitialColorScheme);

  // Follow a change of mode after mount, such as a host app's own color scheme toggle.
  const [seededMode, setSeededMode] = useState<ThemeMode | undefined>(mode);

  if (mode !== seededMode) {
    setSeededMode(mode);
    if (mode !== undefined) {
      setColorScheme(getInitialColorScheme());
    }
  }

  // When mode is unset, sync the color scheme with the server default once flow meta loads.
  useEffect(() => {
    if (mode === undefined && flowMetaTheme?.defaultColorScheme) {
      setColorScheme(flowMetaTheme.defaultColorScheme);
    }
  }, [mode, flowMetaTheme?.defaultColorScheme]);

  // Set up automatic detection listeners for 'system'/'class' modes.
  useEffect(() => {
    if (mode !== 'system' && mode !== 'class') return undefined;

    const handleThemeChange = (isDark: boolean): void => {
      setColorScheme(isDark ? 'dark' : 'light');
    };

    if (mode === 'class') {
      if (typeof document === 'undefined') return undefined;
      const observer = createClassObserver(document.documentElement, handleThemeChange);
      return () => {
        observer.disconnect();
      };
    }

    const mediaQuery = createMediaQueryListener(handleThemeChange);
    return () => {
      mediaQuery?.disconnect();
    };
  }, [mode]);

  const toggleTheme: () => void = useCallback(() => {
    setColorScheme((prev: 'light' | 'dark') => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Build the resolved ThemeConfig: flow meta base → user overrides on top.
  const finalThemeConfig: RecursivePartial<ThemeConfig> | undefined = useMemo(() => {
    if (!flowMetaTheme) {
      return themeOverride;
    }

    const metaConfig: RecursivePartial<ThemeConfig> = buildThemeConfigFromFlowMeta(flowMetaTheme, colorScheme);

    if (!themeOverride) {
      return metaConfig;
    }

    return {
      ...metaConfig,
      ...themeOverride,
      borderRadius: {
        ...metaConfig.borderRadius,
        ...themeOverride.borderRadius,
      },
      colors: {
        ...metaConfig.colors,
        ...themeOverride.colors,
      },
      ...(metaConfig.typography || themeOverride.typography
        ? {
            typography: {
              ...(metaConfig as any).typography,
              ...themeOverride.typography,
            },
          }
        : {}),
    };
  }, [flowMetaTheme, colorScheme, themeOverride]);

  const theme: Theme = useMemo(
    () => createTheme(finalThemeConfig, colorScheme === 'dark'),
    [finalThemeConfig, colorScheme],
  );

  const direction: 'ltr' | 'rtl' = flowMetaTheme?.direction ?? 'ltr';

  // The innermost ThemeProvider owns the document root: an outer one stops writing its CSS variables
  // and text direction while a nested one is mounted, and writes them again once it unmounts.
  const parentRoot: ThemeRootContextValue | null = useContext(ThemeRootContext);
  const claims: MutableRefObject<number> = useRef<number>(0);
  const applied: MutableRefObject<{direction: 'ltr' | 'rtl'; theme: Theme} | null> = useRef(null);

  const applyToRoot: () => void = useCallback(() => {
    if (!applied.current || typeof document === 'undefined') return;
    applyThemeToDOM(applied.current.theme);
    document.documentElement.dir = applied.current.direction;
  }, []);

  const root: ThemeRootContextValue = useMemo(
    () => ({
      claim: (): (() => void) => {
        claims.current += 1;
        return (): void => {
          claims.current -= 1;
          if (claims.current === 0) applyToRoot();
        };
      },
    }),
    [applyToRoot],
  );

  useEffect(() => parentRoot?.claim(), [parentRoot]);

  useEffect(() => {
    applied.current = {direction, theme};
    if (claims.current === 0) applyToRoot();
  }, [applyToRoot, direction, theme]);

  const value: any = {
    colorScheme,
    direction,
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeRootContext.Provider value={root}>{children}</ThemeRootContext.Provider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
