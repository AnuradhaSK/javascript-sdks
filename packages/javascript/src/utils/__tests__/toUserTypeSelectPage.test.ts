// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import type {ManagedUserType, ManagedUserTypeListResponse} from '../../models/managed-user-type';
import toUserTypeSelectPage from '../toUserTypeSelectPage';

const userType = (overrides: Partial<ManagedUserType> & {id: string}): ManagedUserType => ({
  displayName: 'Employee',
  handle: 'employee',
  ...overrides,
});

const response = (types: ManagedUserType[], startIndex: number, totalResults: number): ManagedUserTypeListResponse => ({
  count: types.length,
  links: [],
  startIndex,
  totalResults,
  types,
});

describe('toUserTypeSelectPage', () => {
  it('shows and submits the handle, never the display name', () => {
    const page = toUserTypeSelectPage(
      response(
        [
          userType({displayName: 'Staff', handle: 'employee', id: 'type-1'}),
          userType({displayName: 'Staff', handle: 'contractor', id: 'type-2'}),
        ],
        1,
        2,
      ),
      0,
    );

    expect(page.options).toEqual([
      {label: 'employee', value: 'employee'},
      {label: 'contractor', value: 'contractor'},
    ]);
  });

  it('computes the next offset from the request offset and the backend count', () => {
    const types: ManagedUserType[] = [userType({id: 'type-1'}), userType({handle: 'guest', id: 'type-2'})];

    expect(toUserTypeSelectPage(response(types, 31, 75), 30).nextOffset).toBe(32);
  });

  it('ends the list on the last page', () => {
    expect(toUserTypeSelectPage(response([userType({id: 'type-75'})], 75, 75), 74).nextOffset).toBeNull();
  });

  it('drops a user type without a handle but still advances by the backend count', () => {
    const page = toUserTypeSelectPage(
      response([userType({handle: '', id: 'type-1'}), userType({id: 'type-2'})], 1, 10),
      0,
    );

    expect(page.options).toEqual([{label: 'employee', value: 'employee'}]);
    expect(page.nextOffset).toBe(2);
  });
});
