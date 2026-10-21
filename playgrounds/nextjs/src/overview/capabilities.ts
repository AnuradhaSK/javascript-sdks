// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EmbeddedFlowType} from '@thunderid/browser';
import type {
  I18nContextValue,
  ThemeContextValue,
  ThunderIDContextProps as ReactContextProps,
  UserContextProps,
} from '@thunderid/react';
import {readConfig, readServerSession} from '../app/actions';
import {COMPONENTS, STORY_COUNT} from '../explorer/stories';
import {describeError, track} from '../lib/events';
import {checkServerHealth} from '../lib/health';
import {formatDuration} from '../lib/jwt';
import {asText, NextSdk, sdkSignIn, sdkSignOut, sdkSignUp, toUser} from '../lib/sdk';
import type {ServerSession} from '../lib/serverSession';
import {getDisplayName} from '../lib/user';

export type CapabilityStatus = 'idle' | 'running' | 'pass' | 'fail' | 'skip' | 'unavailable';

export interface CapabilityResult {
  note: string;
  status: Exclude<CapabilityStatus, 'idle' | 'running'>;
}

export interface CapabilityContext {
  i18n: I18nContextValue;
  /** The @thunderid/react context that @thunderid/nextjs bridges for the components it reuses. */
  reactSdk: ReactContextProps;
  sdk: NextSdk;
  theme: ThemeContextValue;
  user: UserContextProps;
}

export interface RunOptions {
  /** True when the check was started from its own Run button, so it may navigate away. */
  interactive: boolean;
}

export interface Capability {
  api: string;
  id: string;
  name: string;
  run: (getContext: () => CapabilityContext, options: RunOptions) => Promise<CapabilityResult> | CapabilityResult;
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

/**
 * Polls the latest context until the predicate holds or the timeout elapses.
 */
const waitFor = async (
  getContext: () => CapabilityContext,
  predicate: (context: CapabilityContext) => boolean,
  ms: number,
): Promise<boolean> => {
  const deadline: number = Date.now() + ms;

  while (Date.now() < deadline) {
    if (predicate(getContext())) return true;
    await sleep(150);
  }

  return predicate(getContext());
};

const requireSignedIn = (context: CapabilityContext): CapabilityResult | null =>
  context.sdk.isSignedIn ? null : skip('sign in first');

const flowSummary = (response: unknown): string => {
  const flow: Record<string, unknown> = (response ?? {}) as Record<string, unknown>;
  const data: Record<string, unknown> = (flow['data'] ?? {}) as Record<string, unknown>;
  const components: unknown[] = Array.isArray(data['components']) ? (data['components'] as unknown[]) : [];

  return `flowStatus=${asText(flow['flowStatus']) || 'unknown'}, ${components.length} components`;
};

const getJson = async (path: string, init: RequestInit = {}): Promise<{body: unknown; response: Response}> => {
  const response: Response = await fetch(path, {cache: 'no-store', ...init});
  const text: string = await response.text();
  let body: unknown = text;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Not JSON; keep the text.
  }

  return {body, response};
};

