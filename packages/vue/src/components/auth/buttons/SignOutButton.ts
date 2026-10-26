// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDRuntimeError} from '@thunderid/browser';
import {defineComponent, h, ref, type Component, type Ref, type SetupContext, type VNode} from 'vue';
import BaseSignOutButton from './BaseSignOutButton';
import useThunderID from '../../../composables/useThunderID';

/**
 * SignOutButton — triggers `signOut()` from the ThunderID context.
 */
const SignOutButton: Component = defineComponent({
  name: 'SignOutButton',
  emits: ['click', 'error'],
  setup(_: {}, {slots, emit, attrs}: SetupContext): () => VNode {
    const {signOut} = useThunderID();
    const isLoading: Ref<boolean> = ref(false);

    const handleSignOut = async (e?: MouseEvent): Promise<void> => {
      try {
        isLoading.value = true;
        await signOut();
        if (e) emit('click', e);
      } catch (error) {
        emit('error', error);
        throw new ThunderIDRuntimeError(
          `Sign out failed: ${error instanceof Error ? error.message : String(error)}`,
          'SignOutButton-handleSignOut-RuntimeError-001',
          'vue',
          'Something went wrong while trying to sign out. Please try again later.',
        );
      } finally {
        isLoading.value = false;
      }
    };

    return (): VNode => {
      const slotContent: (() => VNode[]) | undefined = slots['default']
        ? (): VNode[] => slots['default']!({isLoading: isLoading.value})
        : undefined;

      return h(
        BaseSignOutButton,
        {
          class: attrs.class,
          isLoading: isLoading.value,
          onClick: handleSignOut,
          style: attrs.style,
        },
        slotContent,
      );
    };
  },
});

export default SignOutButton;
