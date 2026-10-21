// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  createTheme,
  EmbeddedFlowType,
  executeEmbeddedSignInFlow,
  FlowMetaType,
  getActiveTheme,
  getFlowMeta,
  Hooks,
  HttpResponse,
  OIDCDiscoveryApiResponse,
  UserProfile,
} from '@thunderid/browser';
import {HELPERS, STORY_COUNT} from './helpers/stories';
import playgroundConfig from '../config';
import {client, hookCounts, REGISTERED_HOOKS, refreshSdkState, sdkConfig, sdkState} from '../lib/client';
import {describeError, track} from '../lib/events';
import {checkServerHealth} from '../lib/health';
import {decodeJwt, formatDuration} from '../lib/jwt';
import {asText, getDisplayName} from '../lib/user';

export type CapabilityStatus = 'idle' | 'running' | 'pass' | 'fail' | 'skip' | 'unavailable';

export interface CapabilityResult {
  note: string;
  status: Exclude<CapabilityStatus, 'idle' | 'running'>;
}

export interface RunOptions {
  /** True when the check was started from its own Run button, so it may navigate away. */
  interactive: boolean;
}

export interface Capability {
  api: string;
  id: string;
  name: string;
  run: (options: RunOptions) => Promise<CapabilityResult> | CapabilityResult;
  section: string;
}

const pass = (note: string): CapabilityResult => ({note, status: 'pass'});
const fail = (note: string): CapabilityResult => ({note, status: 'fail'});
const skip = (note: string): CapabilityResult => ({note, status: 'skip'});

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_resolve: (value: T) => void, reject: (reason: Error) => void) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    }),
  ]);

