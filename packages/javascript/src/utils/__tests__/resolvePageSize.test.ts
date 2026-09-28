// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import SelectConstants from '../../constants/SelectConstants';
import resolvePageSize from '../resolvePageSize';

describe('resolvePageSize', () => {
  it('uses the default when no size is given', () => {
    expect(resolvePageSize()).toBe(SelectConstants.DEFAULT_PAGE_SIZE);
    expect(resolvePageSize(undefined)).toBe(30);
  });

  it('keeps a size inside the allowed range', () => {
    expect(resolvePageSize(20)).toBe(20);
  });

  it('caps a size above what the management API serves', () => {
    expect(resolvePageSize(1000)).toBe(SelectConstants.MAX_PAGE_SIZE);
  });

  it('raises a size below one to one', () => {
    expect(resolvePageSize(0)).toBe(1);
    expect(resolvePageSize(-5)).toBe(1);
  });

  it('rounds a fractional size down', () => {
    expect(resolvePageSize(12.9)).toBe(12);
  });
});
