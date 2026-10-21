// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {requireServerSession} from '@thunderid/nuxt/server';
import type {ThunderIDSessionPayload} from '@thunderid/nuxt/server';
import {traced} from '../../lib/trace';

/**
 * GET /api/playground/protected
 *
 * A protected API route: `requireServerSession()` answers 401 when there is no session.
 */
export default defineEventHandler(async (event): Promise<{message: string; sub: string}> => {
  const session: ThunderIDSessionPayload = await traced(
    event,
    'handler: requireServerSession(event)',
    () => requireServerSession(event),
    (value: ThunderIDSessionPayload) => `sub ${value.sub}`,
  );

  return {message: 'Only a signed-in user gets this far.', sub: session.sub};
});
