// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import resolveApplicationResponseTypes from '../resolveApplicationResponseTypes';

describe('resolveApplicationResponseTypes', () => {
  it('adds code for the authorization code grant and keeps the other response types', () => {
    expect(resolveApplicationResponseTypes(['authorization_code'])).toEqual(['code']);
    expect(resolveApplicationResponseTypes(['authorization_code'], ['id_token'])).toEqual(['id_token', 'code']);
    expect(resolveApplicationResponseTypes(['authorization_code'], ['code'])).toEqual(['code']);
  });

  it('drops code without the authorization code grant', () => {
    expect(resolveApplicationResponseTypes(['client_credentials'], ['code', 'id_token'])).toEqual(['id_token']);
  });
});
