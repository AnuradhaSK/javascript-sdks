// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ThunderIDContext} from '@thunderid/vue';
import {describeError, track} from './events';
import {checkServerHealth} from './health';
import {decodeJwt, formatDuration} from './jwt';
import {loadServerSession} from './session';
import {COMPONENTS, STORY_COUNT} from './stories';
import type {PlaygroundSession, SsrSnapshot} from './types';
import {getDisplayName} from './user';
import type {useFlowMeta, useTheme, useThunderIDI18n, useUser} from '#imports';

export type CapabilityStatus = 'idle' | 'running' | 'pass' | 'fail' | 'skip' | 'unavailable';

export interface CapabilityResult {
  note: string;
  status: Exclude<CapabilityStatus, 'idle' | 'running'>;
}

export interface PublicThunderIDConfig {
  applicationId?: string;
  baseUrl?: string;
  clientId?: string;
  scopes?: string | string[];
}

/**
 * The live SDK state a check reads. Composables return refs, so this object stays current for the
 * whole run without being rebuilt.
 */
export interface CapabilityContext {
  config: PublicThunderIDConfig;
  flowMeta: ReturnType<typeof useFlowMeta>;
  i18n: ReturnType<typeof useThunderIDI18n>;
  sdk: ThunderIDContext;
  ssr: SsrSnapshot | null;
  theme: ReturnType<typeof useTheme>;
  user: ReturnType<typeof useUser>;
}

export interface RunOptions {
  /** True when the check was started from its own Run button, so it may navigate away. */
  interactive: boolean;
}

export interface Capability {
  api: string;
  id: string;
  name: string;
  run: (context: CapabilityContext, options: RunOptions) => Promise<CapabilityResult> | CapabilityResult;
  section: string;
}

const pass = (note: string): CapabilityResult => ({note, status: 'pass'});
const fail = (note: string): CapabilityResult => ({note, status: 'fail'});
const skip = (note: string): CapabilityResult => ({note, status: 'skip'});
const unavailable = (note: string): CapabilityResult => ({note, status: 'unavailable'});

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve: () => void) => {
    setTimeout(resolve, ms);
  });

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_resolve: (value: T) => void, reject: (reason: Error) => void) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    }),
  ]);

const waitFor = async (predicate: () => boolean, ms: number): Promise<boolean> => {
  const deadline: number = Date.now() + ms;

  while (Date.now() < deadline) {
    if (predicate()) return true;
    await sleep(150);
  }

  return predicate();
};

const requireSignedIn = (context: CapabilityContext): CapabilityResult | null =>
  context.sdk.isSignedIn.value ? null : skip('sign in first');

const asText = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return JSON.stringify(value);
};

const flowSummary = (response: unknown): string => {
  const flow: Record<string, unknown> = (response ?? {}) as Record<string, unknown>;
  const data: Record<string, unknown> = (flow.data ?? {}) as Record<string, unknown>;
  const components: unknown[] = Array.isArray(data.components) ? (data.components as unknown[]) : [];

  return `flowStatus=${asText(flow.flowStatus) || 'unknown'}, ${components.length} components`;
};

const userOf = (context: CapabilityContext): Record<string, unknown> | null => {
  const value: unknown = context.sdk.user.value;

  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
};

/** Fetches a page without following redirects, so a route middleware redirect shows up as one. */
const probePage = async (path: string): Promise<'redirect' | number> => {
  const response: Response = await fetch(path, {credentials: 'same-origin', redirect: 'manual'});

  return response.type === 'opaqueredirect' ? 'redirect' : response.status;
};

