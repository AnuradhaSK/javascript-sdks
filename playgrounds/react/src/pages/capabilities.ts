// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EmbeddedFlowType} from '@thunderid/browser';
import type {I18nContextValue, ThemeContextValue, ThunderIDContextProps, UserContextProps} from '@thunderid/react';
import {COMPONENTS, STORY_COUNT} from './explorer/stories';
import playgroundConfig from '../config';
import {describeError, track} from '../lib/events';
import {checkServerHealth} from '../lib/health';
import {decodeJwt, formatDuration} from '../lib/jwt';
import {asText, sdkRecover, sdkSignIn, sdkSignOut, sdkSignUp, sdkStorage, SdkStorageManager, toUser} from '../lib/sdk';
import {getDisplayName} from '../lib/user';

export type CapabilityStatus = 'idle' | 'running' | 'pass' | 'fail' | 'skip' | 'unavailable';

export interface CapabilityResult {
  note: string;
  status: Exclude<CapabilityStatus, 'idle' | 'running'>;
}

export interface CapabilityContext {
  i18n: I18nContextValue;
  sdk: ThunderIDContextProps;
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
    api: '<ThunderIDProvider clientId baseUrl />',
    id: 'config',
    name: 'Provider configuration',
    run: (getContext: () => CapabilityContext) => {
      const {sdk} = getContext();

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
    run: async (getContext: () => CapabilityContext) =>
      (await waitFor(getContext, (context: CapabilityContext) => context.sdk.isInitialized, 8000))
        ? pass('client ready')
        : fail('isInitialized stayed false for 8s'),
    section: 'Setup',
  },
  {
    api: 'useThunderID().discovery.wellKnown',
    id: 'discovery',
    name: 'OIDC discovery',
    run: async (getContext: () => CapabilityContext) => {
      await waitFor(getContext, (context: CapabilityContext) => !!context.sdk.discovery.wellKnown?.issuer, 5000);

      const issuer: string = asText(getContext().sdk.discovery.wellKnown?.issuer);

      return issuer
        ? pass(`issuer ${issuer}`)
        : fail('wellKnown has no issuer: discovery not loaded into SDK storage yet');
    },
    section: 'Setup',
  },
  {
    api: 'useThunderID().meta',
    id: 'meta',
    name: 'Flow metadata',
    run: async (getContext: () => CapabilityContext) => {
      const loaded: boolean = await waitFor(
        getContext,
        (context: CapabilityContext) => !!context.sdk.meta || !context.sdk.isMetaLoading,
        5000,
      );
      const {meta} = getContext().sdk;

      if (loaded && meta) return pass('GET /flow/meta resolved');

      return fail('meta is null: /flow/meta failed or needs applicationId');
    },
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

      if (!sdk.applicationId) return fail('VITE_THUNDERID_APPLICATION_ID is not set');

      const response: unknown = await track(
        'signIn:embedded',
        () =>
          withTimeout(
            sdkSignIn(sdk, {applicationId: sdk.applicationId, flowType: EmbeddedFlowType.Authentication}),
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
    run: async (getContext: () => CapabilityContext) => {
      const {sdk} = getContext();

      if (!sdk.applicationId) return fail('VITE_THUNDERID_APPLICATION_ID is not set');

      const response: unknown = await track(
        'signUp:embedded',
        () =>
          withTimeout(
            sdkSignUp(sdk, {applicationId: sdk.applicationId, flowType: EmbeddedFlowType.Registration}),
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
    api: '<Recovery /> · recover({applicationId, flowType})',
    id: 'recovery',
    name: 'Account recovery',
    run: async (getContext: () => CapabilityContext) => {
      const {sdk} = getContext();

      if (!sdk.applicationId) return fail('VITE_THUNDERID_APPLICATION_ID is not set');

      const response: unknown = await track(
        'recover',
        () =>
          withTimeout(
            sdkRecover(sdk, {applicationId: sdk.applicationId, flowType: EmbeddedFlowType.Recovery}),
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
    api: 'signInSilently()',
    id: 'silent',
    name: 'Silent sign-in',
    run: async (getContext: () => CapabilityContext) => {
      const {sdk} = getContext();
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
    run: async (getContext: () => CapabilityContext) => {
      await waitFor(getContext, (context: CapabilityContext) => context.sdk.isInitialized, 8000);

      return getContext().sdk.isSignedIn
        ? pass('session restored from storage')
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
    api: 'getAccessToken()',
    id: 'accessToken',
    name: 'Access token',
    run: async (getContext: () => CapabilityContext) => {
      const {sdk} = getContext();
      const gate: CapabilityResult | null = requireSignedIn(getContext());

      if (gate) return gate;

      const token: string = await track('getAccessToken', () => sdk.getAccessToken());

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
    run: async (getContext: () => CapabilityContext) => {
      const {sdk} = getContext();
      const gate: CapabilityResult | null = requireSignedIn(getContext());

      if (gate) return gate;

      const idToken: string = await track('getIdToken', () => sdk.getIdToken());
      const claims: Record<string, unknown> = (await track('getDecodedIdToken', () =>
        sdk.getDecodedIdToken(),
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
    run: async (getContext: () => CapabilityContext) => {
      const {sdk} = getContext();
      const gate: CapabilityResult | null = requireSignedIn(getContext());

      if (gate) return gate;

      const storage: SdkStorageManager | null = await sdkStorage(sdk);
      const session: Record<string, unknown> = (await storage?.getSessionData()) ?? {};

      if (!session['refresh_token']) {
        return fail('no refresh_token in session: add offline_access or enable refresh tokens for the app');
      }

      return pass('refresh_token present; ThunderIDProvider schedules auto refresh');
    },
    section: 'Session and tokens',
  },
  {
    api: 'http.request()',
    id: 'http',
    name: 'Authenticated request',
    run: async (getContext: () => CapabilityContext) => {
      const {sdk} = getContext();
      const gate: CapabilityResult | null = requireSignedIn(getContext());

      if (gate) return gate;

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
    run: (getContext: () => CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(getContext());

      if (gate) return gate;

      const user = toUser(getContext().sdk.user);

      return user ? pass(getDisplayName(user)) : fail('user is null while signed in');
    },
    section: 'User',
  },
  {
    api: 'useUser().revalidateProfile()',
    id: 'profile',
    name: 'User profile',
    run: async (getContext: () => CapabilityContext) => {
      const gate: CapabilityResult | null = requireSignedIn(getContext());

      if (gate) return gate;

      await track('revalidateProfile', () => getContext().user.revalidateProfile());

      const {profile, userSchema} = getContext().user;

      if (!profile) return fail('profile is null after revalidateProfile()');

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
    run: () => unavailable('@thunderid/react has no organization API'),
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
