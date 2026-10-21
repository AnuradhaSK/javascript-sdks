// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {SessionData} from '@thunderid/javascript';
import {afterEach, describe, expect, it, vi} from 'vitest';
import SessionUtils from '../SessionUtils';

const session = (createdAt: number, expiresIn: string): SessionData =>
  ({access_token: 'at', created_at: createdAt, expires_in: expiresIn}) as SessionData;

describe('SessionUtils.validateSession', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads expires_in as seconds', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);

    // Issued 61 seconds ago with a 60 second lifetime: expired.
    await expect(SessionUtils.validateSession(session(1_000_000 - 61_000, '60'))).resolves.toBe(false);
    // Issued 59 seconds ago with a 60 second lifetime: still valid.
    await expect(SessionUtils.validateSession(session(1_000_000 - 59_000, '60'))).resolves.toBe(true);
  });
});
