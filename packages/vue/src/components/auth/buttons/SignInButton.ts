// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDRuntimeError, navigate} from '@thunderid/browser';
import {
  Fragment,
  defineComponent,
  h,
  ref,
  type Component,
  type PropType,
  type Ref,
  type SetupContext,
  type VNode,
} from 'vue';
import BaseSignInButton from './BaseSignInButton';
import useThunderID from '../../../composables/useThunderID';

/**
 * SignInButton — triggers `signIn()` from the ThunderID context.
 *
 * If a custom `signInUrl` is configured, navigates to it instead.
 * Falls back to i18n translation for the button text.
 *
 * By default, slot content is rendered *inside* the styled button (matching
 * {@link BaseSignInButton}'s convention) — the click handler and styling are
 * wired up for you.
 *
 * @example
 * <!-- Default: content is wrapped in the styled, click-wired button -->
 * <SignInButton>Sign In</SignInButton>
 * <SignInButton v-slot="{ isLoading }">{{ isLoading ? 'Signing in…' : 'Sign in' }}</SignInButton>
 *
 * @example
 * <!-- asChild: full control — you render the element and wire the click yourself -->
 * <SignInButton as-child v-slot="{ signIn, isLoading }">
 *   <button @click="signIn" :disabled="isLoading">Sign In</button>
 * </SignInButton>
 */
const SignInButton: Component = defineComponent({
  name: 'SignInButton',
  props: {
    asChild: {default: false, type: Boolean},
    signInOptions: {default: undefined, type: Object as PropType<Record<string, any>>},
  },
  emits: ['click', 'error'],
  setup(
    props: {asChild: boolean; signInOptions?: Record<string, any>},
    {slots, emit, attrs}: SetupContext,
  ): () => VNode {
    const {signIn, signInUrl, signInOptions: contextSignInOptions} = useThunderID();
    const isLoading: Ref<boolean> = ref(false);

    const handleSignIn = async (e?: MouseEvent): Promise<void> => {
      try {
        isLoading.value = true;
        if (signInUrl) {
          navigate(signInUrl);
        } else {
          await signIn(props.signInOptions ?? contextSignInOptions);
        }
        if (e) emit('click', e);
      } catch (error) {
        emit('error', error);
        throw new ThunderIDRuntimeError(
          `Sign in failed: ${error instanceof Error ? error.message : String(error)}`,
          'SignInButton-handleSignIn-RuntimeError-001',
          'vue',
          'Something went wrong while trying to sign in. Please try again later.',
        );
      } finally {
        isLoading.value = false;
      }
    };

    return (): VNode => {
      // asChild: caller renders their own element and wires the click themselves.
      if (props.asChild && slots['default']) {
        const nodes: VNode[] = slots['default']({isLoading: isLoading.value, signIn: handleSignIn});
        return nodes.length === 1 ? nodes[0] : h(Fragment, null, nodes);
      }

      // Default: forward slot content (or fallback text) into the styled,
      // click-wired BaseSignInButton — same convention as BaseSignInButton itself.
      const slotContent: (() => VNode[]) | undefined = slots['default']
        ? (): VNode[] => slots['default']!({isLoading: isLoading.value, signIn: handleSignIn})
        : undefined;

      return h(
        BaseSignInButton,
        {
          class: attrs.class,
          isLoading: isLoading.value,
          onClick: handleSignIn,
          style: attrs.style,
        },
        slotContent,
      );
    };
  },
});

export default SignInButton;
