// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

// Subpath imports keep jose's JWE code, whose CompressionStream use the Edge runtime rejects, out of the bundle.
import * as base64url from 'jose/base64url';

/**
 * Encodes a string to standard base64 using `jose` (already a package dependency).
 *
 * jose's `base64url.encode` is environment-agnostic (browser, Node.js, Deno, Bun,
 * edge/service-worker runtimes). It produces base64url output, which is then
 * converted to standard base64 by restoring the `+`/`/` characters and adding
 * `=` padding.
 *
 * @param value - The UTF-8 string to encode.
 * @returns The standard base64-encoded string (with `+`, `/`, and `=` padding).
 *
 * @example
 * ```typescript
 * base64Encode('clientId:clientSecret'); // "Y2xpZW50SWQ6Y2xpZW50U2VjcmV0"
 * ```
 */
const base64Encode = (value: string): string => {
  const b64url: string = base64url.encode(new TextEncoder().encode(value));
  const rem: number = b64url.length % 4;
  const padded: string = rem === 0 ? b64url : b64url + '='.repeat(4 - rem);

  return padded.replace(/-/g, '+').replace(/_/g, '/');
};

export default base64Encode;
