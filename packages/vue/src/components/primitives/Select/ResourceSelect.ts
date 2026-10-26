// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {bem, createResourceOptionsLoader, resolvePageSize, withVendorCSSClassPrefix} from '@thunderid/browser';
import type {
  EmbeddedFlowComponent,
  EmbeddedFlowComponentType,
  FetchSelectPage,
  ResourceOptionsLoader,
  SelectOption,
  SelectOptionDefaults,
  SelectOptionMapping,
} from '@thunderid/browser';
import {
  type Component,
  type PropType,
  type SetupContext,
  type VNode,
  computed,
  defineComponent,
  h,
  onMounted,
  watch,
} from 'vue';
import Select from './Select';
import useInfiniteOptions from '../../../composables/management/useInfiniteOptions';
import useI18n from '../../../composables/useI18n';

const NO_PAGES: FetchSelectPage = () => Promise.resolve({nextOffset: null, options: []});

/** The props every resource picker (users, authentication flows, user types) passes straight through. */
export const commonSelectProps = {
  component: {default: undefined, type: Object as PropType<EmbeddedFlowComponent>},
  disabled: {default: false, type: Boolean},
  emptyText: {default: undefined, type: String},
  error: {default: undefined, type: String},
  filter: {default: undefined, type: String},
  helperText: {default: undefined, type: String},
  id: {default: undefined, type: String},
  label: {default: undefined, type: String},
  modelValue: {default: '', type: String},
  name: {default: undefined, type: String},
  /** Called with the error of every failed load. The list itself shows no error. */
  onError: {default: undefined, type: Function as PropType<(error: Error) => void>},
  /** Options per request. Defaults to 30 and is capped at 100. */
  pageSize: {default: undefined, type: Number},
  placeholder: {default: undefined, type: String},
  required: {default: false, type: Boolean},
  selectedOption: {default: undefined, type: Object as PropType<SelectOption>},
} as const;

export type CommonSelectProps = Readonly<{
  component?: EmbeddedFlowComponent;
  disabled: boolean;
  emptyText: string | undefined;
  error: string | undefined;
  filter: string | undefined;
  helperText: string | undefined;
  id: string | undefined;
  label: string | undefined;
  modelValue: string;
  name: string | undefined;
  onError: ((error: Error) => void) | undefined;
  pageSize: number | undefined;
  placeholder: string | undefined;
  required: boolean;
  selectedOption: SelectOption | undefined;
}>;

type ResourceSelectProps = CommonSelectProps &
  Readonly<{
    bemBlock: string;
    defaults?: SelectOptionDefaults;
    fallbackMessages: {ariaLabel: string; empty: string};
    fetchPage?: FetchSelectPage;
    mapping?: SelectOptionMapping;
    messageKey: string;
    resource: string;
    type: EmbeddedFlowComponentType;
  }>;

/**
 * The part the `USER_SELECT`, `AUTH_FLOW_SELECT` and `USER_TYPE_SELECT` pickers share: a {@link Select} that loads
 * one resource page by page. The list restarts when the page function, filter or page size changes.
 */
const ResourceSelect: Component = defineComponent({
  name: 'ResourceSelect',
  props: {
    ...commonSelectProps,
    /** Block name for the picker's CSS class, e.g. `user-select`. */
    bemBlock: {required: true, type: String},
    defaults: {default: undefined, type: Object as PropType<SelectOptionDefaults>},
    /** Wording used when the translations for the keys under `messageKey` are empty. */
    fallbackMessages: {required: true, type: Object as PropType<{ariaLabel: string; empty: string}>},
    /** Loads one page of the resource. Nothing is requested while this is unset. */
    fetchPage: {default: undefined, type: Function as PropType<FetchSelectPage>},
    mapping: {default: undefined, type: Object as PropType<SelectOptionMapping>},
    /** Translation key group under `elements.fields`, e.g. `user_select`. */
    messageKey: {required: true, type: String},
    /** What is loaded, in the words of the failure log, e.g. `users`. */
    resource: {required: true, type: String},
    /** The flow component type this picker stands for. */
    type: {required: true, type: String as PropType<EmbeddedFlowComponentType>},
  },
  emits: ['blur', 'update:modelValue'],
  setup(props: ResourceSelectProps, {emit}: SetupContext): () => VNode {
    const {t} = useI18n();

    // Only the page function, filter and page size restart the list. Mapping, defaults and component are read when
    // a page loads, so a parent that passes a new object on every render does not reload it.
    const loader = computed(
      (): ResourceOptionsLoader =>
        createResourceOptionsLoader({
          get component(): EmbeddedFlowComponent {
            return (
              props.component ??
              ({id: props.id ?? props.name ?? props.bemBlock, type: props.type} as EmbeddedFlowComponent)
            );
          },
          get defaults(): SelectOptionDefaults | undefined {
            return props.defaults;
          },
          fetchPage: props.fetchPage ?? NO_PAGES,
          filter: props.filter,
          get mapping(): SelectOptionMapping | undefined {
            return props.mapping;
          },
          pageSize: resolvePageSize(props.pageSize),
          resource: props.resource,
        }),
    );

    const {hasMore, loading, onLoadMore, options, reset} = useInfiniteOptions<number>({
      load: (context) => loader.value(context),
      onError: (error: Error) => props.onError?.(error),
    });

    // The first batch is requested when the picker renders. A different page function, filter or page size starts
    // the list again from the beginning.
    onMounted(() => {
      if (props.fetchPage) {
        onLoadMore();
      }
    });

    watch(loader, () => {
      reset();

      if (props.fetchPage) {
        onLoadMore();
      }
    });

    return (): VNode => {
      // No manual `attrs.class` merge: Vue's attrs fallthrough already applies it to the root.
      return h(Select, {
        // The first of these that is not empty names the select. An empty string is not a name.
        'aria-label':
          [props.label, props.placeholder, t(`elements.fields.${props.messageKey}.aria_label`)].find((text) =>
            Boolean(text),
          ) ?? props.fallbackMessages.ariaLabel,
        class: withVendorCSSClassPrefix(bem(props.bemBlock)),
        disabled: props.disabled,
        emptyText: props.emptyText ?? (t(`elements.fields.${props.messageKey}.empty`) || props.fallbackMessages.empty),
        error: props.error,
        helperText: props.helperText,
        id: props.id,
        label: props.label,
        loading: loading.value,
        modelValue: props.modelValue,
        name: props.name,
        onBlur: () => emit('blur'),
        onLoadMore: props.fetchPage && hasMore.value ? onLoadMore : undefined,
        options: options.value,
        placeholder: props.placeholder,
        required: props.required,
        selectedOption: props.selectedOption,
        'onUpdate:modelValue': (value: string) => emit('update:modelValue', value),
      });
    };
  },
});

export default ResourceSelect;
