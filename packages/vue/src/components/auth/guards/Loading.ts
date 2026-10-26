// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {type Component, type VNode, defineComponent, h, Fragment} from 'vue';
import useThunderID from '../../../composables/useThunderID';

/**
 * A component that only renders its children when ThunderID is loading.
 *
 * @example
 * ```vue
 * <Loading>
 *   <p>Loading...</p>
 *   <template #fallback>
 *     <p>Finished loading</p>
 *   </template>
 * </Loading>
 * ```
 */
const Loading: Component = defineComponent({
  name: 'Loading',
  setup(_props: Record<string, unknown>, {slots}: {slots: any}): () => VNode | VNode[] | null {
    const {isLoading} = useThunderID();

    return (): VNode | VNode[] | null => {
      if (!isLoading.value) {
        const fallbackContent: VNode[] | undefined = slots.fallback?.();
        return fallbackContent ? h(Fragment, {}, fallbackContent) : null;
      }

      const defaultContent: VNode[] | undefined = slots.default?.();
      return defaultContent ? h(Fragment, {}, defaultContent) : null;
    };
  },
});

export default Loading;
