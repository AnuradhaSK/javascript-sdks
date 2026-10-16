// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toError from '../toError';

describe('toError', () => {
  it('returns an Error as it is', () => {
    const error = new TypeError('broken');

    expect(toError(error)).toBe(error);
  });

  it('wraps a thrown string', () => {
    const error: Error = toError('plain');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('plain');
  });

  it('wraps other thrown values as text', () => {
    expect(toError(undefined).message).toBe('undefined');
    expect(toError({code: 7}).message).toBe('[object Object]');
  });
});
