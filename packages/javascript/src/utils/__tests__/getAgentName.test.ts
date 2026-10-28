// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import getAgentName from '../getAgentName';

describe('getAgentName', () => {
  it('should prefer the server-resolved display value', () => {
    expect(getAgentName({attributes: {name: 'Sync Worker'}, display: 'Nightly Sync Worker', id: 'a1'})).toBe(
      'Nightly Sync Worker',
    );
  });

  it('should fall back to the name attribute', () => {
    expect(getAgentName({attributes: {name: 'Sync Worker'}, id: 'a1'})).toBe('Sync Worker');
  });

  it('should fall back to the identifier when the name attribute is missing, empty or not a string', () => {
    expect(getAgentName({id: 'a1'})).toBe('a1');
    expect(getAgentName({attributes: {name: ''}, id: 'a1'})).toBe('a1');
    expect(getAgentName({attributes: {name: 42}, id: 'a1'})).toBe('a1');
    expect(getAgentName({display: '', id: 'a1'})).toBe('a1');
  });
});
