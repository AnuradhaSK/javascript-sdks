// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import {ApplicationSubmission} from '../../models/application';
import isApplicationSubmissionValid from '../isApplicationSubmissionValid';

const submission: ApplicationSubmission = {
  description: 'Storefront',
  grantTypes: ['authorization_code', 'refresh_token'],
  logoUrl: 'https://cdn.example.com/logo.png',
  name: 'My SPA',
  redirectUris: ['https://app.example.com/callback'],
  url: 'https://app.example.com',
};

describe('isApplicationSubmissionValid', () => {
  it('accepts a named application with grant types and a redirect URI', () => {
    expect(isApplicationSubmissionValid(submission)).toBe(true);
  });

  it('refuses a blank name', () => {
    expect(isApplicationSubmissionValid({...submission, name: '  '})).toBe(false);
  });

  it('refuses no grant types', () => {
    expect(isApplicationSubmissionValid({...submission, grantTypes: []})).toBe(false);
  });

  it('requires a redirect URI only for the authorization code grant', () => {
    expect(isApplicationSubmissionValid({...submission, redirectUris: []})).toBe(false);
    expect(isApplicationSubmissionValid({...submission, grantTypes: ['client_credentials'], redirectUris: []})).toBe(
      true,
    );
  });

  it('refuses the client credentials grant for a public client', () => {
    expect(isApplicationSubmissionValid({...submission, grantTypes: ['client_credentials'], publicClient: true})).toBe(
      false,
    );
  });
});
