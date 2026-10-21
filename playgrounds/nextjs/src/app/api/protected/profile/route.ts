// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {NextResponse} from 'next/server';
import {loadServerSession, ServerSession} from '../../../../lib/serverSession';

export const dynamic = 'force-dynamic';

/**
 * Behind `protectRoute()` in src/middleware.ts: anonymous requests are redirected before this runs.
 */
export const GET = async (): Promise<NextResponse> => {
  const session: ServerSession = await loadServerSession();

  if (!session.signedIn) {
    return NextResponse.json({error: session.error ?? 'no session'}, {status: 401});
  }

  const claims: Record<string, unknown> = session.claims ?? {};

  return NextResponse.json({
    scope: claims['scope'] ?? null,
    sub: claims['sub'] ?? null,
    username: claims['username'] ?? claims['email'] ?? null,
  });
};
