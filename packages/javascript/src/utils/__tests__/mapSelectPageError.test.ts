// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import ThunderIDAPIError from '../../errors/ThunderIDAPIError';
import ThunderIDError from '../../errors/ThunderIDError';
import mapSelectPageError from '../mapSelectPageError';

describe('mapSelectPageError', (): void => {
  it('should name the resource and the status of an API error', (): void => {
    const result = mapSelectPageError(new ThunderIDAPIError('Forbidden', 'test-code', 'test-origin', 403), 'users');

    expect(result).toEqual({message: 'Failed to load users (HTTP 403).', statusCode: 403});
  });

  it('should name the resource as options when none is given', (): void => {
    expect(mapSelectPageError(new ThunderIDAPIError('boom', 'test-code', 'test-origin', 500)).message).toBe(
      'Failed to load options (HTTP 500).',
    );
  });

  it('should carry status 0, which means no response, without printing it', (): void => {
    const result = mapSelectPageError(new ThunderIDAPIError('offline', 'test-code', 'test-origin', 0), 'users');

    expect(result).toEqual({message: 'Failed to load users.', statusCode: 0});
  });

  it('should leave the status out when there is none', (): void => {
    expect(mapSelectPageError(new ThunderIDAPIError('No status', 'test-code', 'test-origin'))).not.toHaveProperty(
      'statusCode',
    );
    expect(mapSelectPageError(new ThunderIDError('Network down', 'test-code', 'test-origin'))).not.toHaveProperty(
      'statusCode',
    );
  });

  it.each([
    [new ThunderIDAPIError('<html>502 from internal-proxy-7.corp.local</html>', 'test-code', 'test-origin', 502)],
    [new ThunderIDAPIError('{"code":"X","message":{"defaultValue":"secret detail"}}', 'test-code', 'test-origin', 400)],
    [new ThunderIDError('secret detail', 'test-code', 'test-origin')],
    [new Error('secret detail')],
    ['secret detail'],
  ])('should never copy the text of the failure into the result (%s)', (thrown: unknown): void => {
    expect(JSON.stringify(mapSelectPageError(thrown, 'users'))).not.toMatch(/secret|internal-proxy/);
  });

  it.each([[new Error('plain')], ['a string'], [undefined], [null]])(
    'should describe an unrecognized throw without a status (%s)',
    (thrown: unknown): void => {
      expect(mapSelectPageError(thrown, 'users')).toEqual({message: 'Failed to load users.'});
    },
  );
});
