// Copyright 2024 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix, bem} from '@thunderid/browser';
import {FC, InputHTMLAttributes, useId} from 'react';
import useStyles from './DatePicker.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import {cx} from '../../../styles/emotion';
import FormControl from '../FormControl/FormControl';
import InputLabel from '../InputLabel/InputLabel';

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Custom date format for the regex pattern
   */
  dateFormat?: string;
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
  /**
   * Error message to display below the input
   */
  error?: string;
  /**
   * Helper text to display below the input
   */
  helperText?: string;
  /**
   * Label text to display above the input
   */
  label?: string;
  /**
   * Whether the field is required
   */
  required?: boolean;
}

const DatePicker: FC<DatePickerProps> = ({
  label,
  error,
  className,
  required,
  disabled,
  helperText,
  dateFormat = 'yyyy-MM-dd',
  style = {},
  ...rest
}: DatePickerProps) => {
  const {theme, colorScheme}: ReturnType<typeof useTheme> = useTheme();
  const hasError = !!error;
  const generatedId: string = useId();
  const inputId: string = rest.id ?? generatedId;
  const helperTextId: string | undefined = error || helperText ? `${inputId}-helper-text` : undefined;
  const describedBy: string | undefined =
    [rest['aria-describedby'], helperTextId].filter(Boolean).join(' ') || undefined;
  const styles: Record<string, string> = useStyles(theme, colorScheme, hasError, !!disabled);

  return (
    <FormControl
      error={error}
      helperText={helperText}
      helperTextId={helperTextId}
      className={cx(withVendorCSSClassPrefix(bem('date-picker')), className)}
      style={style}
    >
      {label && (
        <InputLabel
          htmlFor={inputId}
          required={required}
          error={hasError}
          className={cx(withVendorCSSClassPrefix(bem('date-picker', 'label')), styles['label'])}
        >
          {label}
        </InputLabel>
      )}
      <input
        type="date"
        pattern="\d{4}-\d{2}-\d{2}"
        placeholder={dateFormat}
        className={cx(
          withVendorCSSClassPrefix(bem('date-picker', 'input')),
          styles['input'],
          styles['errorInput'],
          styles['disabledInput'],
          {
            [withVendorCSSClassPrefix(bem('date-picker', 'input', 'error'))]: hasError,
            [withVendorCSSClassPrefix(bem('date-picker', 'input', 'disabled'))]: disabled,
          },
        )}
        disabled={disabled}
        aria-invalid={hasError}
        aria-required={required}
        {...rest}
        id={inputId}
        aria-describedby={describedBy}
      />
    </FormControl>
  );
};

export default DatePicker;
