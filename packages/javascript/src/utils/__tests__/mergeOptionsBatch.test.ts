// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import type {SelectOption} from '../../models/select';
import mergeOptionsBatch from '../mergeOptionsBatch';

const option = (value: string, label = value): SelectOption => ({label, value});
const empty = {cursor: undefined, options: [] as SelectOption[]};
const values = (options: SelectOption[]): string[] => options.map((item: SelectOption) => item.value);

describe('mergeOptionsBatch', () => {
  describe('cursor batches', () => {
    it('appends the batch, stores the next cursor and is not finished', () => {
      const result = mergeOptionsBatch<number>(
        {cursor: 0, options: [option('a')]},
        {nextCursor: 2, options: ['b', 'c']},
      );

      expect(values(result.options)).toEqual(['a', 'b', 'c']);
      expect(result).toMatchObject({cursor: 2, finished: false});
      expect(result.issue).toBeUndefined();
    });

    it.each([null, undefined])('finishes when the next cursor is %s', (nextCursor) => {
      const result = mergeOptionsBatch<number>(empty, {nextCursor, options: ['a']});

      expect(result).toMatchObject({cursor: undefined, finished: true});
      expect(values(result.options)).toEqual(['a']);
    });

    it('continues when the batch holds only duplicates but the cursor moves', () => {
      const result = mergeOptionsBatch<number>({cursor: 1, options: [option('a')]}, {nextCursor: 2, options: ['a']});

      expect(result).toMatchObject({cursor: 2, finished: false});
      expect(result.issue).toBeUndefined();
    });

    it('finishes and reports a stuck cursor when nothing is added and the cursor does not move', () => {
      const result = mergeOptionsBatch<number>({cursor: 1, options: [option('a')]}, {nextCursor: 1, options: ['a']});

      expect(result).toMatchObject({finished: true, issue: 'cursor-stuck'});
    });

    it('does not call a cursor stuck when something was added', () => {
      const result = mergeOptionsBatch<number>({cursor: 1, options: [option('a')]}, {nextCursor: 1, options: ['b']});

      expect(result).toMatchObject({finished: false});
      expect(result.issue).toBeUndefined();
    });

    it('replaces an earlier option with its newer copy and keeps its place', () => {
      const result = mergeOptionsBatch<number>(
        {cursor: 0, options: [option('a', 'Old'), option('b')]},
        {nextCursor: 1, options: [{label: 'New', value: 'a'}]},
      );

      expect(result.options).toEqual([option('a', 'New'), option('b')]);
    });

    it('accepts strings, numbers and objects in one batch', () => {
      const result = mergeOptionsBatch<number>(empty, {nextCursor: 1, options: ['x', 2, {label: 'Z', value: 'z'}]});

      expect(result.options).toEqual([option('x'), option('2'), option('z', 'Z')]);
    });

    it('treats a missing options list as an empty batch without reporting it', () => {
      const result = mergeOptionsBatch<number>(empty, {nextCursor: 3} as never);

      expect(result).toMatchObject({cursor: 3, finished: false, options: []});
      expect(result.issue).toBeUndefined();
    });

    it('reports options that are not a list', () => {
      const result = mergeOptionsBatch<number>(empty, {nextCursor: 3, options: 'oops'} as never);

      expect(result).toMatchObject({issue: 'not-a-list', options: []});
    });
  });

  describe('plain lists', () => {
    it('appends the list and is not finished while it adds options', () => {
      const result = mergeOptionsBatch({cursor: undefined, options: [option('a')]}, ['b', 'c']);

      expect(values(result.options)).toEqual(['a', 'b', 'c']);
      expect(result.finished).toBe(false);
      expect(result.cursor).toBeUndefined();
    });

    it.each([[[]], [['a']]])('finishes when the list adds nothing new (%j)', (list: string[]) => {
      const result = mergeOptionsBatch({cursor: undefined, options: [option('a')]}, list);

      expect(result.finished).toBe(true);
    });

    it.each([null, undefined])('treats %s as an empty batch and finishes without an issue', (nothing) => {
      const result = mergeOptionsBatch(empty, nothing);

      expect(result).toMatchObject({finished: true, options: []});
      expect(result.issue).toBeUndefined();
    });

    it('reports something that is not a list and treats it as empty', () => {
      const result = mergeOptionsBatch(empty, 'oops' as never);

      expect(result).toMatchObject({finished: true, issue: 'not-a-list', options: []});
    });
  });

  it('does not change the options it was given', () => {
    const current = [option('a')];

    mergeOptionsBatch({cursor: undefined, options: current}, ['b']);

    expect(current).toEqual([option('a')]);
  });
});
