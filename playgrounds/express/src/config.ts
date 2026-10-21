// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

const env = (name: string): string | undefined => {
  const value: string | undefined = process.env[name]?.trim();
  return value === '' ? undefined : value;
};

const port = Number(env('PORT') ?? 3000);
const appUrl: string = env('APP_URL') ?? `http://localhost:${port}`;

/** Playground settings, read from the environment (see `.env.example`). */
const config: {
  adminScope: string;
  afterSignInUrl: string;
  afterSignOutUrl: string;
  appUrl: string;
  applicationId: string | undefined;
  baseUrl: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
  flowSecret: string | undefined;
  port: number;
  scopes: string[];
} = {
  adminScope: env('PLAYGROUND_ADMIN_SCOPE') ?? 'system',
  afterSignInUrl: env('THUNDERID_AFTER_SIGN_IN_URL') ?? `${appUrl}/login`,
  afterSignOutUrl: env('THUNDERID_AFTER_SIGN_OUT_URL') ?? `${appUrl}/logout`,
  appUrl,
  applicationId: env('THUNDERID_APPLICATION_ID'),
  baseUrl: env('THUNDERID_BASE_URL') ?? 'https://localhost:8090',
  clientId: env('THUNDERID_CLIENT_ID'),
  clientSecret: env('THUNDERID_CLIENT_SECRET'),
  flowSecret: env('THUNDERID_FLOW_SECRET'),
  port,
  scopes: (env('THUNDERID_SCOPES') ?? 'openid profile email').split(/\s+/),
};

export default config;
