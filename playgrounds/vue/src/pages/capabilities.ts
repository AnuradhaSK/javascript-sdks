// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EmbeddedFlowType, SessionData} from '@thunderid/browser';
import {
  createCallbackRoute,
  createThunderIDGuard,
  FlowMetaContextValue,
  I18nContextValue,
  NavigationGuardReturn,
  THUNDERID_KEY,
  ThemeContextValue,
  ThunderIDContext,
  ThunderIDRouteRecord,
  UserContextValue,
} from '@thunderid/vue';
import {App, inject} from 'vue';
import {COMPONENTS, STORY_COUNT} from './explorer/stories';
import playgroundConfig from '../config';
import {describeError, track} from '../lib/events';
import {checkServerHealth} from '../lib/health';
import {decodeJwt, formatDuration} from '../lib/jwt';
import {asText, toUser} from '../lib/sdk';
import {getDisplayName} from '../lib/user';

export type CapabilityStatus = 'idle' | 'running' | 'pass' | 'fail' | 'skip' | 'unavailable';

export interface CapabilityResult {
  note: string;
  status: Exclude<CapabilityStatus, 'idle' | 'running'>;
}

/**
 * Everything a check needs. The SDK contexts hold refs, so reading `.value` always sees the latest
 * state without re-reading the context.
 */
