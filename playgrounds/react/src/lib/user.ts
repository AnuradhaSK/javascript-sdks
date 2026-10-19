// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

type UserLike = Record<string, unknown> | null | undefined;

const pick = (user: UserLike, keys: string[]): string | undefined => {
  if (!user) return undefined;

  for (const key of keys) {
    const value: unknown = user[key];

    if (typeof value === 'string' && value.trim()) return value;
  }

  return undefined;
};

export const getDisplayName = (user: UserLike): string => {
  const given: string | undefined = pick(user, ['given_name', 'givenName', 'firstName']);
  const family: string | undefined = pick(user, ['family_name', 'familyName', 'lastName']);

  if (given || family) return [given, family].filter(Boolean).join(' ');

  return pick(user, ['name', 'displayName', 'username', 'preferred_username', 'email', 'sub']) ?? 'Anonymous';
};

export const getEmail = (user: UserLike): string | undefined => pick(user, ['email', 'emailaddress', 'username']);

export const getInitials = (user: UserLike): string => {
  if (!user) return '?';

  const parts: string[] = getDisplayName(user)
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean);

  return (parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? '?').slice(0, 2)).toUpperCase();
};