export const CAPABILITIES: Capability[] = [
  {
    api: 'GET /api/playground/health',
    id: 'server',
    name: 'Server reachable from Nuxt',
    run: async () => {
      const health = await checkServerHealth();

      return health.state === 'up' ? pass('ThunderID is healthy') : fail(health.detail);
    },
    section: 'Setup',
  },
  {
    api: 'runtimeConfig.public.thunderid',
    id: 'config',
    name: 'Module configuration',
    run: ({config}: CapabilityContext) => {
      if (!config.baseUrl) return fail('NUXT_PUBLIC_THUNDERID_BASE_URL is empty');
      if (!config.clientId && !config.applicationId) {
        return fail('set NUXT_PUBLIC_THUNDERID_CLIENT_ID or NUXT_PUBLIC_THUNDERID_APPLICATION_ID in .env');
      }

      return pass(config.clientId ? `clientId ${config.clientId}` : `applicationId ${config.applicationId}`);
    },
    section: 'Setup',
  },
  {
    api: 'useThunderID().isInitialized',
    id: 'init',
    name: 'Plugin initialized',
    run: async ({sdk}: CapabilityContext) =>
      (await waitFor(() => sdk.isInitialized.value, 5000))
        ? pass('auth state hydrated from the server')
        : fail('isInitialized stayed false for 5s'),
    section: 'Setup',
  },
  {
    api: 'Nitro plugin · getThunderIDContext(event)',
    id: 'ssr',
    name: 'Server-side context',
    run: ({ssr}: CapabilityContext) => {
      if (!ssr) return fail('no server render recorded: reload the page');
      if (!ssr.present)
        return fail('event.context.thunderid is empty: the plugin did not initialize (see the server log)');

      return pass(`isSignedIn ${String(ssr.isSignedIn)}, flow meta ${ssr.flowMeta ? 'loaded' : 'missing'}`);
    },
    section: 'Setup',
  },
  {
    api: 'useFlowMeta().meta · GET /api/auth/meta',
    id: 'meta',
    name: 'Flow metadata',
    run: async ({flowMeta}: CapabilityContext) => {
      if (flowMeta.meta.value) return pass('seeded from the server render');

      try {
        await track('GET /api/auth/meta', () => $fetch<Record<string, unknown>>('/api/auth/meta'));

        return pass('GET /api/auth/meta resolved');
      } catch (error) {
        return fail(`meta is null: ${describeError(error)}`);
      }
    },
    section: 'Setup',
  },
  {
    api: '<SignInButton /> · signIn() · GET /api/auth/signin',
    id: 'redirect',
    name: 'Sign in (redirect)',
    run: async (context: CapabilityContext, {interactive}: RunOptions) => {
      const {config, sdk} = context;

      if (sdk.isSignedIn.value) return pass(`signed in as ${getDisplayName(userOf(context))}`);
      if (!config.clientId) return fail('NUXT_PUBLIC_THUNDERID_CLIENT_ID is not set');
      if (!interactive) return skip('interactive: press Run to redirect to ThunderID');

      await track('signIn', () => sdk.signIn() as Promise<unknown>);

      return skip('redirecting to ThunderID');
    },
    section: 'Authentication',
  },
  {
    api: '<SignIn /> · signIn({applicationId, flowType}) · POST /api/auth/signin',
    id: 'native',
    name: 'Sign in (app-native flow)',
    run: async ({config, sdk}: CapabilityContext) => {
      if (!config.applicationId) return fail('NUXT_PUBLIC_THUNDERID_APPLICATION_ID is not set');

      const response: unknown = await track(
        'signIn:embedded',
        () =>
          withTimeout(
            sdk.signIn({applicationId: config.applicationId, flowType: 'AUTHENTICATION'}) as Promise<unknown>,
            10000,
            'flow initiation',
          ),
        flowSummary,
      );

      return pass(`flow started: ${flowSummary(response)}`);
    },
    section: 'Authentication',
  },
  {
    api: '<SignUp /> · signUp({applicationId, flowType}) · POST /api/auth/signup',
    id: 'signup',
    name: 'Sign up (app-native flow)',
    run: async ({config, sdk}: CapabilityContext) => {
      if (!config.applicationId) return fail('NUXT_PUBLIC_THUNDERID_APPLICATION_ID is not set');

      const response: unknown = await track(
        'signUp:embedded',
        () =>
          withTimeout(
            sdk.signUp({applicationId: config.applicationId, flowType: 'REGISTRATION'}) as Promise<unknown>,
            10000,
            'flow initiation',
          ),
        flowSummary,
      );

      return pass(`flow started: ${flowSummary(response)}`);
    },
    section: 'Authentication',
  },
  {
    api: 'useState(thunderid:auth) after reload',
    id: 'restore',
    name: 'Session restore (SSR hydration)',
    run: ({sdk, ssr}: CapabilityContext) => {
      if (!sdk.isSignedIn.value) return skip('no session: sign in, then reload the page');
      if (ssr?.isSignedIn) return pass('server render already knew the session; no client fetch');

      return pass('signed in on the client');
    },
    section: 'Authentication',
  },
  {
    api: 'signInSilently()',
    id: 'silent',
    name: 'Silent sign-in',
    run: () => unavailable('no-op in @thunderid/nuxt: the session lives in a server cookie'),
    section: 'Authentication',
  },
  {
    api: '<SignOutButton /> · signOut() · POST /api/auth/signout',
    id: 'signout',
    name: 'Sign out',
    run: async ({sdk}: CapabilityContext, {interactive}: RunOptions) => {
      if (!sdk.isSignedIn.value) return skip('not signed in');
      if (!interactive) return skip('interactive: press Run to sign out');

      await track('signOut', () => sdk.signOut() as Promise<unknown>);

      return pass('signOut() resolved');
    },
    section: 'Authentication',
  },
  {
    api: 'GET /api/auth/session',
    id: 'sessionRoute',
    name: 'Session route',
    run: async ({sdk}: CapabilityContext) => {
      const state: {isSignedIn: boolean} = await track('GET /api/auth/session', () =>
        $fetch<{isSignedIn: boolean}>('/api/auth/session'),
      );

      return state.isSignedIn === sdk.isSignedIn.value
        ? pass(`isSignedIn ${String(state.isSignedIn)}, matches the client`)
        : fail(`server says isSignedIn ${String(state.isSignedIn)}, client says ${String(sdk.isSignedIn.value)}`);
    },
    section: 'Server routes',
  },
  {
    api: 'getAccessToken() · GET /api/auth/token',
    id: 'accessToken',
    name: 'Access token',
    run: async (context: CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(context);

      if (gate) return gate;

      const token: string = await track('getAccessToken', () => context.sdk.getAccessToken());

      if (!token) return fail('empty: GET /api/auth/token failed');

      const exp: unknown = decodeJwt(token)?.payload.exp;

      return pass(
        typeof exp === 'number'
          ? `JWT, expires in ${formatDuration(exp * 1000 - Date.now())}`
          : `opaque token, ${token.length} chars`,
      );
    },
    section: 'Server routes',
  },
  {
    api: 'GET /api/auth/user',
    id: 'userRoute',
    name: 'User route',
    run: async (context: CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(context);

      if (gate) return gate;

      const user: Record<string, unknown> = await track('GET /api/auth/user', () =>
        $fetch<Record<string, unknown>>('/api/auth/user'),
      );

      return pass(`${getDisplayName(user)}, ${Object.keys(user).length} fields`);
    },
    section: 'Server routes',
  },
  {
    api: 'getIdToken() · getDecodedIdToken()',
    id: 'idToken',
    name: 'ID token on the client',
    run: () => unavailable('no-op in @thunderid/nuxt; read claims on the server (Server page)'),
    section: 'Server routes',
  },
  {
    api: 'http.request()',
    id: 'http',
    name: 'Authenticated request',
    run: () => unavailable('no-op in @thunderid/nuxt; call a server route that uses getValidAccessToken()'),
    section: 'Server routes',
  },
  {
    api: 'exchangeToken()',
    id: 'exchange',
    name: 'Token exchange',
    run: () => unavailable('no-op in @thunderid/nuxt'),
    section: 'Server routes',
  },
  {
    api: 'useServerSession(event)',
    id: 'useServerSession',
    name: 'Read the session on the server',
    run: async ({sdk}: CapabilityContext) => {
      const session: PlaygroundSession | null = await track('GET /api/playground/session', () => loadServerSession());

      if (!session) return fail('GET /api/playground/session failed');
      if (session.signedIn !== sdk.isSignedIn.value) {
        return fail(`server signedIn ${String(session.signedIn)}, client ${String(sdk.isSignedIn.value)}`);
      }

      return pass(
        session.signedIn ? `sub ${session.sub ?? '?'}, scopes ${session.scopes ?? '?'}` : 'null without a session',
      );
    },
    section: 'Server utilities',
  },
  {
    api: 'requireServerSession(event)',
    id: 'requireServerSession',
    name: 'Protect an API route',
    run: async ({sdk}: CapabilityContext) => {
      const anonymous: Response = await fetch('/api/playground/protected', {credentials: 'omit'});

      if (anonymous.status !== 401) return fail(`anonymous request got ${anonymous.status}, expected 401`);
      if (!sdk.isSignedIn.value) return pass('anonymous request gets 401');

      const signedIn: Response = await fetch('/api/playground/protected', {credentials: 'same-origin'});

      return signedIn.ok
        ? pass('401 anonymous, 200 with the session cookie')
        : fail(`signed-in request got ${signedIn.status}`);
    },
    section: 'Server utilities',
  },
  {
    api: 'getValidAccessToken(event)',
    id: 'refresh',
    name: 'Token refresh on the server',
    run: async (context: CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(context);

      if (gate) return gate;

      const token: {length: number} = await track('GET /api/playground/token', () =>
        $fetch<{length: number}>('/api/playground/token'),
      );
      const session: PlaygroundSession | null = await loadServerSession();

      if (!session?.hasRefreshToken) {
        return fail(`token ok (${token.length} chars) but no refresh token: request offline_access`);
      }

      return pass(`token ok, refresh token present: refreshed within 60s of expiry`);
    },
    section: 'Server utilities',
  },
  {
    api: "definePageMeta({middleware: ['auth']})",
    id: 'routeMiddleware',
    name: 'Protect a page',
    run: async ({sdk}: CapabilityContext) => {
      const result: 'redirect' | number = await track('GET /protected', () => probePage('/protected'), String);

      if (!sdk.isSignedIn.value) {
        return result === 'redirect'
          ? pass('signed out: redirected to /api/auth/signin')
          : fail(`expected a redirect, got ${String(result)}`);
      }

      return result === 200 ? pass('signed in: page rendered') : fail(`signed in but got ${String(result)}`);
    },
    section: 'Middleware',
  },
  {
    api: 'defineThunderIDMiddleware({requireScopes})',
    id: 'scopeMiddleware',
    name: 'Require scopes',
    run: async ({sdk}: CapabilityContext) => {
      const result: 'redirect' | number = await track(
        'GET /protected/scopes',
        () => probePage('/protected/scopes'),
        String,
      );

      if (!sdk.isSignedIn.value) {
        return result === 'redirect'
          ? pass('signed out: redirected to /api/auth/signin')
          : fail(`expected a redirect, got ${String(result)}`);
      }

      // The middleware must decide on the scopes granted to the session, so the expected outcome comes from there.
      const session: PlaygroundSession | null = await loadServerSession();
      const granted: string[] = (session?.scopes ?? '').split(' ');
      const hasScopes: boolean = ['openid', 'profile'].every((scope: string) => granted.includes(scope));

      if (hasScopes) {
        return result === 200
          ? pass('session granted openid and profile: page rendered')
          : fail(`session granted openid and profile, but got ${String(result)}`);
      }

      return result === 'redirect'
        ? pass(`session granted "${granted.join(' ')}", not openid and profile: redirected`)
        : fail(`session lacks openid or profile, but got ${String(result)}`);
    },
    section: 'Middleware',
  },
  {
    api: 'server/middleware · createRouteMatcher()',
    id: 'serverMiddleware',
    name: 'Server middleware',
    run: async () => {
      const response: Response = await fetch('/api/auth/session', {credentials: 'same-origin'});
      const trace: string | null = response.headers.get('x-playground-trace');

      if (!trace) return fail('no x-playground-trace header: server/middleware/playground.ts did not run');

      const steps: unknown[] = JSON.parse(decodeURIComponent(trace)) as unknown[];

      return pass(`ran before /api/auth/session, ${steps.length} trace steps`);
    },
    section: 'Middleware',
  },
  {
    api: 'useThunderID().user',
    id: 'user',
    name: 'User info',
    run: (context: CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(context);

      if (gate) return gate;

      const user: Record<string, unknown> | null = userOf(context);

      return user ? pass(getDisplayName(user)) : fail('user is null while signed in');
    },
    section: 'User',
  },
  {
    api: 'useUser().revalidateProfile() · GET /api/auth/user/profile',
    id: 'profile',
    name: 'User profile',
    run: async (context: CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(context);

      if (gate) return gate;

      await track('revalidateProfile', () => context.user.revalidateProfile());

      const profile: unknown = context.user.profile.value;

      if (!profile) return fail('profile is null after revalidateProfile()');

      return pass(
        `${Object.keys(profile as object).length} fields, schema ${context.user.userSchema?.value ? 'loaded' : 'missing'}`,
      );
    },
    section: 'User',
  },
  {
    api: '<UserProfile /> · PATCH /api/auth/user/profile',
    id: 'updateProfile',
    name: 'Update profile',
    run: (context: CapabilityContext) =>
      requireSignedIn(context) ?? skip('writes data: edit a field in Components > UserProfile'),
    section: 'User',
  },
  {
    api: 'useOrganization() · switchOrganization()',
    id: 'orgs',
    name: 'Organizations',
    run: () => unavailable('@thunderid/nuxt has no organization API'),
    section: 'User',
  },
  {
    api: 'useThunderIDI18n() · preferences.i18n',
    id: 'i18n',
    name: 'Translations',
    run: ({i18n}: CapabilityContext) => {
      const key = 'elements.buttons.signin.text';
      const text: string = i18n.t(key);

      if (!text || text === key) return fail(`t('${key}') returned the key`);

      return pass(`${i18n.currentLanguage.value}: "${text}", ${Object.keys(i18n.bundles.value).length} bundles`);
    },
    section: 'UI',
  },
  {
    api: 'useTheme() · ThemeProvider',
    id: 'theme',
    name: 'Theming and dark mode',
    run: ({theme}: CapabilityContext) => {
      const count: number = Object.keys(theme.theme.value.cssVariables ?? {}).length;

      if (!count) return fail('theme exposes no CSS variables');

      return pass(`${theme.colorScheme.value} scheme, ${count} CSS variables`);
    },
    section: 'UI',
  },
  {
    api: 'Component explorer',
    id: 'components',
    name: 'Components',
    run: () => pass(`${COMPONENTS.length} components · ${STORY_COUNT} stories`),
    section: 'UI',
  },
];

export const runCapability = async (
  capability: Capability,
  context: CapabilityContext,
  options: RunOptions,
): Promise<CapabilityResult> => {
  try {
    return await capability.run(context, options);
  } catch (error) {
    return fail(describeError(error));
  }
};