export interface CapabilityContext {
  app: App;
  flowMeta: FlowMetaContextValue;
  i18n: I18nContextValue;
  sdk: ThunderIDContext;
  theme: ThemeContextValue;
  user: UserContextValue;
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

/**
 * Polls until the predicate holds or the timeout elapses.
 */
const waitFor = async (predicate: () => boolean | Promise<boolean>, ms: number): Promise<boolean> => {
  const deadline: number = Date.now() + ms;

  while (Date.now() < deadline) {
    if (await predicate()) return true;
    await sleep(150);
  }

  return predicate();
};

/** What the guard passed to `next()`; `undefined` means navigation was allowed. */
interface GuardTarget {
  next: NavigationGuardReturn;
}

const requireSignedIn = ({sdk}: CapabilityContext): CapabilityResult | null =>
  sdk.isSignedIn.value ? null : skip('sign in first');

const flowSummary = (response: unknown): string => {
  const flow: Record<string, unknown> = (response ?? {}) as Record<string, unknown>;
  const data: Record<string, unknown> = (flow['data'] ?? {}) as Record<string, unknown>;
  const components: unknown[] = Array.isArray(data['components']) ? (data['components'] as unknown[]) : [];

  return `flowStatus=${asText(flow['flowStatus']) || 'unknown'}, ${components.length} components`;
};

export const CAPABILITIES: Capability[] = [
  {
    api: 'GET /health/liveness',
    id: 'server',
    name: 'Server reachable',
    run: async () => {
      const health = await checkServerHealth();

      return health.state === 'up' ? pass(`${playgroundConfig.baseUrl} is healthy`) : fail(health.detail);
    },
    section: 'Setup',
  },
  {
    api: '<ThunderIDProvider :client-id :base-url>',
    id: 'config',
    name: 'Provider configuration',
    run: ({sdk}: CapabilityContext) => {
      if (!sdk.clientId) return fail('VITE_THUNDERID_CLIENT_ID is empty; copy .env.example to .env');
      if (!sdk.baseUrl) return fail('VITE_THUNDERID_BASE_URL is empty');

      return pass(`clientId ${sdk.clientId}`);
    },
    section: 'Setup',
  },
  {
    api: 'useThunderID().isInitialized',
    id: 'init',
    name: 'Provider initialized',
    run: async ({sdk}: CapabilityContext) =>
      (await waitFor(() => sdk.isInitialized.value, 8000))
        ? pass('client ready')
        : fail('isInitialized stayed false for 8s'),
    section: 'Setup',
  },
  {
    api: "getStorageManager().getOIDCProviderMetaDataParameter('issuer')",
    id: 'discovery',
    name: 'OIDC discovery',
    run: async ({sdk}: CapabilityContext) => {
      const readIssuer = async (): Promise<string> =>
        asText(await sdk.getStorageManager().getOIDCProviderMetaDataParameter('issuer'));

      await waitFor(async () => !!(await readIssuer()), 5000);

      const issuer: string = await readIssuer();

      return issuer
        ? pass(`issuer ${issuer}`)
        : fail('no issuer in SDK storage: discovery did not load when the provider mounted');
    },
    section: 'Setup',
  },
  {
    api: 'useFlowMeta().meta',
    id: 'meta',
    name: 'Flow metadata',
    run: async ({flowMeta}: CapabilityContext) => {
      await waitFor(() => !!flowMeta.meta.value || !flowMeta.isLoading.value, 5000);

      if (flowMeta.meta.value) return pass('GET /flow/meta resolved');
      if (flowMeta.error.value) return fail(flowMeta.error.value.message);

      return fail('meta is null: /flow/meta failed or needs applicationId');
    },
    section: 'Setup',
  },
  {
    api: '<SignInButton /> · signIn()',
    id: 'redirect',
    name: 'Sign in (redirect)',
    run: async ({sdk}: CapabilityContext, {interactive}: RunOptions) => {
      if (sdk.isSignedIn.value) return pass(`signed in as ${getDisplayName(toUser(sdk.user.value))}`);
      if (!interactive) return skip('interactive: press Run to redirect to ThunderID');

      await track('signIn', () => sdk.signIn());

      return skip('redirecting to ThunderID');
    },
    section: 'Authentication',
  },
  {
    api: '<SignIn /> · signIn({applicationId, flowType})',
    id: 'native',
    name: 'Sign in (app-native flow)',
    run: async ({sdk}: CapabilityContext) => {
      if (!sdk.applicationId) return fail('VITE_THUNDERID_APPLICATION_ID is not set');

      const response: unknown = await track(
        'signIn:embedded',
        () =>
          withTimeout(
            sdk.signIn({applicationId: sdk.applicationId, flowType: EmbeddedFlowType.Authentication}),
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
    api: '<SignUp /> · signUp({applicationId, flowType})',
    id: 'signup',
    name: 'Sign up (app-native flow)',
    run: async ({sdk}: CapabilityContext) => {
      if (!sdk.applicationId) return fail('VITE_THUNDERID_APPLICATION_ID is not set');

      const response: unknown = await track(
        'signUp:embedded',
        () =>
          withTimeout(
            sdk.signUp({applicationId: sdk.applicationId, flowType: EmbeddedFlowType.Registration}),
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
    api: '<Recovery /> · recover()',
    id: 'recovery',
    name: 'Account recovery',
    run: () => unavailable('@thunderid/vue has no recover() or <Recovery /> component'),
    section: 'Authentication',
  },
  {
    api: 'signInSilently()',
    id: 'silent',
    name: 'Silent sign-in',
    run: async ({sdk}: CapabilityContext) => {
      const result: unknown = await track(
        'signInSilently',
        () => withTimeout(sdk.signInSilently(), 15000, 'signInSilently'),
        (value: unknown) => (value ? 'session renewed' : 'returned false'),
      );

      return result
        ? pass('session renewed without interaction')
        : fail('returned false: login_required or no session');
    },
    section: 'Authentication',
  },
  {
    api: 'useThunderID().isSignedIn after reload',
    id: 'restore',
    name: 'Session restore',
    run: async ({sdk}: CapabilityContext) => {
      await waitFor(() => sdk.isInitialized.value, 8000);

      return sdk.isSignedIn.value
        ? pass('session restored from storage')
        : skip('no session: sign in, then reload the page');
    },
    section: 'Authentication',
  },
  {
    api: '<SignOutButton /> · signOut()',
    id: 'signout',
    name: 'Sign out',
    run: async ({sdk}: CapabilityContext, {interactive}: RunOptions) => {
      if (!sdk.isSignedIn.value) return skip('not signed in');
      if (!interactive) return skip('interactive: press Run to sign out');

      await track('signOut', () => sdk.signOut());

      return pass('signOut() resolved');
    },
    section: 'Authentication',
  },
  {
    api: 'getAccessToken()',
    id: 'accessToken',
    name: 'Access token',
    run: async (context: CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(context);

      if (gate) return gate;

      const token: string = await track('getAccessToken', () => context.sdk.getAccessToken());

      if (!token) return fail('empty access token');

      const exp: unknown = decodeJwt(token)?.payload['exp'];

      return pass(
        typeof exp === 'number'
          ? `JWT, expires in ${formatDuration(exp * 1000 - Date.now())}`
          : `opaque token, ${token.length} chars`,
      );
    },
    section: 'Session and tokens',
  },
  {
    api: 'getIdToken() · getDecodedIdToken()',
    id: 'idToken',
    name: 'ID token and claims',
    run: async (context: CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(context);

      if (gate) return gate;

      const idToken: string = await track('getIdToken', () => context.sdk.getIdToken());
      const claims: Record<string, unknown> = (await track('getDecodedIdToken', () =>
        context.sdk.getDecodedIdToken(),
      )) as Record<string, unknown>;

      if (!idToken) return fail('empty ID token');

      return pass(`sub ${asText(claims['sub']) || '?'}, ${Object.keys(claims).length} claims`);
    },
    section: 'Session and tokens',
  },
  {
    api: 'getStorageManager().getSessionData()',
    id: 'refresh',
    name: 'Token refresh',
    run: async (context: CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(context);

      if (gate) return gate;

      const session: Partial<SessionData> = (await context.sdk.getStorageManager().getSessionData()) ?? {};

      if (!session.refresh_token) {
        return fail('no refresh_token in session: add offline_access or enable refresh tokens for the app');
      }

      return pass('refresh_token present; the browser client refreshes it on expiry');
    },
    section: 'Session and tokens',
  },
  {
    api: 'http.request()',
    id: 'http',
    name: 'Authenticated request',
    run: async (context: CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(context);

      if (gate) return gate;

      const {sdk} = context;
      const response: {status?: number} = await track(
        'http.request',
        () => sdk.http.request({method: 'GET', url: `${sdk.baseUrl}/users/me`}),
        (value: {status?: number}) => `GET /users/me ${String(value?.status ?? '')}`,
      );

      return response?.status && response.status < 400
        ? pass(`GET /users/me ${response.status}`)
        : fail(`GET /users/me ${String(response?.status ?? 'no response')}`);
    },
    section: 'Session and tokens',
  },
  {
    api: 'exchangeToken()',
    id: 'exchange',
    name: 'Token exchange',
    run: () => skip('needs a grant-specific config; call exchangeToken() from your app'),
    section: 'Session and tokens',
  },
  {
    api: 'useThunderID().user',
    id: 'user',
    name: 'User info',
    run: (context: CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(context);

      if (gate) return gate;

      const user = toUser(context.sdk.user.value);

      return user ? pass(getDisplayName(user)) : fail('user is null while signed in');
    },
    section: 'User',
  },
  {
    api: 'useUser().revalidateProfile()',
    id: 'profile',
    name: 'User profile',
    run: async (context: CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(context);

      if (gate) return gate;

      const {user} = context;

      await track('revalidateProfile', () => user.revalidateProfile());

      if (!user.profile.value) return fail('profile is null after revalidateProfile()');

      return pass(
        `${Object.keys(user.profile.value).length} fields, schema ${user.userSchema?.value ? 'loaded' : 'missing'}`,
      );
    },
    section: 'User',
  },
  {
    api: '<UserProfile /> · updateProfile()',
    id: 'updateProfile',
    name: 'Update profile',
    run: (context: CapabilityContext) => requireSignedIn(context) ?? skip('writes data: edit a field in Components'),
    section: 'User',
  },
  {
    api: 'useOrganization() · switchOrganization()',
    id: 'orgs',
    name: 'Organizations',
    run: () => unavailable('@thunderid/vue has no organization API'),
    section: 'User',
  },
  {
    api: 'createThunderIDGuard()',
    id: 'guard',
    name: 'Route guard',
    run: async ({app, sdk}: CapabilityContext) => {
      // Vue Router runs guards inside app.runWithContext(), so the guard's inject() sees only
      // app-level provides. <ThunderIDProvider> provides its context there too; probe that first,
      // then run the guard the same way.
      const visible: boolean = app.runWithContext(() => !!inject(THUNDERID_KEY, null));
      const target: GuardTarget = await new Promise((resolve: (value: GuardTarget) => void) => {
        const guard = createThunderIDGuard({initTimeout: 3000, redirectTo: '/signed-out'});

        void app.runWithContext(() =>
          guard(
            {fullPath: '/protected', path: '/protected', query: {}},
            {fullPath: '/', path: '/'},
            (next?: NavigationGuardReturn) => resolve({next}),
          ),
        );
      });
      const allowed: boolean = target.next === undefined;
      const outcome: string = allowed ? 'allowed' : `redirected to ${JSON.stringify(target.next)}`;

      if (!visible) {
        return fail(`${outcome}: inject(THUNDERID_KEY) is empty in app context; is <ThunderIDProvider> mounted?`);
      }

      const expected: boolean = sdk.isSignedIn.value === allowed;

      return expected ? pass(outcome) : fail(`${outcome} while isSignedIn=${String(sdk.isSignedIn.value)}`);
    },
    section: 'Routing',
  },
  {
    api: 'createCallbackRoute()',
    id: 'callback',
    name: 'Callback route',
    run: () => {
      const route: ThunderIDRouteRecord = createCallbackRoute({path: '/callback'});

      return route.component ? pass(`route record for ${route.path} with <Callback />`) : fail('no component');
    },
    section: 'Routing',
  },
  {
    api: 'useI18n() · preferences.i18n',
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
