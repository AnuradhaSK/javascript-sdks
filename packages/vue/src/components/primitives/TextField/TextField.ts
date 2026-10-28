// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix} from '@thunderid/browser';
import {type Component, type SetupContext, type VNode, defineComponent, h, type PropType} from 'vue';

type TextFieldProps = Readonly<{
  autoComplete: string | undefined;
  disabled: boolean;
  error: string | undefined;
  helperText: string | undefined;
  id: string | undefined;
  label: string | undefined;
  maxLength: number | undefined;
  modelValue: string;
  name: string | undefined;
  placeholder: string | undefined;
  required: boolean;
  type: 'text' | 'email' | 'number' | 'tel' | 'url';
}>;

const TextField: Component = defineComponent({
  name: 'TextField',
  props: {
    autoComplete: {default: undefined, type: String},
    disabled: {default: false, type: Boolean},
    error: {default: undefined, type: String},
    helperText: {default: undefined, type: String},
    id: {default: undefined, type: String},
    label: {default: undefined, type: String},
    /** The most characters the field accepts. */
    maxLength: {default: undefined, type: Number},
    modelValue: {default: '', type: String},
    name: {default: undefined, type: String},
    placeholder: {default: undefined, type: String},
    required: {default: false, type: Boolean},
    type: {
      default: 'text',
      type: String as PropType<'text' | 'email' | 'number' | 'tel' | 'url'>,
    },
  },
  emits: ['update:modelValue', 'blur'],
  setup(props: TextFieldProps, {emit, attrs}: SetupContext): () => VNode {
    return (): VNode => {
      const hasError = !!props.error;
      const wrapperClass: string = [
        withVendorCSSClassPrefix('text-field'),
        hasError ? withVendorCSSClassPrefix('text-field--error') : '',
        (attrs.class as string) || '',
      ]
        .filter(Boolean)
        .join(' ');

      let helperContent: VNode | null;
      if (hasError) {
        helperContent = h('span', {class: withVendorCSSClassPrefix('text-field__error')}, props.error);
      } else if (props.helperText) {
        helperContent = h('span', {class: withVendorCSSClassPrefix('text-field__helper')}, props.helperText);
      } else {
        helperContent = null;
      }

      return h('div', {class: wrapperClass, style: attrs.style}, [
        props.label
          ? h(
              'label',
              {
                class: withVendorCSSClassPrefix('text-field__label'),
                for: props.id ?? props.name,
              },
              [
                props.label,
                props.required ? h('span', {class: withVendorCSSClassPrefix('text-field__required')}, ' *') : null,
              ],
            )
          : null,
        h('input', {
          autocomplete: props.autoComplete,
          class: withVendorCSSClassPrefix('text-field__input'),
          'data-testid': attrs['data-testid'],
          disabled: props.disabled,
          id: props.id ?? props.name,
          maxlength: props.maxLength,
          name: props.name,
          onBlur: () => emit('blur'),
          onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
          placeholder: props.placeholder,
          required: props.required,
          type: props.type,
          value: props.modelValue,
        }),
        helperContent,
      ]);
    };
  },
});

export default TextField;
