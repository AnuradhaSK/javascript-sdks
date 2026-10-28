// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import getAccountLifecycleActions from '../getAccountLifecycleActions';

const allUserFlows: Record<string, string> = {
  userSuspendFlow: 'f-suspend',
  userUnlockFlow: 'f-unlock',
  userUnsuspendFlow: 'f-unsuspend',
};

describe('getAccountLifecycleActions', () => {
  it('offers the actions each status allows, most expected first', () => {
    expect(getAccountLifecycleActions('user', 'ACTIVE', allUserFlows)).toEqual(['suspend']);
    expect(getAccountLifecycleActions('user', 'LOCKED', allUserFlows)).toEqual(['unlock', 'suspend']);
    expect(getAccountLifecycleActions('user', 'SUSPENDED', allUserFlows)).toEqual(['unsuspend']);
  });

  it('reads an identity with no status as active', () => {
    expect(getAccountLifecycleActions('user', undefined, allUserFlows)).toEqual(['suspend']);
  });

  it('offers only the actions whose flow is configured', () => {
    expect(getAccountLifecycleActions('user', 'LOCKED', {userSuspendFlow: 'f-suspend'})).toEqual(['suspend']);
    expect(getAccountLifecycleActions('user', 'ACTIVE', {})).toEqual([]);
  });

  it('reads the flows of the identity kind it is given', () => {
    expect(getAccountLifecycleActions('agent', 'ACTIVE', allUserFlows)).toEqual([]);
    expect(getAccountLifecycleActions('agent', 'LOCKED', {agentSuspendFlow: 'a', agentUnlockFlow: 'b'})).toEqual([
      'unlock',
      'suspend',
    ]);
  });

  it('never offers an unlock for an application', () => {
    expect(
      getAccountLifecycleActions('application', 'LOCKED', {
        applicationSuspendFlow: 'a',
        applicationUnsuspendFlow: 'b',
      }),
    ).toEqual(['suspend']);
  });

  it('offers nothing for a status it does not know', () => {
    expect(getAccountLifecycleActions('user', 'ARCHIVED' as never, allUserFlows)).toEqual([]);
  });
});
