// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {BaseUserTypeSelect} from '@thunderid/vue';
import {type Component, type SetupContext, type VNode, defineComponent, h} from 'vue';
import fetchUserTypesFromServer from '../../utils/fetchUserTypesFromServer';

/**
 * Nuxt-specific UserTypeSelect container.
 *
 * Loads user types through `GET /api/auth/user-types` with the signed-in user's server-held session, so the
 * access token never reaches the browser. It takes no data source; for a custom one use `Select` with `useInfiniteOptions`. All
 * other props (`v-model`, `label`, ...) go to the Vue component.
 *
 * @example
 * ```vue
 * <UserTypeSelect v-model="userType" label="User type" />
 * ```
 */
const UserTypeSelect: Component = defineComponent({
  name: 'UserTypeSelect',
  inheritAttrs: false,
  setup(_props: Record<string, never>, {attrs}: SetupContext): () => VNode {
    return (): VNode => h(BaseUserTypeSelect, {...attrs, fetchUserTypes: fetchUserTypesFromServer});
  },
});

export default UserTypeSelect;
