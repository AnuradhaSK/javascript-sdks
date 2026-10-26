// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {type Component, type VNode, defineComponent, h, Fragment} from 'vue';
import useThunderID from '../../../composables/useThunderID';

/**
 * A component that only renders its children when the user is signed in.
 *
 * @example
 * ```vue
 * <SignedIn>
 *   <p>Welcome! You are signed in.</p>
 *   <template #fallback>
 *     <p>Please sign in to continue</p>
 *   </template>
 * </SignedIn>
 * ```
 */
const SignedIn: Component = defineComponent({
  name: 'SignedIn',
  setup(_props: Record<string, unknown>, {slots}: {slots: any}): () => VNode | VNode[] | null {
    const {isSignedIn} = useThunderID();

    return (): VNode | VNode[] | null => {
      if (!isSignedIn.value) {
        const fallbackContent: VNode[] | undefined = slots.fallback?.();
        return fallbackContent ? h(Fragment, {}, fallbackContent) : null;
      }

      const defaultContent: VNode[] | undefined = slots.default?.();
      return defaultContent ? h(Fragment, {}, defaultContent) : null;
    };
  },
});

export default SignedIn;
