// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  bem,
  createResourceOptionsLoader,
  SelectConstants,
  resolvePageSize,
  withVendorCSSClassPrefix,
} from '@thunderid/browser';
import type {
  EmbeddedFlowComponent,
  EmbeddedFlowComponentType,
  FetchSelectPage,
  ResourceOptionsLoader,
  SelectOptionDefaults,
  SelectOptionMapping,
} from '@thunderid/browser';
import {FC, useEffect, useMemo, useRef} from 'react';
import Select, {SelectProps} from './Select';
import useInfiniteOptions from '../../../hooks/management/useInfiniteOptions';
import useTranslation from '../../../hooks/useTranslation';
import {cx} from '../../../styles/emotion';

export interface ResourceSelectProps extends Omit<SelectProps, 'loading' | 'onError' | 'onLoadMore' | 'options'> {
  /** Block name for the picker's CSS class, e.g. `user-select`. */
  bemBlock: string;
  /** The flow component the page function is called for. Defaults to one built from `type`. */
  component?: EmbeddedFlowComponent;
  defaults?: SelectOptionDefaults;
  /** Wording used when the translations for the keys under `messageKey` are empty. */
  fallbackMessages: {ariaLabel: string; empty: string};
  /** Loads one page of the resource. Nothing is requested while this is unset. */
  fetchPage?: FetchSelectPage;
  filter?: string;
  mapping?: SelectOptionMapping;
  /** Translation key group under `elements.fields`, e.g. `user_select`. */
  messageKey: string;
  /** Called with the error of every failed load. The list itself shows no error. */
  onError?: (error: Error) => void;
  /** Options per request. Defaults to 30 and is capped at 100. */
  pageSize?: number;
  /** What is loaded, in the words of the failure log, e.g. `users`. */
  resource: string;
  /** The flow component type this picker stands for. */
  type: EmbeddedFlowComponentType;
}

const NO_PAGES: FetchSelectPage = () => Promise.resolve({nextOffset: null, options: []});

/**
 * The part the `USER_SELECT`, `AUTH_FLOW_SELECT` and `USER_TYPE_SELECT` pickers share: a {@link Select} that loads
 * one resource page by page. The list restarts when the page function, filter or page size changes.
 */
const ResourceSelect: FC<ResourceSelectProps> = ({
  'aria-label': ariaLabel,
  bemBlock,
  className,
  component,
  defaults,
  emptyText,
  fallbackMessages,
  fetchPage,
  filter,
  id,
  label,
  mapping,
  messageKey,
  name,
  onError,
  pageSize = SelectConstants.DEFAULT_PAGE_SIZE,
  placeholder,
  resource,
  type,
  ...rest
}: ResourceSelectProps) => {
  const {t} = useTranslation();
  const effectivePageSize: number = resolvePageSize(pageSize);

  const live = useRef({component, defaults, mapping});

  useEffect(() => {
    live.current = {component, defaults, mapping};
  });

  // Only the page function, filter and page size restart the list. Mapping, defaults and component are read when
  // a page loads, so a parent that passes a new object on every render does not reload it.
  const load: ResourceOptionsLoader = useMemo(
    () =>
      createResourceOptionsLoader({
        get component(): EmbeddedFlowComponent {
          return live.current.component ?? ({id: id ?? name ?? bemBlock, type} as EmbeddedFlowComponent);
        },
        get defaults(): SelectOptionDefaults | undefined {
          return live.current.defaults;
        },
        fetchPage: fetchPage ?? NO_PAGES,
        filter,
        get mapping(): SelectOptionMapping | undefined {
          return live.current.mapping;
        },
        pageSize: effectivePageSize,
        resource,
      }),
    [bemBlock, effectivePageSize, fetchPage, filter, id, name, resource, type],
  );
  const {hasMore, loading, onLoadMore, options, reset} = useInfiniteOptions({load, onError});

  const previousLoadRef = useRef<ResourceOptionsLoader | null>(null);

  // The first batch is requested when the picker renders. A different page function, filter or page size starts
  // the list again from the beginning.
  useEffect(() => {
    const previousLoad: ResourceOptionsLoader | null = previousLoadRef.current;

    previousLoadRef.current = load;

    if (previousLoad !== null && previousLoad !== load) {
      reset();
    }

    if (fetchPage) {
      onLoadMore();
    }
  }, [fetchPage, load, onLoadMore, reset]);

  // The first of these that is not empty names the select. An empty string is not a name, which is why this is not a
  // chain of `??`.
  const accessibleName: string =
    [ariaLabel, label, placeholder, t(`elements.fields.${messageKey}.aria_label`)].find((text) => Boolean(text)) ??
    fallbackMessages.ariaLabel;

  return (
    <Select
      {...rest}
      aria-label={accessibleName}
      className={cx(withVendorCSSClassPrefix(bem(bemBlock)), className)}
      emptyText={emptyText ?? (t(`elements.fields.${messageKey}.empty`) || fallbackMessages.empty)}
      id={id}
      label={label}
      loading={loading}
      name={name}
      onLoadMore={fetchPage && hasMore ? onLoadMore : undefined}
      options={options}
      placeholder={placeholder}
    />
  );
};

export default ResourceSelect;
