// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import SelectConstants from '../../constants/SelectConstants';
import parseSelectPageQuery from '../parseSelectPageQuery';

const queryOf = (...args: Parameters<typeof parseSelectPageQuery>) => {
  const result = parseSelectPageQuery(...args);

  return 'query' in result ? result.query : undefined;
};

describe('parseSelectPageQuery', () => {
  it('accepts an empty query', () => {
    expect(parseSelectPageQuery({})).toEqual({
      query: {filter: undefined, limit: undefined, offset: undefined},
    });
  });

  it('reads numbers given as digits, as a URL query gives them', () => {
    expect(parseSelectPageQuery({limit: '30', offset: '60'})).toEqual({
      query: {filter: undefined, limit: 30, offset: 60},
    });
  });

  it('reads numbers given as numbers, as a server action gives them', () => {
    expect(parseSelectPageQuery({limit: 30, offset: 0})).toEqual({
      query: {filter: undefined, limit: 30, offset: 0},
    });
  });

  it.each([
    ['a word', {limit: 'abc'}, 'limit'],
    ['a fraction', {limit: '1.5'}, 'limit'],
    ['a negative number', {offset: '-1'}, 'offset'],
    ['a negative number given as a number', {offset: -1}, 'offset'],
    ['a fractional number', {limit: 1.5}, 'limit'],
    ['a number too large to be exact', {offset: '99999999999999999999'}, 'offset'],
    ['a list from a repeated parameter', {limit: ['1', '2']}, 'limit'],
    ['an object', {offset: {}}, 'offset'],
    ['not a number', {limit: Number.NaN}, 'limit'],
    ['an empty string', {limit: ''}, 'limit'],
  ])('rejects %s', (_label, raw, invalid) => {
    expect(parseSelectPageQuery(raw as never)).toEqual({invalid});
  });

  it('ignores the filter unless it is allowed', () => {
    expect(queryOf({filter: 'name eq "x"'})?.filter).toBeUndefined();
    expect(parseSelectPageQuery({filter: {not: 'a string'}})).toEqual({
      query: {filter: undefined, limit: undefined, offset: undefined},
    });
  });

  it('passes a filter on when it is allowed', () => {
    expect(parseSelectPageQuery({filter: 'department eq "Engineering"'}, {allowFilter: true})).toEqual({
      query: {filter: 'department eq "Engineering"', limit: undefined, offset: undefined},
    });
  });

  it('treats an empty filter as none', () => {
    expect(queryOf({filter: ''}, {allowFilter: true})?.filter).toBeUndefined();
  });

  it('rejects a filter that is not a string or is too long, when allowed', () => {
    expect(parseSelectPageQuery({filter: ['a']}, {allowFilter: true})).toEqual({invalid: 'filter'});
    expect(
      parseSelectPageQuery({filter: 'x'.repeat(SelectConstants.MAX_FILTER_LENGTH + 1)}, {allowFilter: true}),
    ).toEqual({invalid: 'filter'});
    expect(
      parseSelectPageQuery({filter: 'x'.repeat(SelectConstants.MAX_FILTER_LENGTH)}, {allowFilter: true}).invalid,
    ).toBeUndefined();
  });

  it('names the first unacceptable parameter', () => {
    expect(parseSelectPageQuery({limit: 'a', offset: 'b'})).toEqual({invalid: 'limit'});
  });
});
