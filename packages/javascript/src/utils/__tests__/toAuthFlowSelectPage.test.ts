// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import type {ManagedFlow, ManagedFlowListResponse} from '../../models/managed-flow';
import toAuthFlowSelectPage from '../toAuthFlowSelectPage';

const flow = (overrides: Partial<ManagedFlow> & {id: string}): ManagedFlow => ({
  activeVersion: 1,
  flowType: 'AUTHENTICATION',
  handle: 'default-login',
  name: 'Default login',
  ...overrides,
});

const response = (flows: ManagedFlow[], startIndex: number, totalResults: number): ManagedFlowListResponse => ({
  count: flows.length,
  flows,
  links: [],
  startIndex,
  totalResults,
});

describe('toAuthFlowSelectPage', () => {
  it('shows the flow name and submits the flow ID', () => {
    const page = toAuthFlowSelectPage(
      response([flow({id: 'flow-1', name: 'Password login'}), flow({id: 'flow-2', name: 'Passkey login'})], 1, 2),
      0,
    );

    expect(page.options).toEqual([
      {label: 'Password login', value: 'flow-1'},
      {label: 'Passkey login', value: 'flow-2'},
    ]);
    expect(page.totalResults).toBe(2);
  });

  it('computes the next offset from the request offset and the backend count', () => {
    const flows: ManagedFlow[] = [flow({id: 'flow-1'}), flow({id: 'flow-2'})];

    expect(toAuthFlowSelectPage(response(flows, 31, 75), 30).nextOffset).toBe(32);
  });

  it('ends the list on the last page', () => {
    expect(toAuthFlowSelectPage(response([flow({id: 'flow-75'})], 75, 75), 74).nextOffset).toBeNull();
  });

  it('labels a flow with an empty name by its handle, then by its ID', () => {
    const page = toAuthFlowSelectPage(
      response([flow({handle: 'sso-login', id: 'flow-1', name: ''}), flow({handle: '', id: 'flow-2', name: ''})], 1, 2),
      0,
    );

    expect(page.options).toEqual([
      {label: 'sso-login', value: 'flow-1'},
      {label: 'flow-2', value: 'flow-2'},
    ]);
  });
});
