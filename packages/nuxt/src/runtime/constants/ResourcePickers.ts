// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import NuxtAPIRoutes from './NuxtAPIRoutes';

/**
 * A management picker: the component, and the server route that loads its options. The paths are relative to the
 * module, for the module to resolve.
 */
export interface ResourcePicker {
  component: string;
  componentPath: string;
  handlerPath: string;
  route: string;
}

/**
 * The management pickers, by the key that turns each one on in `resourcePickers`.
 */
const ResourcePickers: Record<'authFlows' | 'userTypes' | 'users', ResourcePicker> = {
  authFlows: {
    component: 'AuthFlowSelect',
    componentPath: './runtime/components/user/AuthFlowSelect',
    handlerPath: './runtime/server/routes/auth/select/auth-flows.get',
    route: NuxtAPIRoutes.AUTH_FLOWS,
  },
  userTypes: {
    component: 'UserTypeSelect',
    componentPath: './runtime/components/user/UserTypeSelect',
    handlerPath: './runtime/server/routes/auth/select/user-types.get',
    route: NuxtAPIRoutes.USER_TYPES,
  },
  users: {
    component: 'UserSelect',
    componentPath: './runtime/components/user/UserSelect',
    handlerPath: './runtime/server/routes/auth/user/users.get',
    route: NuxtAPIRoutes.USERS,
  },
};

export default ResourcePickers;
