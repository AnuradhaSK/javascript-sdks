// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

export type JwtClaims = Record<string, unknown>;

export interface DecodedJwt {
  header: JwtClaims;
  payload: JwtClaims;
}

const decodeSegment = (segment: string): JwtClaims => {
  const base64: string = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded: string = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary: string = atob(padded);
  const bytes: Uint8Array = Uint8Array.from(binary, (char: string) => char.charCodeAt(0));

  return JSON.parse(new TextDecoder().decode(bytes)) as JwtClaims;
};

/**
 * Decodes a JWT without verifying it. Returns null for opaque tokens.
 */
export const decodeJwt = (token: string | null | undefined): DecodedJwt | null => {
  if (!token) return null;

  const parts: string[] = token.split('.');

  if (parts.length !== 3) return null;

  try {
    return {header: decodeSegment(parts[0]), payload: decodeSegment(parts[1])};
  } catch {
    return null;
  }
};

export const formatClaim = (value: unknown): string => (typeof value === 'string' ? value : JSON.stringify(value));

export const formatDuration = (ms: number): string => {
  const total: number = Math.max(0, Math.floor(ms / 1000));
  const hours: number = Math.floor(total / 3600);
  const minutes: number = Math.floor((total % 3600) / 60);
  const seconds: number = total % 60;
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return hours > 0 ? `${hours}:${mmss}` : mmss;
};
