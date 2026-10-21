// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {useThunderID} from '@thunderid/nextjs';

/**
 * The value of `useThunderID()` from @thunderid/nextjs. The package does not export its context
 * type, and every field is optional, so the helpers below check before they call.
 */
export type NextSdk = ReturnType<typeof useThunderID>;

export type SdkUser = Record<string, unknown>;

type AnyCall = (...params: unknown[]) => Promise<unknown>;

const callable = (sdk: NextSdk, name: 'signIn' | 'signOut' | 'signUp'): AnyCall => {
  const call: unknown = sdk[name];

  if (typeof call !== 'function') throw new Error(`useThunderID().${name} is not available`);

  return call as AnyCall;
};

export const toUser = (value: unknown): SdkUser | null =>
  value && typeof value === 'object' ? (value as SdkUser) : null;

export const sdkSignIn = (sdk: NextSdk, ...args: unknown[]): Promise<unknown> => callable(sdk, 'signIn')(...args);

export const sdkSignUp = (sdk: NextSdk, ...args: unknown[]): Promise<unknown> => callable(sdk, 'signUp')(...args);

export const sdkSignOut = (sdk: NextSdk): Promise<unknown> => callable(sdk, 'signOut')();

export const asText = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return JSON.stringify(value);
};
