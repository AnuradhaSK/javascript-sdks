// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {normalizeSelectOptions, SelectConstants, withVendorCSSClassPrefix} from '@thunderid/browser';
import type {SelectOption, SelectOptionInput} from '@thunderid/browser';
import {type Component, type SetupContext, type VNode, defineComponent, h, type PropType} from 'vue';
import useSelectMessages from './useSelectMessages';

export type {SelectOption, SelectOptionInput};

type SelectProps = Readonly<{
  ariaLabel: string | undefined;
  disabled: boolean;
  emptyText: string | undefined;
  error: string | undefined;
  helperText: string | undefined;
  label: string | undefined;
  loading: boolean;
  modelValue: string;
  name: string | undefined;
  onLoadMore: (() => void) | undefined;
  options: readonly (SelectOptionInput | null | undefined)[] | null;
  placeholder: string | undefined;
  required: boolean;
  selectedOption: SelectOption | undefined;
}>;

const Select: Component = defineComponent({
  name: 'Select',
  props: {
    ariaLabel: {default: undefined, type: String},
    disabled: {default: false, type: Boolean},
    /** Text shown below the select when it has no options, nothing is loading and there is nothing more to load. */
    emptyText: {default: undefined, type: String},
    error: {default: undefined, type: String},
    helperText: {default: undefined, type: String},
    label: {default: undefined, type: String},
    /** Whether options are being fetched. The load more option waits, and a select with no options shows a loading message. */
    loading: {default: false, type: Boolean},
    modelValue: {default: '', type: String},
    name: {default: undefined, type: String},
    /**
     * Called when the load more option, listed after the last one, is chosen. Choosing it does not change the
     * selection. The option is listed only when this is set, so pass it only while more options may be available.
     */
    onLoadMore: {default: undefined, type: Function as PropType<() => void>},
    /** The options to display: strings, numbers, or `{label, value, disabled?}` objects. */
    options: {default: () => [], type: Array as PropType<readonly (SelectOptionInput | null | undefined)[] | null>},
    /** Text of the empty option. While the field is not required, choosing it clears the selection. */
    placeholder: {default: undefined, type: String},
    required: {default: false, type: Boolean},
    /** Label of the selected option while `modelValue` is not among `options`, such as a value loaded from saved data. */
    selectedOption: {default: undefined, type: Object as PropType<SelectOption>},
  },
  emits: ['blur', 'update:modelValue'],
  setup(props: SelectProps, {emit, attrs}: SetupContext): () => VNode {
    const messages = useSelectMessages();

    return (): VNode => {
      const hasError = !!props.error;
      const items: SelectOption[] = normalizeSelectOptions(props.options);
      const text = messages();
      const wrapperClass: string = [
        withVendorCSSClassPrefix('select'),
        hasError ? withVendorCSSClassPrefix('select--error') : '',
        (attrs.class as string) || '',
      ]
        .filter(Boolean)
        .join(' ');

      let helperContent: VNode | null;
      if (hasError) {
        helperContent = h('span', {class: withVendorCSSClassPrefix('select__error')}, props.error);
      } else if (props.helperText) {
        helperContent = h('span', {class: withVendorCSSClassPrefix('select__helper')}, props.helperText);
      } else {
        helperContent = null;
      }

      const {selectedOption} = props;
      const showsSelectedOption: boolean =
        selectedOption?.value === props.modelValue &&
        !items.some((item: SelectOption) => item.value === props.modelValue);

      let statusText: string | undefined;
      if (props.loading) {
        statusText = items.length === 0 ? text.loading : text.loadingMore;
      } else if (items.length === 0 && !props.onLoadMore) {
        statusText = props.emptyText;
      }

      const hasStatus: boolean = props.onLoadMore !== undefined || props.emptyText !== undefined || props.loading;
      const showsLoadMore: boolean = props.onLoadMore !== undefined && (items.length > 0 || !props.loading);

      return h('div', {class: wrapperClass, style: attrs.style}, [
        props.label
          ? h('label', {class: withVendorCSSClassPrefix('select__label'), for: props.name}, [
              props.label,
              props.required ? h('span', {class: withVendorCSSClassPrefix('select__required')}, ' *') : null,
            ])
          : null,
        h(
          'select',
          {
            'aria-busy': props.loading || undefined,
            'aria-label': props.ariaLabel,
            class: withVendorCSSClassPrefix('select__input'),
            'data-testid': attrs['data-testid'],
            disabled: props.disabled,
            id: props.name,
            name: props.name,
            onBlur: () => emit('blur'),
            onChange: (e: Event) => {
              const control = e.target as HTMLSelectElement;

              if (control.value !== SelectConstants.LOAD_MORE_OPTION_VALUE) {
                emit('update:modelValue', control.value);

                return;
              }

              control.value = props.modelValue;
              props.onLoadMore?.();
            },
            required: props.required,
            value: props.modelValue,
          },
          [
            props.placeholder ? h('option', {disabled: props.required, value: ''}, props.placeholder) : null,
            showsSelectedOption && selectedOption
              ? h('option', {value: selectedOption.value}, selectedOption.label)
              : null,
            ...items.map((opt: SelectOption) =>
              h('option', {disabled: opt.disabled, key: opt.value, value: opt.value}, opt.label),
            ),
            showsLoadMore
              ? h(
                  'option',
                  {
                    class: withVendorCSSClassPrefix('select__load-more'),
                    disabled: props.loading,
                    value: SelectConstants.LOAD_MORE_OPTION_VALUE,
                  },
                  props.loading ? text.loadingMore : text.loadMore,
                )
              : null,
          ],
        ),
        hasStatus ? h('span', {class: withVendorCSSClassPrefix('select__status'), role: 'status'}, statusText) : null,
        helperContent,
      ]);
    };
  },
});

export default Select;
