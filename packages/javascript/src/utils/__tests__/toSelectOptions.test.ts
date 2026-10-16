// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toSelectOptions from '../toSelectOptions';

describe('toSelectOptions', () => {
  it('converts a plain list', () => {
    expect(toSelectOptions(['a', 'b'])).toEqual([
      {label: 'a', value: 'a'},
      {label: 'b', value: 'b'},
    ]);
  });

  it('leaves out items with nothing to submit', () => {
    expect(toSelectOptions(['a', '', 'b'])).toHaveLength(2);
  });

  it('applies the mapping to every object', () => {
    const items = [
      {code: 'x', title: 'X'},
      {code: 'y', title: 'Y'},
    ];

    expect(toSelectOptions(items, {labelAttributes: ['title'], valueAttribute: 'code'})).toEqual([
      {label: 'X', value: 'x'},
      {label: 'Y', value: 'y'},
    ]);
  });
});
