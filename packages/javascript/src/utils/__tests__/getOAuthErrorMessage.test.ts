// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import getOAuthErrorMessage from '../getOAuthErrorMessage';

describe('getOAuthErrorMessage', (): void => {
  it('joins error and error_description', (): void => {
    expect(getOAuthErrorMessage({error: 'invalid_grant', error_description: 'Expired.'}, 'fallback')).toBe(
      'invalid_grant: Expired.',
    );
  });

  it('uses whichever of the two is present', (): void => {
    expect(getOAuthErrorMessage({error: 'invalid_client'}, 'fallback')).toBe('invalid_client');
    expect(getOAuthErrorMessage({error_description: 'Bad client.'}, 'fallback')).toBe('Bad client.');
  });

  it('parses a JSON string body', (): void => {
    expect(getOAuthErrorMessage('{"error":"invalid_request"}', 'fallback')).toBe('invalid_request');
  });

  it('never copies other members of the body into the message', (): void => {
    expect(getOAuthErrorMessage({access_token: 'secret-token', refresh_token: 'secret-refresh'}, 'fallback')).toBe(
      'fallback',
    );
  });

  it('falls back for a body that is not an OAuth error', (): void => {
    expect(getOAuthErrorMessage(undefined, 'fallback')).toBe('fallback');
    expect(getOAuthErrorMessage('<html>', 'fallback')).toBe('fallback');
    expect(getOAuthErrorMessage({error: 42}, 'fallback')).toBe('fallback');
  });
});
