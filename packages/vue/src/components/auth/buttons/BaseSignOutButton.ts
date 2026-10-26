// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix} from '@thunderid/browser';
import {type Component, type VNode, defineComponent, h} from 'vue';
import Button from '../../primitives/Button';

/**
 * BaseSignOutButton — styled sign-out button with customization support.
 *
 * By default, renders a styled Button primitive with contents from the slot or fallback text.
 * Set `unstyled={true}` to render a plain <button> for full customization control.
 *
 * @example
 * <!-- Default styled button with custom text -->
 * <BaseSignOutButton>Custom Text</BaseSignOutButton>
 *
 * @example
 * <!-- Unstyled button for full customization -->
 * <BaseSignOutButton unstyled class="my-custom-styles">Custom Content</BaseSignOutButton>
 */
const BaseSignOutButton: Component = defineComponent({
  name: 'BaseSignOutButton',
  props: {
    disabled: {
      default: false,
      type: Boolean,
    },
    isLoading: {
      default: false,
      type: Boolean,
    },
    /**
     * When true, renders a plain <button> with no default styling.
     * When false (default), renders a styled Button component.
     */
    unstyled: {
      default: false,
      type: Boolean,
    },
  },
  emits: ['click'],
  setup(props: any, {slots, emit, attrs}: any): any {
    const handleClick = (e: MouseEvent): void => {
      if (!props.disabled && !props.isLoading) {
        emit('click', e);
      }
    };

    return (): any => {
      // Unstyled mode: plain button for full customization
      if (props.unstyled) {
        return h(
          'button',
          {
            class: [withVendorCSSClassPrefix('sign-out-button-wrapper'), (attrs.class as string) || '']
              .filter(Boolean)
              .join(' '),
            disabled: props.disabled || props.isLoading,
            onClick: handleClick,
            style: attrs.style,
            type: 'button' as const,
          },
          slots.default ? slots.default({isLoading: props.isLoading}) : 'Sign Out',
        );
      }

      // Styled mode (default): always render the styled Button with slot/fallback content
      return h(
        Button,
        {
          class: [withVendorCSSClassPrefix('sign-out-button'), (attrs.class as string) || ''].filter(Boolean).join(' '),
          disabled: props.disabled || props.isLoading,
          loading: props.isLoading,
          onClick: handleClick,
          style: attrs.style,
          type: 'button' as const,
        },
        slots.default ? (): VNode | VNode[] => slots.default({isLoading: props.isLoading}) : (): string => 'Sign Out',
      );
    };
  },
});

export default BaseSignOutButton;
