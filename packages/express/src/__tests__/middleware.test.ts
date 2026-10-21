// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {logger} from '@thunderid/node';
import express from 'express';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {handleSignIn} from '../middleware/authentication';
import protect from '../middleware/protect';
import ThunderIDExpressClient from '../ThunderIDExpressClient';

const fakeResponse = (): express.Response =>
  ({
    cookie: vi.fn(),
    end: vi.fn(),
    redirect: vi.fn(),
    status: vi.fn().mockReturnThis(),
  }) as unknown as express.Response;

const newClient = async (): Promise<ThunderIDExpressClient> => {
  const client: ThunderIDExpressClient = new ThunderIDExpressClient();
  await client.initialize({baseUrl: 'https://auth.example.com', clientId: 'test-client'});

  return client;
};

describe('handleSignIn', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to the authorize URL and does not pass the request on to later routes', async () => {
    const client: ThunderIDExpressClient = await newClient();
    vi.spyOn(client, 'getSignInUrl').mockResolvedValue('https://auth.example.com/oauth2/authorize?state=x');
    const req = {cookies: {}, originalUrl: '/login', query: {}, thunderIDAuth: client} as unknown as express.Request;
    const res: express.Response = fakeResponse();
    const next = vi.fn();

    await handleSignIn()(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('https://auth.example.com/oauth2/authorize?state=x');
    expect(next).not.toHaveBeenCalled();
  });
});

describe('protect', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers 401 for a request without a session and logs it below the error level', async () => {
    const client: ThunderIDExpressClient = await newClient();
    const error = vi.spyOn(logger, 'error');
    const debug = vi.spyOn(logger, 'debug');
    const req = {cookies: {}, thunderIDAuth: client} as unknown as express.Request;
    const res: express.Response = fakeResponse();
    const next = vi.fn();

    await protect()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(debug).toHaveBeenCalled();
  });

  it('answers 401 for a session that is not signed in, without an error log', async () => {
    const client: ThunderIDExpressClient = await newClient();
    vi.spyOn(client, 'isSignedIn').mockResolvedValue(false);
    const error = vi.spyOn(logger, 'error');
    const req = {
      cookies: {[client.getSessionCookieName()]: 'session-1'},
      thunderIDAuth: client,
    } as unknown as express.Request;
    const res: express.Response = fakeResponse();

    await protect()(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(error).not.toHaveBeenCalled();
  });

  it('logs an error when thunderID() is not mounted', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const res: express.Response = fakeResponse();

    await protect()({cookies: {}} as unknown as express.Request, res, vi.fn());

    expect(error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('calls next() for a signed-in session', async () => {
    const client: ThunderIDExpressClient = await newClient();
    vi.spyOn(client, 'isSignedIn').mockResolvedValue(true);
    const req = {
      cookies: {[client.getSessionCookieName()]: 'session-1'},
      thunderIDAuth: client,
    } as unknown as express.Request;
    const next = vi.fn();

    await protect()(req, fakeResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
