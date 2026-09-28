// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import normalizeSelectOptions from '../normalizeSelectOptions';

describe('normalizeSelectOptions', () => {
  it('turns strings and numbers into options that show and submit the same text', () => {
    expect(normalizeSelectOptions(['Red', 7])).toEqual([
      {label: 'Red', value: 'Red'},
      {label: '7', value: '7'},
    ]);
  });

  it('keeps label and value objects as given', () => {
    expect(normalizeSelectOptions([{label: 'Green', value: 'g'}])).toEqual([{label: 'Green', value: 'g'}]);
  });

  it('falls back to the value when the label is missing or empty', () => {
    expect(normalizeSelectOptions([{label: '', value: 'g'}, {value: 'b'} as never])).toEqual([
      {label: 'g', value: 'g'},
      {label: 'b', value: 'b'},
    ]);
  });

  it('keeps disabled only when it is true', () => {
    expect(
      normalizeSelectOptions([
        {disabled: true, label: 'A', value: 'a'},
        {disabled: false, label: 'B', value: 'b'},
      ]),
    ).toEqual([
      {disabled: true, label: 'A', value: 'a'},
      {label: 'B', value: 'b'},
    ]);
  });

  it('mixes the formats in one list and keeps their order', () => {
    expect(normalizeSelectOptions(['A', {label: 'B', value: 'b'}, 3]).map((option) => option.value)).toEqual([
      'A',
      'b',
      '3',
    ]);
  });

  it('skips empty, blank, non-finite and missing entries', () => {
    expect(normalizeSelectOptions(['', '   ', null, undefined, Number.NaN, {label: 'No value'} as never])).toEqual([]);
  });

  it('does not guess a label or value from other object shapes', () => {
    expect(normalizeSelectOptions([{id: 'u1', name: 'Alice'} as never])).toEqual([]);
  });

  it.each([undefined, null])('treats %s as an empty list', (input: undefined | null) => {
    expect(normalizeSelectOptions(input)).toEqual([]);
  });

  it('does not change the input list', () => {
    const input = ['A', 'B'];

    normalizeSelectOptions(input);

    expect(input).toEqual(['A', 'B']);
  });
});
