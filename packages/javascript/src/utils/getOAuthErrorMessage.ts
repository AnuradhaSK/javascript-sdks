// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Builds a readable message from the body of an OAuth 2.0 error response (RFC 6749 section 5.2).
 *
 * Only the `error` and `error_description` members are read, so nothing else in the body, such as
 * a token, can end up in the message.
 *
 * @param body - The parsed response body, or its raw text.
 * @param fallback - The message to use when the body carries neither member.
 * @returns `"<error>: <error_description>"`, whichever of the two is present, or `fallback`.
 *
 * @example
 * getOAuthErrorMessage({error: 'invalid_grant', error_description: 'The code has expired.'}, 'Failed');
 * // Returns: "invalid_grant: The code has expired."
 */
const getOAuthErrorMessage = (body: unknown, fallback: string): string => {
  let parsed: unknown = body;

  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body);
    } catch {
      return fallback;
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return fallback;
  }

  const {error, error_description: description} = parsed as {error?: unknown; error_description?: unknown};
  const parts: string[] = [error, description].filter(
    (part: unknown): part is string => typeof part === 'string' && part.trim().length > 0,
  );

  return parts.length > 0 ? parts.join(': ') : fallback;
};

export default getOAuthErrorMessage;
