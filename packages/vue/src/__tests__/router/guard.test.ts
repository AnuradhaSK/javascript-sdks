// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {afterEach, describe, expect, it, vi} from 'vitest';
import {type App, type Component, createApp, defineComponent, h, type VNode} from 'vue';
import {createMemoryHistory, createRouter, type Router, RouterView} from 'vue-router';
import ThunderIDProvider from '../../providers/ThunderIDProvider';
import {createThunderIDGuard} from '../../router/guard';

const clientState: {signedIn: boolean} = vi.hoisted(() => ({signedIn: false}));

vi.mock('../../ThunderIDVueClient', () => ({
  default: class {
    getConfiguration = vi.fn(() => Promise.resolve({}));
    getDecodedIdToken = vi.fn(() => Promise.resolve({sub: 'user-1'}));
    getDiscoveryResponse = vi.fn(() => Promise.resolve(null));
    initialize = vi.fn(() => Promise.resolve(true));
    isInitialized = vi.fn(() => Promise.resolve(true));
    isLoading = vi.fn(() => false);
    isSignedIn = vi.fn(() => Promise.resolve(clientState.signedIn));
    on = vi.fn(() => Promise.resolve());
  },
}));

const page = (name: string): Component => defineComponent({name, render: (): VNode => h('div', name)});

describe('createThunderIDGuard with Vue Router', () => {
  let app: App | undefined;

  afterEach(() => {
    app?.unmount();
    app = undefined;
  });

  const mountApp = async (): Promise<Router> => {
    const router: Router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {component: page('Home'), path: '/'},
        {component: page('SignedOut'), path: '/signed-out'},
        {
          beforeEnter: createThunderIDGuard({initTimeout: 3000, redirectTo: '/signed-out'}),
          component: page('Protected'),
          path: '/protected',
        },
      ],
    });

    app = createApp({
      render: () =>
        h(
          ThunderIDProvider,
          {
            baseUrl: 'https://idp.example.com',
            clientId: 'guard-test-client',
            preferences: {user: {fetchUserProfile: false}},
          },
          {default: () => h(RouterView)},
        ),
    });
    app.use(router);
    app.mount(document.createElement('div'));
    await router.isReady();

    return router;
  };

  it('allows navigation when the user is signed in', async () => {
    clientState.signedIn = true;
    const router: Router = await mountApp();

    await router.push('/protected');

    expect(router.currentRoute.value.path).toBe('/protected');
  });

  it('redirects when the user is not signed in', async () => {
    clientState.signedIn = false;
    const router: Router = await mountApp();

    await router.push('/protected');

    expect(router.currentRoute.value.path).toBe('/signed-out');
  });
});
