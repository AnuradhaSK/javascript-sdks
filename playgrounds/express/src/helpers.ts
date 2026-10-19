// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ThunderIDExpressClient} from '@thunderid/express';
import type {Request} from 'express';

/** The client that `thunderID()` attaches to every request. */
export const clientOf = (req: Request): ThunderIDExpressClient =>
  (req as Request & {thunderIDAuth: ThunderIDExpressClient}).thunderIDAuth;

/** The session id from the SDK's session cookie, if the request carries one. */
export const sessionOf = (req: Request): string | undefined => {
  const cookies: Record<string, string | undefined> | undefined = req.cookies as
    | Record<string, string | undefined>
    | undefined;
  return cookies?.[clientOf(req).getSessionCookieName()];
};
