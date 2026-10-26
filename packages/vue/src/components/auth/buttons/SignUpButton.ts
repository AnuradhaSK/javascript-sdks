// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDRuntimeError, navigate} from '@thunderid/browser';
import {Fragment, defineComponent, h, ref, type Component, type Ref, type SetupContext, type VNode} from 'vue';
import BaseSignUpButton from './BaseSignUpButton';
import useThunderID from '../../../composables/useThunderID';

/**
 * SignUpButton — triggers `signUp()` from the ThunderID context.
 *
 * If a custom `signUpUrl` is configured, navigates to it instead.
 * Falls back to i18n translation for the button text.
 *
 * By default, slot content is rendered *inside* the styled button (matching
 * {@link BaseSignUpButton}'s convention) — the click handler and styling are
 * wired up for you.
 *
 * @example
 * <!-- Default: content is wrapped in the styled, click-wired button -->
 * <SignUpButton>Sign Up</SignUpButton>
 * <SignUpButton v-slot="{ isLoading }">{{ isLoading ? 'Signing up…' : 'Sign up' }}</SignUpButton>
 *
 * @example
 * <!-- asChild: full control — you render the element and wire the click yourself -->
 * <SignUpButton as-child v-slot="{ signUp, isLoading }">
 *   <button @click="signUp" :disabled="isLoading">Sign Up</button>
 * </SignUpButton>
 */
const SignUpButton: Component = defineComponent({
  name: 'SignUpButton',
  props: {
    asChild: {default: false, type: Boolean},
  },
  emits: ['click', 'error'],
  setup(props: {asChild: boolean}, {slots, emit, attrs}: SetupContext): () => VNode {
    const {signUp, signUpUrl} = useThunderID();
    const isLoading: Ref<boolean> = ref(false);

    const handleSignUp = async (e?: MouseEvent): Promise<void> => {
      try {
        isLoading.value = true;
        if (signUpUrl) {
          navigate(signUpUrl);
        } else {
          await signUp();
        }
        if (e) emit('click', e);
      } catch (error) {
        emit('error', error);
        throw new ThunderIDRuntimeError(
          `Sign up failed: ${error instanceof Error ? error.message : String(error)}`,
          'SignUpButton-handleSignUp-RuntimeError-001',
          'vue',
          'Something went wrong while trying to sign up. Please try again later.',
        );
      } finally {
        isLoading.value = false;
      }
    };

    return (): VNode => {
      // asChild: caller renders their own element and wires the click themselves.
      if (props.asChild && slots['default']) {
        const nodes: VNode[] = slots['default']({isLoading: isLoading.value, signUp: handleSignUp});
        return nodes.length === 1 ? nodes[0] : h(Fragment, null, nodes);
      }

      // Default: forward slot content (or fallback text) into the styled,
      // click-wired BaseSignUpButton — same convention as BaseSignUpButton itself.
      const slotContent: (() => VNode[]) | undefined = slots['default']
        ? (): VNode[] => slots['default']!({isLoading: isLoading.value, signUp: handleSignUp})
        : undefined;

      return h(
        BaseSignUpButton,
        {
          class: attrs.class,
          isLoading: isLoading.value,
          onClick: handleSignUp,
          style: attrs.style,
        },
        slotContent,
      );
    };
  },
});

export default SignUpButton;