export const CAPABILITIES: Capability[] = [
  {
    api: 'server action · GET /health/liveness',
    id: 'server',
    name: 'Server reachable',
    run: async () => {
      const health = await checkServerHealth();

      return health.state === 'up'
        ? pass('ThunderID is healthy (probed from the Next.js server)')
        : fail(health.detail);
    },
    section: 'Setup',
  },
  {
    api: '<ThunderIDProvider /> · NEXT_PUBLIC_THUNDERID_*',
    id: 'config',
    name: 'Provider configuration',
    run: async (getContext: () => CapabilityContext) => {
      const config = await readConfig();
      const {sdk} = getContext();

      if (!config.clientId && !config.applicationId) {
        return fail('set NEXT_PUBLIC_THUNDERID_CLIENT_ID or NEXT_PUBLIC_THUNDERID_APPLICATION_ID in .env');
      }
      if (!sdk.baseUrl) return fail('the client context has no baseUrl');

      const missing: string[] = [
        config.clientId && !config.clientSecretSet ? 'THUNDERID_CLIENT_SECRET' : '',
        config.sessionSecretSet ? '' : 'THUNDERID_SECRET',
      ].filter(Boolean);

      return pass(
        `${config.clientId ? `clientId ${config.clientId}` : `applicationId ${config.applicationId}`}${
          missing.length ? `; ${missing.join(', ')} not set` : ''
        }`,
      );
    },
    section: 'Setup',
  },
  {
    api: 'useThunderID().isLoading',
    id: 'init',
    name: 'Provider ready',
    run: async (getContext: () => CapabilityContext) =>
      (await waitFor(getContext, (context: CapabilityContext) => !context.sdk.isLoading, 8000))
        ? pass('session resolved on the server, client context hydrated')
        : fail('isLoading stayed true for 8s'),
    section: 'Setup',
  },
  {
    api: 'ThunderIDProvider · getFlowMeta()',
    id: 'meta',
    name: 'Flow metadata',
    run: (getContext: () => CapabilityContext) =>
      getContext().reactSdk.meta
        ? pass('GET /flow/meta resolved on the server and seeded the client')
        : fail(
            getContext().sdk.baseUrl
              ? 'meta is null: /flow/meta failed on the server or needs an application ID'
              : 'meta is null: NEXT_PUBLIC_THUNDERID_BASE_URL is not set',
          ),
    section: 'Setup',
  },
  {
    api: '<SignInButton /> · signIn()',
    id: 'redirect',
    name: 'Sign in (redirect)',
    run: async (getContext: () => CapabilityContext, {interactive}: RunOptions) => {
      const {sdk} = getContext();

      if (sdk.isSignedIn) return pass(`signed in as ${getDisplayName(toUser(sdk.user))}`);
      if (!interactive) return skip('interactive: press Run to redirect to ThunderID');

      await track('signIn', () => sdkSignIn(sdk));

      return skip('redirecting to ThunderID');
    },
    section: 'Authentication',
  },
  {
    api: '<SignIn /> · signIn({applicationId, flowType})',
    id: 'native',
    name: 'Sign in (app-native flow)',
    run: async (getContext: () => CapabilityContext) => {
      const {sdk} = getContext();

      if (!sdk.applicationId) return fail('NEXT_PUBLIC_THUNDERID_APPLICATION_ID is not set');

      const response: unknown = await track(
        'signIn:embedded',
        () =>
          withTimeout(
            sdkSignIn(sdk, {applicationId: sdk.applicationId, flowType: EmbeddedFlowType.Authentication}, {}),
            10000,
            'flow initiation',
          ),
        flowSummary,
      );

      return pass(`flow started through a server action: ${flowSummary(response)}`);
    },
    section: 'Authentication',
  },
  {
    api: '<SignUp /> · signUp({applicationId, flowType})',
    id: 'signup',
    name: 'Sign up (app-native flow)',
    run: async (getContext: () => CapabilityContext) => {
      const {sdk} = getContext();

      if (!sdk.applicationId) return fail('NEXT_PUBLIC_THUNDERID_APPLICATION_ID is not set');

      const response: unknown = await track(
        'signUp:embedded',
        () =>
          withTimeout(
            sdkSignUp(sdk, {applicationId: sdk.applicationId, flowType: EmbeddedFlowType.Registration}, {}),
            10000,
            'flow initiation',
          ),
        flowSummary,
      );

      return pass(`flow started through a server action: ${flowSummary(response)}`);
    },
    section: 'Authentication',
  },
  {
    api: 'useThunderID().isSignedIn after reload',
    id: 'restore',
    name: 'Session restore',
    run: async (getContext: () => CapabilityContext) => {
      await waitFor(getContext, (context: CapabilityContext) => !context.sdk.isLoading, 8000);

      return getContext().sdk.isSignedIn
        ? pass('session cookie verified by the server render')
        : skip('no session: sign in, then reload the page');
    },
    section: 'Authentication',
  },
  {
    api: '<SignOutButton /> · signOut()',
    id: 'signout',
    name: 'Sign out',
    run: async (getContext: () => CapabilityContext, {interactive}: RunOptions) => {
      const {sdk} = getContext();

      if (!sdk.isSignedIn) return skip('not signed in');
      if (!interactive) return skip('interactive: press Run to sign out');

      await track('signOut', () => sdkSignOut(sdk));

      return pass('signOut() resolved');
    },
    section: 'Authentication',
  },
  {
    api: 'thunderIDProxy() · middleware.ts',
    id: 'proxy',
    name: 'Proxy (middleware)',
    run: async (getContext: () => CapabilityContext) => {
      const {body, response} = await track(
        'GET /api/proxy-trace',
        () => getJson('/api/proxy-trace'),
        ({response: value}: {response: Response}) => `HTTP ${value.status}`,
      );
      const trace: Record<string, unknown> = (body ?? {}) as Record<string, unknown>;

      if (!response.ok || trace['handledBy'] !== 'thunderIDProxy') {
        return fail(`HTTP ${response.status}: the proxy did not answer; is src/middleware.ts running?`);
      }

      const proxySignedIn = trace['isSignedIn'] === true;
      const clientSignedIn = !!getContext().sdk.isSignedIn;

      if (proxySignedIn !== clientSignedIn) {
        return fail(`proxy says isSignedIn=${proxySignedIn}, client context says ${clientSignedIn}`);
      }

      return pass(`ran on the request, isSignedIn()=${proxySignedIn}`);
    },
    section: 'Server',
  },
  {
    api: 'createRouteMatcher() · protectRoute()',
    id: 'protect',
    name: 'Route protection',
    run: async (getContext: () => CapabilityContext) => {
      const anonymous: Response = await track(
        'GET /protected (anonymous)',
        () => fetch('/protected', {cache: 'no-store', credentials: 'omit', redirect: 'manual'}),
        (value: Response) => (value.type === 'opaqueredirect' ? 'redirected' : `HTTP ${value.status}`),
      );

      if (anonymous.type !== 'opaqueredirect') {
        return fail(`anonymous request was not redirected (HTTP ${anonymous.status})`);
      }
      if (!getContext().sdk.isSignedIn) return pass('anonymous request redirected; sign in to test the allowed path');

      const signedIn: Response = await track(
        'GET /protected (session)',
        () => fetch('/protected', {cache: 'no-store', redirect: 'manual'}),
        (value: Response) => `HTTP ${value.status}`,
      );

      return signedIn.ok
        ? pass('anonymous request redirected, signed-in request allowed')
        : fail(`signed-in request got HTTP ${signedIn.status || 'redirect'}`);
    },
    section: 'Server',
  },
  {
    api: "createRouteMatcher(['/protected(.*)'])",
    id: 'routeMatcher',
    name: 'Route matcher patterns',
    run: async () => {
      const {body} = await getJson('/api/proxy-trace');
      const matcher: Record<string, unknown> =
        ((body ?? {}) as Record<string, Record<string, unknown>>)['routeMatcher'] ?? {};
      const results: Record<string, boolean> = (matcher['results'] ?? {}) as Record<string, boolean>;
      const missed: string[] = Object.keys(results).filter((pathname: string) => !results[pathname]);

      if (!Object.keys(results).length) return fail('the proxy trace has no route matcher results');
      if (missed.length) {
        return fail(`the documented pattern ${asText(matcher['pattern'])} does not match ${missed.join(', ')}`);
      }

      return pass(`${asText(matcher['pattern'])} matches ${Object.keys(results).join(', ')}`);
    },
    section: 'Server',
  },
  {
    api: 'thunderid().getSessionId() in a route handler',
    id: 'routeHandler',
    name: 'Route handler session',
    run: async (getContext: () => CapabilityContext) => {
      const {body, response} = await track(
        'GET /api/session',
        () => getJson('/api/session'),
        ({response: value}: {response: Response}) => `HTTP ${value.status}`,
      );
      const session: Record<string, unknown> = (body ?? {}) as Record<string, unknown>;

      if (!response.ok) return fail(`HTTP ${response.status}`);
      if (session['signedIn'] !== !!getContext().sdk.isSignedIn) {
        return fail(`route handler says signedIn=${String(session['signedIn'])}: ${asText(session['error'])}`);
      }

      return session['signedIn'] ? pass(`session ${asText(session['sessionId'])}`) : pass('no session, as expected');
    },
    section: 'Server',
  },
  {
    api: 'thunderid().getAccessToken() in a server action',
    id: 'serverAction',
    name: 'Server action access token',
    run: async (getContext: () => CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(getContext());

      if (gate) return gate;

      const session: ServerSession = await track('readServerSession', () => readServerSession());

      if (!session.accessToken) return fail(session.error ?? 'no access token in the session cookie');

      const exp: unknown = session.claims?.['exp'];

      return pass(
        typeof exp === 'number'
          ? `JWT, expires in ${formatDuration(exp * 1000 - Date.now())}`
          : `opaque token, ${session.accessToken.length} chars`,
      );
    },
    section: 'Server',
  },
  {
    api: 'useThunderID().refreshToken()',
    id: 'refresh',
    name: 'Token refresh',
    run: async (getContext: () => CapabilityContext) => {
      const {sdk} = getContext();
      const gate: CapabilityResult | null = requireSignedIn(getContext());

      if (gate) return gate;
      if (!sdk.refreshToken) return unavailable('refreshToken is not on the context');

      const result: {expiresAt: number} = await track(
        'refreshToken',
        () => sdk.refreshToken!(),
        (value: {expiresAt: number}) => `expiresAt ${value.expiresAt}`,
      );

      return pass(`new access token, expires in ${formatDuration(result.expiresAt * 1000 - Date.now())}`);
    },
    section: 'Server',
  },
  {
    api: 'backchannelLogout() · POST',
    id: 'backchannel',
    name: 'Back-channel logout endpoint',
    run: async () => {
      const response: Response = await track(
        'POST /api/auth/backchannel-logout',
        () =>
          fetch('/api/auth/backchannel-logout', {
            body: '',
            cache: 'no-store',
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            method: 'POST',
          }),
        (value: Response) => `HTTP ${value.status}`,
      );

      return response.status === 400
        ? pass('mounted; rejects a request without a logout_token (400)')
        : fail(`expected 400 for a missing logout_token, got ${response.status}`);
    },
    section: 'Server',
  },
  {
    api: 'thunderid().exchangeToken()',
    id: 'exchange',
    name: 'Token exchange',
    run: () => skip('needs a grant-specific config; call exchangeToken() from server code'),
    section: 'Server',
  },
  {
    api: 'useThunderID().user',
    id: 'user',
    name: 'User info',
    run: (getContext: () => CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(getContext());

      if (gate) return gate;

      const user = toUser(getContext().sdk.user);

      return user && Object.keys(user).length
        ? pass(getDisplayName(user))
        : fail('user is empty while signed in: /users/me failed on the server');
    },
    section: 'User',
  },
  {
    api: 'useUser().profile',
    id: 'profile',
    name: 'User profile',
    run: (getContext: () => CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(getContext());

      if (gate) return gate;

      const {profile, userSchema} = getContext().user;

      if (!profile || !Object.keys(profile).length) return fail('profile is empty: fetched on the server render');

      return pass(`${Object.keys(profile).length} fields, schema ${userSchema ? 'loaded' : 'missing'}`);
    },
    section: 'User',
  },
  {
    api: '<UserProfile /> · updateProfile()',
    id: 'updateProfile',
    name: 'Update profile',
    run: (getContext: () => CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(getContext());

      if (gate) return gate;

      return skip('writes data: edit a field in Components > UserProfile');
    },
    section: 'User',
  },
  {
    api: 'useOrganization() · switchOrganization()',
    id: 'orgs',
    name: 'Organizations',
    run: () => unavailable('@thunderid/nextjs has no organization API'),
    section: 'User',
  },
  {
    api: 'useI18n() · preferences.i18n',
    id: 'i18n',
    name: 'Translations',
    run: (getContext: () => CapabilityContext) => {
      const {i18n} = getContext();
      const key = 'elements.buttons.signin.text';
      const text: string = i18n.t(key);

      if (!text || text === key) return fail(`t('${key}') returned the key`);

      return pass(`${i18n.currentLanguage}: "${text}", ${Object.keys(i18n.bundles).length} bundles`);
    },
    section: 'UI',
  },
  {
    api: 'useTheme() · ThemeProvider',
    id: 'theme',
    name: 'Theming and dark mode',
    run: (getContext: () => CapabilityContext) => {
      const {theme} = getContext();
      const count: number = Object.keys(theme.theme.cssVariables ?? {}).length;

      if (!count) return fail('theme exposes no CSS variables');

      return pass(`${theme.colorScheme} scheme, ${count} CSS variables`);
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
  getContext: () => CapabilityContext,
  options: RunOptions,
): Promise<CapabilityResult> => {
  try {
    return await capability.run(getContext, options);
  } catch (error) {
    return fail(describeError(error));
  }
};
