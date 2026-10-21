// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Decodes the payload of a JWT without verifying it. Returns null for opaque tokens. The playground
 * shows claims, never the raw tokens, so the browser does not hold what the session cookie protects.
 */
export const decodeClaims = (token: string | undefined): Record<string, unknown> | null => {
  const parts: string[] = token?.split('.') ?? [];

  if (parts.length !== 3) return null;

  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
};
