// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getValidAccessToken} from '@thunderid/nuxt/server';
import {decodeClaims} from '../../lib/claims';
import {traced} from '../../lib/trace';

/**
 * GET /api/playground/token
 *
 * Gets an access token with `getValidAccessToken()`, which refreshes it first when it expires within
 * a minute and a refresh token is in the session. Answers with the token's claims, not the token.
 */
export default defineEventHandler(
  async (event): Promise<{claims: Record<string, unknown> | null; expiresAt: number | null; length: number}> => {
    const token: string = await traced(
      event,
      'handler: getValidAccessToken(event)',
      () => getValidAccessToken(event),
      (value: string) => `${value.length} chars`,
    );
    const claims: Record<string, unknown> | null = decodeClaims(token);

    return {
      claims,
      expiresAt: typeof claims?.exp === 'number' ? claims.exp : null,
      length: token.length,
    };
  },
);
