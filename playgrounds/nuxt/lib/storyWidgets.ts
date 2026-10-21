// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Checkbox, OtpField, PasswordField, Select, TextField} from '@thunderid/vue';
import {defineComponent, h, ref, type Component, type PropType, type Ref, type VNode} from 'vue';
import type {Action, Args} from './storyTypes';

const str = (args: Args, key: string): string => String(args[key] ?? '');
const bool = (args: Args, key: string): boolean => args[key] === true;
const num = (args: Args, key: string): number => Number(args[key] ?? 0);
const optional = (args: Args, key: string): string | undefined => str(args, key) || undefined;

const storyProps = {
  action: {required: true, type: Function as PropType<Action>},
  args: {required: true, type: Object as PropType<Args>},
};

/**
 * Builds a story component that keeps the field value between renders, the way `v-model` would in
 * an application, and reports every change to the Actions panel.
 */
const withModel = <T>(
  name: string,
  initial: T,
  render: (args: Args, value: Ref<T>, update: (next: T) => void, action: Action) => VNode,
): Component =>
  defineComponent({
    name,
    props: storyProps,
    setup(props: {action: Action; args: Args}): () => VNode {
      const value: Ref<T> = ref(initial) as Ref<T>;

      return (): VNode =>
        render(
          props.args,
          value,
          (next: T) => {
            value.value = next;
          },
          props.action,
        );
    },
  });

export const TextFieldStory: Component = withModel<string>('TextFieldStory', '', (args, value, update, action) =>
  h('div', {style: {maxWidth: '100%', width: '320px'}}, [
    h(TextField, {
      disabled: bool(args, 'disabled'),
      error: optional(args, 'error'),
      helperText: optional(args, 'helperText'),
      label: str(args, 'label'),
      modelValue: value.value,
      placeholder: str(args, 'placeholder'),
      required: bool(args, 'required'),
      'onUpdate:modelValue': (next: string) => {
        update(next);
        action('update:modelValue', `"${next}"`);
      },
    }),
  ]),
);

export const PasswordFieldStory: Component = withModel<string>(
  'PasswordFieldStory',
  '',
  (args, value, update, action) =>
    h('div', {style: {maxWidth: '100%', width: '320px'}}, [
      h(PasswordField, {
        disabled: bool(args, 'disabled'),
        error: optional(args, 'error'),
        label: str(args, 'label'),
        modelValue: value.value,
        placeholder: str(args, 'placeholder'),
        required: bool(args, 'required'),
        'onUpdate:modelValue': (next: string) => {
          update(next);
          action('update:modelValue', `"${'•'.repeat(next.length)}"`);
        },
      }),
    ]),
);

export const OtpFieldStory: Component = withModel<string>('OtpFieldStory', '', (args, value, update, action) =>
  h(OtpField, {
    disabled: bool(args, 'disabled'),
    error: optional(args, 'error'),
    label: str(args, 'label'),
    length: num(args, 'length'),
    modelValue: value.value,
    numericOnly: bool(args, 'numericOnly'),
    'onUpdate:modelValue': (next: string) => {
      update(next);
      action('update:modelValue', `"${next}"`);
    },
  }),
);

export const CheckboxStory: Component = withModel<boolean>('CheckboxStory', false, (args, value, update, action) =>
  h(Checkbox, {
    disabled: bool(args, 'disabled'),
    error: optional(args, 'error'),
    label: str(args, 'label'),
    modelValue: value.value,
    required: bool(args, 'required'),
    'onUpdate:modelValue': (next: boolean) => {
      update(next);
      action('update:modelValue', String(next));
    },
  }),
);

export const SelectStory: Component = withModel<string>('SelectStory', '', (args, value, update, action) =>
  h('div', {style: {maxWidth: '100%', width: '320px'}}, [
    h(Select, {
      disabled: bool(args, 'disabled'),
      error: optional(args, 'error'),
      helperText: optional(args, 'helperText'),
      label: str(args, 'label'),
      loading: bool(args, 'loading'),
      modelValue: value.value,
      options: [
        {label: 'Engineering', value: 'eng'},
        {label: 'Design', value: 'design'},
        {label: 'Sales', value: 'sales'},
      ],
      placeholder: str(args, 'placeholder'),
      'onUpdate:modelValue': (next: string) => {
        update(next);
        action('update:modelValue', `"${next}"`);
      },
    }),
  ]),
);

export const narrow = (width: number, child: VNode): VNode =>
  h('div', {style: {maxWidth: '100%', width: `${width}px`}}, [child]);
