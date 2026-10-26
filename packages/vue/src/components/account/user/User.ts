// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {type Component, type VNode, defineComponent, h, Fragment} from 'vue';
import useThunderID from '../../../composables/useThunderID';

/**
 * User — presentation component that exposes the current user via a scoped slot.
 *
 * Renders the `default` slot with `{ user }` when a user is signed in,
 * or the `fallback` slot when no user is available.
 *
 * @example
 * ```vue
 * <User>
 *   <template #default="{ user }">
 *     <p>Welcome, {{ user.given_name }}!</p>
 *   </template>
 *   <template #fallback>
 *     <p>No user signed in.</p>
 *   </template>
 * </User>
 * ```
 */
const User: Component = defineComponent({
  name: 'User',
  setup(_props: Record<string, unknown>, {slots}: {slots: any}): () => VNode | VNode[] | null {
    const {user} = useThunderID();

    return (): VNode | VNode[] | null => {
      if (!user.value) {
        const fallbackContent: VNode[] | undefined = slots.fallback?.();
        return fallbackContent ? h(Fragment, {}, fallbackContent) : null;
      }

      const defaultContent: VNode[] | undefined = slots.default?.({user: user.value});
      return defaultContent ? h(Fragment, {}, defaultContent) : null;
    };
  },
});

export default User;
