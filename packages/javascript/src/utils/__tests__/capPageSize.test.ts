// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import SelectConstants from '../../constants/SelectConstants';
import capPageSize from '../capPageSize';

describe('capPageSize', () => {
  it('leaves an unset size for the server default', () => {
    expect(capPageSize(undefined)).toBeUndefined();
  });

  it('keeps a size the management API serves', () => {
    expect(capPageSize(1)).toBe(1);
    expect(capPageSize(SelectConstants.MAX_PAGE_SIZE)).toBe(SelectConstants.MAX_PAGE_SIZE);
  });

  it('caps a larger size at the most the management API serves', () => {
    expect(capPageSize(SelectConstants.MAX_PAGE_SIZE + 1)).toBe(SelectConstants.MAX_PAGE_SIZE);
    expect(capPageSize(5000)).toBe(SelectConstants.MAX_PAGE_SIZE);
  });
});
