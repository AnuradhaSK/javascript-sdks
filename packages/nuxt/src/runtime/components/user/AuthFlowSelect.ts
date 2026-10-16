// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {BaseAuthFlowSelect} from '@thunderid/vue';
import {type Component, type SetupContext, type VNode, defineComponent, h} from 'vue';
import fetchAuthFlowsFromServer from '../../utils/fetchAuthFlowsFromServer';

/**
 * Nuxt-specific AuthFlowSelect container.
 *
 * Loads authentication flows through `GET /api/auth/auth-flows` with the signed-in user's server-held
 * session, so the access token never reaches the browser. It takes no data source; for a custom one use
 * `Select` with `useInfiniteOptions`. All other props (`v-model`, `label`, ...) go to the Vue component.
 *
 * @example
 * ```vue
 * <AuthFlowSelect v-model="authFlowId" label="Login flow" />
 * ```
 */
const AuthFlowSelect: Component = defineComponent({
  name: 'AuthFlowSelect',
  inheritAttrs: false,
  setup(_props: Record<string, never>, {attrs}: SetupContext): () => VNode {
    return (): VNode => h(BaseAuthFlowSelect, {...attrs, fetchAuthFlows: fetchAuthFlowsFromServer});
  },
});

export default AuthFlowSelect;
