// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {logger as Logger} from '@thunderid/node';
import express from 'express';
import ThunderIDExpressClient from '../ThunderIDExpressClient';

/**
 * Returns Express middleware that blocks unauthenticated requests.
 * Requires `thunderID()` to be mounted before this middleware so that
 * `req.thunderIDAuth` is populated.
 *
 * @param onUnauthenticated - Called when the session is missing or invalid.
 *   Defaults to sending a 401 response.
 */
const protect = (
  onUnauthenticated?: (res: express.Response) => void,
): ((req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    const client: ThunderIDExpressClient | undefined = (req as any).thunderIDAuth;
    const sessionId: string | undefined = req.cookies?.[client?.getSessionCookieName() ?? ''];

    const reject = (): void => {
      if (onUnauthenticated) {
        onUnauthenticated(res);
      } else {
        res.status(401).end();
      }
    };

    if (!client) {
      Logger.error('thunderID() middleware must be mounted before protect()');
      reject();
      return;
    }

    // A request without a session, or with one that has ended, is an ordinary unauthenticated request.
    if (!sessionId) {
      Logger.debug('No session ID found in the request cookies');
      reject();
      return;
    }

    const isValid: boolean = (await client.isSignedIn(sessionId)) ?? false;

    if (isValid) {
      return next();
    }

    Logger.debug('The session in the request cookies is not signed in');
    reject();
  };
};

export default protect;
