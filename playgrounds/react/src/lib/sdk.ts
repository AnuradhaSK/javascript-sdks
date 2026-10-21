// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ThunderIDContextProps} from '@thunderid/react';

/**
 * Typed views over the parts of `useThunderID()` that the SDK types as `any`. Each one lists a gap
 * the playground had to paper over; see the README for the follow-ups.
 */
export type SdkUser = Record<string, unknown>;

export interface SdkStorageManager {
  getSessionData: () => Promise<Record<string, unknown> | null | undefined>;
}

export const toUser = (value: unknown): SdkUser | null =>
  value && typeof value === 'object' ? (value as SdkUser) : null;

export const sdkSignIn = (sdk: ThunderIDContextProps, ...args: unknown[]): Promise<unknown> =>
  (sdk.signIn as (...params: unknown[]) => Promise<unknown>)(...args);

export const sdkSignUp = (sdk: ThunderIDContextProps, ...args: unknown[]): Promise<unknown> =>
  (sdk.signUp as (...params: unknown[]) => Promise<unknown>)(...args);

export const sdkRecover = (sdk: ThunderIDContextProps, payload: unknown): Promise<unknown> =>
  (sdk.recover as (params: unknown) => Promise<unknown>)(payload);

export const sdkSignOut = (sdk: ThunderIDContextProps): Promise<unknown> => (sdk.signOut as () => Promise<unknown>)();

export const sdkStorage = async (sdk: ThunderIDContextProps): Promise<SdkStorageManager | null> =>
  ((await sdk.getStorageManager()) as SdkStorageManager | null) ?? null;

export const asText = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return JSON.stringify(value);
};
