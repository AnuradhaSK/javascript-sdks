// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/typedef, @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type */

import {afterEach, beforeEach, describe, expect, expectTypeOf, it, vi} from 'vitest';

import type {ThunderIDNuxtConfig} from '../../src/runtime/types';

const viteConfigExtenders: ((config: Record<string, any>) => void)[] = [];

vi.mock('@nuxt/kit', () => ({
  addComponent: vi.fn(),
  addImports: vi.fn(),
  addPlugin: vi.fn(),
  addRouteMiddleware: vi.fn(),
  addServerHandler: vi.fn(),
  addServerPlugin: vi.fn(),
  createResolver: () => ({resolve: (path: string) => path}),
  // Hand back the module definition so the test can call `setup` directly.
  defineNuxtModule: (definition: unknown) => definition,
  extendViteConfig: (extender: (config: Record<string, any>) => void) => {
    viteConfigExtenders.push(extender);
  },
}));

const {default: thunderIDModule} = await import('../../src/module');

const setupModule = (userOptions: ThunderIDNuxtConfig) => {
  const nuxt = {options: {runtimeConfig: {public: {}}}} as any;
  (thunderIDModule as any).setup(userOptions, nuxt);
  return nuxt.options.runtimeConfig;
};

const ENV_KEYS = ['NUXT_PUBLIC_THUNDERID_BASE_URL', 'NUXT_PUBLIC_THUNDERID_CLIENT_ID'];

beforeEach(() => {
  viteConfigExtenders.length = 0;
  ENV_KEYS.forEach((key) => vi.stubEnv(key, undefined as unknown as string));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('@thunderid/nuxt module', () => {
  describe('scopes', () => {
    it('uses an array of scopes from nuxt.config as given, without adding the default scopes to it', () => {
      const runtimeConfig = setupModule({scopes: ['openid', 'profile', 'email']});

      expect(runtimeConfig.public.thunderid.scopes).toEqual(['openid', 'profile', 'email']);
    });

    it('lets an array of scopes in runtimeConfig replace the scopes from nuxt.config', () => {
      const nuxt = {
        options: {runtimeConfig: {public: {thunderid: {scopes: ['openid', 'groups']}}}},
      } as any;
      (thunderIDModule as any).setup({scopes: ['openid', 'profile']}, nuxt);

      expect(nuxt.options.runtimeConfig.public.thunderid.scopes).toEqual(['openid', 'groups']);
    });

    it('defaults to openid and profile', () => {
      expect(setupModule({}).public.thunderid.scopes).toEqual(['openid', 'profile']);
    });
  });

  describe('baseUrl', () => {
    it('is optional in the config type, since NUXT_PUBLIC_THUNDERID_BASE_URL can supply it', () => {
      expectTypeOf<{clientId: string}>().toExtend<ThunderIDNuxtConfig>();
    });

    it('keeps the key in the runtime config when nothing sets it, so the environment can set it at runtime', () => {
      const runtimeConfig = setupModule({clientId: 'client'});

      expect(JSON.parse(JSON.stringify(runtimeConfig.public.thunderid))).toHaveProperty('baseUrl', '');
    });

    it('takes the base URL from NUXT_PUBLIC_THUNDERID_BASE_URL when nuxt.config has none', () => {
      vi.stubEnv('NUXT_PUBLIC_THUNDERID_BASE_URL', 'https://localhost:8090');

      expect(setupModule({clientId: 'client'}).public.thunderid.baseUrl).toBe('https://localhost:8090');
    });
  });

  describe('optimizeDeps', () => {
    it('resolves every pre-bundled package through @thunderid/nuxt, so the application need not depend on it', () => {
      setupModule({});
      const viteConfig: Record<string, any> = {};
      viteConfigExtenders.forEach((extend) => extend(viteConfig));

      const include: string[] = viteConfig['optimizeDeps'].include;
      expect(include).toEqual([
        '@thunderid/nuxt > @thunderid/browser',
        '@thunderid/nuxt > @thunderid/browser > @thunderid/javascript',
        '@thunderid/nuxt > @thunderid/vue',
        '@thunderid/nuxt > @thunderid/browser > base64url',
        '@thunderid/nuxt > @thunderid/browser > fast-sha256',
      ]);
    });

    it('keeps the entries the application already listed', () => {
      setupModule({});
      const viteConfig: Record<string, any> = {optimizeDeps: {include: ['lodash']}};
      viteConfigExtenders.forEach((extend) => extend(viteConfig));

      expect(viteConfig['optimizeDeps'].include[0]).toBe('lodash');
      expect(viteConfig['optimizeDeps'].include).toHaveLength(6);
    });
  });
});
