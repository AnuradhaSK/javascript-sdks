// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * `useThunderID().user` is typed as `Ref<any>`. This narrows it to a plain record so the playground
 * can read claims without `any` leaking further; see the README for the follow-up.
 */
export type SdkUser = Record<string, unknown>;

export const toUser = (value: unknown): SdkUser | null =>
  value && typeof value === 'object' ? (value as SdkUser) : null;

export const asText = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return JSON.stringify(value);
};
