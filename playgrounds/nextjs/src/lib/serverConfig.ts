// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * What the playground is configured with, as the server sees it. The SDK reads the same variables
 * (`NEXT_PUBLIC_THUNDERID_*`, `THUNDERID_*`) on its own; this summary only reports them, and never
 * returns a secret's value.
 */
export interface ConfigSummary {
  afterSignInUrl: string;
  afterSignOutUrl: string;
  applicationId: string;
  baseUrl: string;
  clientId: string;
  clientSecretSet: boolean;
  flowSecretSet: boolean;
  scopes: string;
  sessionSecretSet: boolean;
  signInUrl: string;
  signUpUrl: string;
  tlsVerification: boolean;
}

const read = (key: string): string => process.env[key]?.trim() ?? '';

export const DEFAULT_BASE_URL = 'https://localhost:8090';

export const getConfigSummary = (): ConfigSummary => ({
  afterSignInUrl: read('NEXT_PUBLIC_THUNDERID_AFTER_SIGN_IN_URL'),
  afterSignOutUrl: read('NEXT_PUBLIC_THUNDERID_AFTER_SIGN_OUT_URL'),
  applicationId: read('NEXT_PUBLIC_THUNDERID_APPLICATION_ID'),
  baseUrl: (read('NEXT_PUBLIC_THUNDERID_BASE_URL') || DEFAULT_BASE_URL).replace(/\/+$/, ''),
  clientId: read('NEXT_PUBLIC_THUNDERID_CLIENT_ID'),
  clientSecretSet: !!read('THUNDERID_CLIENT_SECRET'),
  flowSecretSet: !!read('THUNDERID_FLOW_SECRET'),
  scopes: read('NEXT_PUBLIC_THUNDERID_SCOPES'),
  sessionSecretSet: !!read('THUNDERID_SECRET'),
  signInUrl: read('NEXT_PUBLIC_THUNDERID_SIGN_IN_URL'),
  signUpUrl: read('NEXT_PUBLIC_THUNDERID_SIGN_UP_URL'),
  tlsVerification: read('NODE_TLS_REJECT_UNAUTHORIZED') !== '0',
});
