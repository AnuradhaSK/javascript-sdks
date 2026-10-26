// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import NuxtAPIRoutes from '../../src/runtime/constants/NuxtAPIRoutes';
import getEnabledResourcePickers from '../../src/runtime/utils/getEnabledResourcePickers';

const routesOf = (enabled?: Parameters<typeof getEnabledResourcePickers>[0]): string[] =>
  getEnabledResourcePickers(enabled).map(({route}) => route);

describe('getEnabledResourcePickers', () => {
  it('serves nothing when resourcePickers is not set', () => {
    expect(getEnabledResourcePickers()).toEqual([]);
    expect(getEnabledResourcePickers({})).toEqual([]);
  });

  it('serves nothing for a picker that is false or not exactly true', () => {
    expect(getEnabledResourcePickers({authFlows: false, userTypes: false, users: false})).toEqual([]);
    expect(getEnabledResourcePickers({users: 'yes' as never})).toEqual([]);
  });

  it('serves only the picker that is turned on', () => {
    expect(routesOf({users: true})).toEqual([NuxtAPIRoutes.USERS]);
    expect(routesOf({authFlows: true})).toEqual([NuxtAPIRoutes.AUTH_FLOWS]);
    expect(routesOf({userTypes: true})).toEqual([NuxtAPIRoutes.USER_TYPES]);
  });

  it('serves each picker that is turned on and no other', () => {
    expect(routesOf({authFlows: true, users: true})).toEqual([NuxtAPIRoutes.AUTH_FLOWS, NuxtAPIRoutes.USERS]);
  });

  it('pairs each route with its own component and handler', () => {
    expect(getEnabledResourcePickers({authFlows: true, userTypes: true, users: true})).toEqual([
      {
        component: 'AuthFlowSelect',
        componentPath: './runtime/components/primitives/AuthFlowSelect',
        handlerPath: './runtime/server/routes/auth/select/auth-flows.get',
        route: NuxtAPIRoutes.AUTH_FLOWS,
      },
      {
        component: 'UserTypeSelect',
        componentPath: './runtime/components/primitives/UserTypeSelect',
        handlerPath: './runtime/server/routes/auth/select/user-types.get',
        route: NuxtAPIRoutes.USER_TYPES,
      },
      {
        component: 'UserSelect',
        componentPath: './runtime/components/primitives/UserSelect',
        handlerPath: './runtime/server/routes/auth/user/users.get',
        route: NuxtAPIRoutes.USERS,
      },
    ]);
  });
});
