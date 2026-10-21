// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {NextResponse} from 'next/server';
import {loadServerSession, maskToken, ServerSession} from '../../../lib/serverSession';

export const dynamic = 'force-dynamic';

/**
 * A route handler that reads the session with `thunderid()`.
 */
export const GET = async (): Promise<NextResponse> => {
  const session: ServerSession = await loadServerSession();

  return NextResponse.json({
    accessToken: maskToken(session.accessToken),
    claims: session.claims,
    error: session.error,
    sessionId: session.sessionId,
    signedIn: session.signedIn,
    trace: session.trace,
  });
};
