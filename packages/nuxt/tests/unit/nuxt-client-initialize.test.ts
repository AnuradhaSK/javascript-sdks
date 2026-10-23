// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/typedef, sort-keys, @typescript-eslint/explicit-function-return-type */

import {describe, it, expect, vi} from 'vitest';

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import ThunderIDNuxtClient from '../../src/runtime/server/ThunderIDNuxtClient';

// ── vi.hoisted ────────────────────────────────────────────────────────────────

const captured = vi.hoisted(() => ({
  initialize: vi.fn<(config: any) => Promise<boolean>>().mockResolvedValue(true),
}));

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@thunderid/node', () => ({
  ThunderIDNodeClient: class {
    initialize(config: any): Promise<boolean> {
      return captured.initialize(config);
    }
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ThunderIDNuxtClient.initialize', () => {
  it('passes authorizationDetails through to the underlying node client config', async () => {
    const authorizationDetails = [
      {type: 'payment_initiation', actions: ['initiate'], instructedAmount: {currency: 'EUR', amount: '123.50'}},
    ];

    await ThunderIDNuxtClient.getInstance().initialize({
      afterSignInUrl: 'http://localhost:3000/api/auth/callback',
      authorizationDetails,
      baseUrl: 'https://localhost:8090',
      clientId: 'client-id',
    });

    expect(captured.initialize).toHaveBeenCalledTimes(1);
    expect(captured.initialize.mock.calls[0][0]).toMatchObject({authorizationDetails});
  });
});
