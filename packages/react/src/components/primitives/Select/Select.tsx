// Copyright 2024 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {bem, normalizeSelectOptions, SelectConstants, withVendorCSSClassPrefix} from '@thunderid/browser';
import type {SelectOption, SelectOptionInput} from '@thunderid/browser';
import {ChangeEvent, FC, RefObject, SelectHTMLAttributes, useEffect, useId, useMemo, useRef} from 'react';
import useStyles from './Select.styles';
import useSelectMessages, {SelectMessages} from './useSelectMessages';
import useTheme from '../../../contexts/Theme/useTheme';
import {cx} from '../../../styles/emotion';
import FormControl from '../FormControl/FormControl';
import InputLabel from '../InputLabel/InputLabel';

export type {SelectOption, SelectOptionInput};

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
  /**
   * Text shown below the select when it has no options, nothing is loading and there is nothing more to load
   */
  emptyText?: string;
  /**
   * Error message to display below the select
   */
  error?: string;
  /**
   * Helper text to display below the select
   */
  helperText?: string;
  /**
   * Label text to display above the select
   */
  label?: string;
  /**
   * Whether options are being fetched. The load more option waits, and a select with no options shows a loading message
   */
  loading?: boolean;
  /**
   * Called when the load more option, listed after the last one, is chosen. Choosing it does not change the selection.
   * The option is listed only when this is set, so pass it only while more options may be available
   */
  onLoadMore?: () => void;
  /**
   * The options to display: strings, numbers, or `{label, value, disabled?}` objects
   */
  options?: readonly (SelectOptionInput | null | undefined)[] | null;
  /**
   * Placeholder text for the default/empty option. While the field is not required, choosing it clears the selection
   */
  placeholder?: string;
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Label of the selected option while `value` is not among `options`, such as a value loaded from saved data
   */
  selectedOption?: SelectOption;
}

const Select: FC<SelectProps> = ({
  label,
  error,
  className,
  required,
  disabled,
  helperText,
  placeholder,
  options = undefined,
  emptyText = undefined,
  loading = false,
  onLoadMore = undefined,
  onChange = undefined,
  selectedOption = undefined,
  style = {},
  ...rest
}: SelectProps) => {
  const {theme, colorScheme}: ReturnType<typeof useTheme> = useTheme();
  const messages: SelectMessages = useSelectMessages();
  const hasError = !!error;
  const generatedId: string = useId();
  const inputId: string = rest.id ?? generatedId;
  const helperTextId: string | undefined = error || helperText ? `${inputId}-helper-text` : undefined;
  const describedBy: string | undefined =
    [rest['aria-describedby'], helperTextId].filter(Boolean).join(' ') || undefined;
  const styles: Record<string, string> = useStyles(theme, colorScheme, disabled ?? false, hasError);
  const items: SelectOption[] = useMemo(() => normalizeSelectOptions(options), [options]);
  const selectRef: RefObject<HTMLSelectElement | null> = useRef<HTMLSelectElement>(null);
  const chosenValueRef: RefObject<string> = useRef<string>('');

  // The value to put back when the load more option is chosen, since choosing it is not a selection.
  useEffect(() => {
    const current: string | undefined = selectRef.current?.value;

    if (current !== undefined && current !== SelectConstants.LOAD_MORE_OPTION_VALUE) {
      chosenValueRef.current = current;
    }
  });

  const handleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    if (event.target.value !== SelectConstants.LOAD_MORE_OPTION_VALUE) {
      chosenValueRef.current = event.target.value;
      onChange?.(event);

      return;
    }

    event.target.value = chosenValueRef.current;
    onLoadMore?.();
  };

  const selectClassName: string = cx(
    withVendorCSSClassPrefix(bem('select', 'input')),
    styles['select'],
    hasError && styles['selectError'],
    disabled && styles['selectDisabled'],
  );

  const showsSelectedOption: boolean =
    selectedOption !== undefined &&
    rest.value !== undefined &&
    String(rest.value) === selectedOption.value &&
    !items.some((item: SelectOption) => item.value === selectedOption.value);

  let statusText: string | undefined;

  if (loading) {
    statusText = items.length === 0 ? messages.loading : messages.loadingMore;
  } else if (items.length === 0 && !onLoadMore) {
    statusText = emptyText;
  }

  const hasStatus: boolean = onLoadMore !== undefined || emptyText !== undefined || loading;
  const showsLoadMore: boolean = onLoadMore !== undefined && (items.length > 0 || !loading);

  return (
    <FormControl
      error={error}
      helperText={helperText}
      helperTextId={helperTextId}
      className={cx(withVendorCSSClassPrefix(bem('select')), className)}
      style={style}
    >
      {label && (
        <InputLabel htmlFor={inputId} required={required} error={hasError}>
          {label}
        </InputLabel>
      )}
      <select
        className={selectClassName}
        disabled={disabled}
        aria-invalid={hasError}
        aria-required={required}
        aria-busy={loading || undefined}
        {...rest}
        id={inputId}
        aria-describedby={describedBy}
        ref={selectRef}
        onChange={onLoadMore ? handleChange : onChange}
      >
        {placeholder && (
          <option value="" disabled={Boolean(required)}>
            {placeholder}
          </option>
        )}
        {showsSelectedOption && <option value={selectedOption?.value}>{selectedOption?.label}</option>}
        {items.map((option: SelectOption) => (
          <option key={option.value} value={option.value} disabled={option.disabled} className={styles['option']}>
            {option.label}
          </option>
        ))}
        {showsLoadMore && (
          <option
            value={SelectConstants.LOAD_MORE_OPTION_VALUE}
            disabled={loading}
            className={cx(withVendorCSSClassPrefix(bem('select', 'load-more')), styles['option'], styles['loadMore'])}
          >
            {loading ? messages.loadingMore : messages.loadMore}
          </option>
        )}
      </select>
      {hasStatus && (
        <span role="status" className={styles['status']}>
          {statusText}
        </span>
      )}
    </FormControl>
  );
};

export default Select;