const requireSignedIn = (): CapabilityResult | null => (sdkState.get().signedIn ? null : skip('sign in first'));

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
    api: 'initialize({baseUrl, clientId})',
    id: 'config',
    name: 'Client configuration',
    run: () => {
      if (!sdkConfig.clientId) return fail('VITE_THUNDERID_CLIENT_ID is empty; copy .env.example to .env');
      if (!sdkConfig.baseUrl) return fail('VITE_THUNDERID_BASE_URL is empty');

      return pass(`clientId ${sdkConfig.clientId}`);
    },
    section: 'Setup',
  },
  {
    api: "isInitialized() · on('initialize')",
    id: 'init',
    name: 'Client initialized',
    run: async () => {
      const {initError} = sdkState.get();

      if (initError) return fail(initError);

      const ready: boolean = await withTimeout(client.isInitialized(), 8000, 'isInitialized()');
      const fired: number = hookCounts.get()['initialize'] ?? 0;

      if (!ready) return fail('isInitialized() resolved false');

      return pass(fired ? 'ready; initialize hook fired' : 'ready; initialize hook did not fire');
    },
    section: 'Setup',
  },
  {
    api: 'getDiscoveryResponse()',
    id: 'discovery',
    name: 'OIDC discovery',
    run: async () => {
      const discovery: OIDCDiscoveryApiResponse | null = await track('getDiscoveryResponse', () =>
        withTimeout(client.getDiscoveryResponse(), 8000, 'discovery'),
      );
      const issuer: string = asText(discovery?.issuer);

      return issuer
        ? pass(`issuer ${issuer}`)
        : fail('no discovery document: server unreachable, or CORS blocks this origin');
    },
    section: 'Setup',
  },
  {
    api: 'getOpenIDProviderEndpoints()',
    id: 'endpoints',
    name: 'Provider endpoints',
    run: async () => {
      const endpoints: Record<string, unknown> = (await track('getOpenIDProviderEndpoints', () =>
        withTimeout(client.getOpenIDProviderEndpoints(), 8000, 'endpoints'),
      )) as Record<string, unknown>;
      const resolved: string[] = Object.entries(endpoints)
        .filter(([, value]: [string, unknown]) => typeof value === 'string' && value !== '')
        .map(([key]: [string, unknown]) => key);

      if (!resolved.includes('authorizationEndpoint') || !resolved.includes('tokenEndpoint')) {
        return fail('authorization or token endpoint missing: discovery did not load');
      }

      return pass(`${resolved.length} endpoints resolved`);
    },
    section: 'Setup',
  },
  {
    api: 'getFlowMeta({type: APP, id})',
    id: 'meta',
    name: 'Flow metadata',
    run: async () => {
      if (!playgroundConfig.applicationId) return fail('VITE_THUNDERID_APPLICATION_ID is not set');

      const meta: unknown = await track('getFlowMeta', () =>
        withTimeout(
          getFlowMeta({baseUrl: playgroundConfig.baseUrl, id: playgroundConfig.applicationId, type: FlowMetaType.App}),
          8000,
          'GET /flow/meta',
        ),
      );
      const application: Record<string, unknown> =
        ((meta as Record<string, unknown>)['application'] as Record<string, unknown>) ?? {};

      return pass(`GET /flow/meta resolved${application['name'] ? `: ${asText(application['name'])}` : ''}`);
    },
    section: 'Setup',
  },
  {
    api: 'signIn()',
    id: 'redirect',
    name: 'Sign in (redirect)',
    run: async ({interactive}: RunOptions) => {
      const {signedIn, user} = sdkState.get();

      if (signedIn) return pass(`signed in as ${getDisplayName(user)}`);
      if (!interactive) return skip('interactive: press Run to redirect to ThunderID');

      await track('signIn', () => client.signIn());

      return skip('redirecting to ThunderID');
    },
    section: 'Authentication',
  },
  {
    api: "signIn() on ?code= · on('sign-in')",
    id: 'callback',
    name: 'Sign-in callback',
    run: () => {
      const {callback} = sdkState.get();

      if (!callback.handled) return skip('runs when ThunderID redirects back with ?code=');
      if (callback.error) return fail(callback.error);

      const fired: number = hookCounts.get()['sign-in'] ?? 0;

      return pass(`code exchanged${fired ? '; sign-in hook fired' : ''}`);
    },
    section: 'Authentication',
  },
  {
    api: 'executeEmbeddedSignInFlow({applicationId, flowType})',
    id: 'native',
    name: 'Sign in (app-native flow)',
    run: async () => {
      if (!playgroundConfig.applicationId) return fail('VITE_THUNDERID_APPLICATION_ID is not set');

      const response: unknown = await track(
        'executeEmbeddedSignInFlow',
        () =>
          withTimeout(
            executeEmbeddedSignInFlow({
              baseUrl: playgroundConfig.baseUrl,
              payload: {applicationId: playgroundConfig.applicationId, flowType: EmbeddedFlowType.Authentication},
            }),
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
    run: async () => {
      const result: unknown = await track(
        'signInSilently',
        () => withTimeout(client.signInSilently(), 15000, 'signInSilently'),
        (value: unknown) => (value ? 'session renewed' : `returned ${String(value)}`),
      );

      await refreshSdkState();

      if (result === undefined) return skip('skipped: an auth response is still in the URL');

      return result
        ? pass('session renewed without interaction')
        : fail('returned false: login_required or no session');
    },
    section: 'Authentication',
  },
  {
    api: 'isSignedIn() after reload',
    id: 'restore',
    name: 'Session restore',
    run: async () => {
      const signedIn: boolean = await client.isSignedIn();
      const {restored} = sdkState.get();

      if (!signedIn) return skip('no session: sign in, then reload the page');

      return pass(restored ? 'session restored from storage on load' : 'signed in; reload to test restore');
    },
    section: 'Authentication',
  },
  {
    api: 'isSessionActive()',
    id: 'active',
    name: 'Session status flag',
    run: async () => {
      const active: boolean | undefined = await client.isSessionActive();

      return active ? pass('session status is active') : skip(`session status is ${String(active)}`);
    },
    section: 'Authentication',
  },
  {
    api: "signOut() · on('sign-out')",
    id: 'signout',
    name: 'Sign out',
    run: async ({interactive}: RunOptions) => {
      if (!sdkState.get().signedIn) {
        return (hookCounts.get()['sign-out'] ?? 0) > 0 ? pass('sign-out hook fired on return') : skip('not signed in');
      }
      if (!interactive) return skip('interactive: press Run to sign out');

      const url: string = await track('signOut', () => client.signOut());

      return pass(`signOut() resolved: ${url || 'local sign out'}`);
    },
    section: 'Authentication',
  },
  {
    api: 'getAccessToken()',
    id: 'accessToken',
    name: 'Access token',
    run: async () => {
      const gate: CapabilityResult | null = requireSignedIn();

      if (gate) return gate;

      const token: string = await track('getAccessToken', () => client.getAccessToken());

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
    run: async () => {
      const gate: CapabilityResult | null = requireSignedIn();

      if (gate) return gate;

      const idToken: string = await track('getIdToken', () => client.getIdToken());
      const claims: Record<string, unknown> = (await track('getDecodedIdToken', () =>
        client.getDecodedIdToken(),
      )) as Record<string, unknown>;

      if (!idToken) return fail('empty ID token');

      return pass(`sub ${asText(claims['sub']) || '?'}, ${Object.keys(claims).length} claims`);
    },
    section: 'Session and tokens',
  },
  {
    api: 'decodeJwtToken()',
    id: 'decode',
    name: 'Decode a JWT',
    run: async () => {
      const gate: CapabilityResult | null = requireSignedIn();

      if (gate) return gate;

      const token: string = await client.getAccessToken();

      if (!decodeJwt(token)) return skip('access token is opaque; nothing to decode');

      const payload: Record<string, unknown> = await track('decodeJwtToken', () => client.decodeJwtToken(token));

      return pass(`${Object.keys(payload).length} claims, iss ${asText(payload['iss']) || '?'}`);
    },
    section: 'Session and tokens',
  },
  {
    api: 'refreshAccessToken()',
    id: 'refresh',
    name: 'Token refresh',
    run: async () => {
      const gate: CapabilityResult | null = requireSignedIn();

      if (gate) return gate;

      const before: string = await client.getAccessToken();

      try {
        await track('refreshAccessToken', () => withTimeout(client.refreshAccessToken(), 10000, 'refresh'));
      } catch (error) {
        return fail(`${describeError(error)}: enable refresh tokens for the app or add offline_access`);
      }

      const after: string = await client.getAccessToken();

      await refreshSdkState();

      return pass(after !== before ? 'new access token issued' : 'refresh resolved; token unchanged');
    },
    section: 'Session and tokens',
  },
  {
    api: 'httpRequest() · http-request-* hooks',
    id: 'http',
    name: 'Authenticated request',
    run: async () => {
      const gate: CapabilityResult | null = requireSignedIn();

      if (gate) return gate;

      const before: Record<string, number> = hookCounts.get();
      const response: HttpResponse | undefined = await track(
        'httpRequest',
        () => client.httpRequest({method: 'GET', url: `${playgroundConfig.baseUrl}/users/me`}),
        (value: HttpResponse | undefined) => `GET /users/me ${String(value?.status ?? '')}`,
      );
      const after: Record<string, number> = hookCounts.get();
      const fired: string[] = Object.keys(after).filter(
        (hook: string) => hook.startsWith('http-request') && (after[hook] ?? 0) > (before[hook] ?? 0),
      );

      if (!response?.status || response.status >= 400) {
        return fail(`GET /users/me ${String(response?.status ?? 'no response')}`);
      }

      const expected: string[] = [Hooks.HttpRequestStart, Hooks.HttpRequestSuccess, Hooks.HttpRequestFinish];
      const missing: string[] = expected.filter((hook: string) => !fired.includes(hook));

      if (missing.length > 0) {
        return fail(`GET /users/me ${response.status}; hooks did not fire: ${missing.join(', ')}`);
      }

      return pass(`GET /users/me ${response.status}; hooks: ${fired.join(', ') || 'none fired'}`);
    },
    section: 'Session and tokens',
  },
  {
    api: 'disableHttpHandler() · enableHttpHandler()',
    id: 'httpHandler',
    name: 'HTTP handler toggle',
    run: async () => {
      const off: boolean | undefined = await client.disableHttpHandler();
      const on: boolean | undefined = await client.enableHttpHandler();

      return off && on ? pass('handler disabled, then re-enabled') : fail(`disable=${off} enable=${on}`);
    },
    section: 'Session and tokens',
  },
  {
    api: "revokeAccessToken() · on('revoke-access-token')",
    id: 'revoke',
    name: 'Revoke access token',
    run: async ({interactive}: RunOptions) => {
      const gate: CapabilityResult | null = requireSignedIn();

      if (gate) return gate;
      if (!interactive) return skip('ends the session: press Run to revoke');

      await track('revokeAccessToken', () => client.revokeAccessToken());
      await refreshSdkState();

      return pass(sdkState.get().signedIn ? 'revoked; session still marked signed in' : 'revoked; signed out');
    },
    section: 'Session and tokens',
  },
  {
    api: 'exchangeToken()',
    id: 'exchange',
    name: 'Token exchange',
    run: () => skip('needs a grant-specific config; call exchangeToken({id, data, ...}) from your app'),
    section: 'Session and tokens',
  },
  {
    api: 'getUser()',
    id: 'user',
    name: 'User info',
    run: async () => {
      const gate: CapabilityResult | null = requireSignedIn();

      if (gate) return gate;

      const user: Record<string, unknown> = (await track('getUser', () => client.getUser())) as Record<string, unknown>;

      return pass(`${getDisplayName(user)}, ${Object.keys(user).length} attributes`);
    },
    section: 'User',
  },
  {
    api: 'getUserProfile()',
    id: 'profile',
    name: 'User profile',
    run: async () => {
      const gate: CapabilityResult | null = requireSignedIn();

      if (gate) return gate;

      const profile: UserProfile = await track('getUserProfile', () => client.getUserProfile());

      return pass(`profile loaded, ${Object.keys(profile.profile).length} attributes`);
    },
    section: 'User',
  },
  {
    api: 'on(Hooks.*)',
    id: 'hooks',
    name: 'Event hooks',
    run: () => {
      const counts: Record<string, number> = hookCounts.get();
      const fired: string[] = REGISTERED_HOOKS.filter((hook: string) => (counts[hook] ?? 0) > 0);

      return pass(`${REGISTERED_HOOKS.length} hooks subscribed, ${fired.length} fired: ${fired.join(', ') || 'none'}`);
    },
    section: 'Events',
  },
  {
    api: 'getActiveTheme() · createTheme()',
    id: 'theme',
    name: 'Theme detection',
    run: () => {
      const mode = getActiveTheme('system');
      const count: number = Object.keys(createTheme({}, mode === 'dark').cssVariables).length;

      return pass(`system resolves to ${mode}, ${count} CSS variables`);
    },
    section: 'UI helpers',
  },
  {
    api: 'UI helper explorer',
    id: 'helpers',
    name: 'UI helpers',
    run: () => pass(`${HELPERS.length} helpers · ${STORY_COUNT} stories`),
    section: 'UI helpers',
  },
];

export const runCapability = async (capability: Capability, options: RunOptions): Promise<CapabilityResult> => {
  try {
    return await capability.run(options);
  } catch (error) {
    return fail(describeError(error));
  }
};
