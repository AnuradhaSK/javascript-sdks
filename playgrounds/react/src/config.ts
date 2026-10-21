// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

export type StorageMode = 'sessionStorage' | 'localStorage' | 'browserMemory';

export interface PlaygroundConfig {
  afterSignInUrl: string;
  afterSignOutUrl: string;
  applicationId?: string;
  baseUrl: string;
  clientId: string;
  expressPlaygroundUrl: string;
  scopes: string[];
  storage?: StorageMode;
}

const env: Record<string, string | undefined> = import.meta.env as unknown as Record<string, string | undefined>;

const read = (key: string): string | undefined => {
  const value: string | undefined = env[key]?.trim();

  return value === '' ? undefined : value;
};

const readStorage = (value: string | undefined): StorageMode | undefined =>
  value === 'sessionStorage' || value === 'localStorage' || value === 'browserMemory' ? value : undefined;

const playgroundConfig: PlaygroundConfig = {
  afterSignInUrl: read('VITE_THUNDERID_AFTER_SIGN_IN_URL') ?? window.location.origin,
  afterSignOutUrl: read('VITE_THUNDERID_AFTER_SIGN_OUT_URL') ?? window.location.origin,
  applicationId: read('VITE_THUNDERID_APPLICATION_ID'),
  baseUrl: (read('VITE_THUNDERID_BASE_URL') ?? 'https://localhost:8090').replace(/\/+$/, ''),
  clientId: read('VITE_THUNDERID_CLIENT_ID') ?? '',
  expressPlaygroundUrl: read('VITE_PLAYGROUND_EXPRESS_URL') ?? 'http://localhost:3000',
  scopes: (read('VITE_THUNDERID_SCOPES') ?? 'openid profile email').split(/\s+/).filter(Boolean),
  storage: readStorage(read('VITE_THUNDERID_STORAGE')),
};

export default playgroundConfig;
