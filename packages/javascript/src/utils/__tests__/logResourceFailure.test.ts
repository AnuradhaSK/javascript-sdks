// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {afterEach, describe, expect, it, vi} from 'vitest';
import ThunderIDAPIError from '../../errors/ThunderIDAPIError';
import {createResourceFailureLogger, logResourceFailure} from '../logResourceFailure';

const log = vi.hoisted(() => ({debug: vi.fn(), error: vi.fn()}));

vi.mock('../logger', () => ({
  createPackageComponentLogger: () => ({debug: log.debug, error: log.error, info: vi.fn(), warn: vi.fn()}),
}));

const failure = (code: string): ThunderIDAPIError => new ThunderIDAPIError('nope', code, 'javascript', 403);
const details = {attempts: 1, limit: 30, offset: 0, startedAt: performance.now()};

describe('logResourceFailure', () => {
  afterEach(() => {
    log.debug.mockClear();
    log.error.mockClear();
  });

  it('logs one error line naming only the call context', () => {
    logResourceFailure('users', failure('getUsers-ForbiddenError-001'), details);

    expect(log.error).toHaveBeenCalledTimes(1);
    const [message, logged] = log.error.mock.calls[0] as [string, Record<string, unknown>];
    expect(message).toBe('Failed to load users.');
    expect(Object.keys(logged).sort()).toEqual(['attempts', 'code', 'durationMs', 'limit', 'offset', 'status'].sort());
  });

  it('leaves the text of the failure out of the log, whatever the server replied', () => {
    const reply = '<html>502 Bad Gateway for jane.doe@example.com</html>';

    logResourceFailure('users', new ThunderIDAPIError(reply, 'getUsers-ResponseError-001', 'javascript', 502), details);

    expect(JSON.stringify(log.error.mock.calls[0])).not.toContain('jane.doe');
    expect(JSON.stringify(log.error.mock.calls[0])).not.toContain('Bad Gateway');
  });

  it('measures how long the call ran', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1500);

    logResourceFailure('users', failure('a'), {...details, startedAt: 1000});

    expect(log.error.mock.calls[0][1]).toMatchObject({durationMs: 500});
    vi.restoreAllMocks();
  });
});

describe('createResourceFailureLogger', () => {
  afterEach(() => {
    log.debug.mockClear();
    log.error.mockClear();
  });

  it('logs the first failure of a code as an error and repeats at debug level', () => {
    const logFailure = createResourceFailureLogger();

    logFailure('users', failure('a'), details);
    logFailure('users', failure('a'), details);
    logFailure('users', failure('a'), details);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.debug).toHaveBeenCalledTimes(2);
  });

  it('logs another code as an error again', () => {
    const logFailure = createResourceFailureLogger();

    logFailure('users', failure('a'), details);
    logFailure('users', failure('b'), details);

    expect(log.error).toHaveBeenCalledTimes(2);
  });

  it('keeps separate loggers separate', () => {
    createResourceFailureLogger()('users', failure('a'), details);
    createResourceFailureLogger()('users', failure('a'), details);

    expect(log.error).toHaveBeenCalledTimes(2);
  });
});
