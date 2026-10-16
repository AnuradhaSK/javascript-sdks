// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import ThunderIDAPIError from '../../errors/ThunderIDAPIError';
import isRetryableError from '../isRetryableError';

const apiError = (statusCode?: number): ThunderIDAPIError =>
  new ThunderIDAPIError('failed', 'getUsers-ResponseError-001', 'javascript', statusCode);

describe('isRetryableError', () => {
  it.each([500, 502, 503, 504, 599])('retries a %i server error', (status: number) => {
    expect(isRetryableError(apiError(status))).toBe(true);
  });

  it('retries a failure with no response (status 0)', () => {
    expect(isRetryableError(apiError(0))).toBe(true);
  });

  it.each([400, 401, 403, 404, 429])('does not retry a %i client error', (status: number) => {
    expect(isRetryableError(apiError(status))).toBe(false);
  });

  it('does not retry an API error without a status', () => {
    expect(isRetryableError(apiError())).toBe(false);
  });

  it.each([new Error('boom'), 'boom', null, undefined])('does not retry a non-API error (%s)', (error: unknown) => {
    expect(isRetryableError(error)).toBe(false);
  });
});
