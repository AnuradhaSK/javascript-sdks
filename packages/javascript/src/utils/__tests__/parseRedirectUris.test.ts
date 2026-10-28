// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import parseRedirectUris from '../parseRedirectUris';

describe('parseRedirectUris', () => {
  it('splits on whitespace, new lines and commas and drops blanks', () => {
    expect(
      parseRedirectUris(' https://a.example.com/cb,\nhttps://b.example.com/cb  https://c.example.com/cb ,'),
    ).toEqual(['https://a.example.com/cb', 'https://b.example.com/cb', 'https://c.example.com/cb']);
  });

  it('returns no URIs for blank text', () => {
    expect(parseRedirectUris('  \n ')).toEqual([]);
  });
});
