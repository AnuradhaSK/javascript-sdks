// Copyright 2024 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix, bem} from '@thunderid/browser';
import {FC, InputHTMLAttributes, KeyboardEvent, ReactNode} from 'react';
import useStyles from './TextField.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import {cx} from '../../../styles/emotion';
import FormControl from '../FormControl/FormControl';
import InputLabel from '../InputLabel/InputLabel';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
  /**
   * Extra content shown inside the field, at its end after the end icon, such as an action button
   */
  endAdornment?: ReactNode;
  /**
   * Icon to display at the end (right) of the input
   */
  endIcon?: ReactNode;
  /**
   * Accessible name of the end icon when it is a button, that is when `onEndIconClick` is set
   */
  endIconLabel?: string;
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
   * Click handler for the end icon
   */
  onEndIconClick?: () => void;
  /**
   * Click handler for the start icon
   */
  onStartIconClick?: () => void;
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Icon to display at the start (left) of the input
   */
  startIcon?: ReactNode;
}

/**
 * Makes an element with `role="button"` respond to Enter and Space, as a native button does.
 */
const activateOnKey =
  (activate: () => void) =>
  (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  };

const TextField: FC<TextFieldProps> = ({
  label,
  error,
  required,
  className,
  disabled,
  helperText,
  startIcon,
  endAdornment,
  endIcon,
  endIconLabel = 'End icon',
  onStartIconClick,
  onEndIconClick,
  type = 'text',
  style = {},
  ...rest
}: TextFieldProps) => {
  const {theme, colorScheme}: ReturnType<typeof useTheme> = useTheme();
  const hasError = !!error;
  const hasStartIcon = !!startIcon;
  const hasEndIcon = !!endIcon;
  const hasEndAdornment = !!endAdornment;
  const styles: Record<string, string> = useStyles(
    theme,
    colorScheme,
    disabled ?? false,
    hasError,
    hasStartIcon,
    hasEndIcon,
    hasEndAdornment,
  );

  const inputClassName: string = cx(
    withVendorCSSClassPrefix(bem('text-field', 'input')),
    styles['input'],
    hasError && styles['inputError'],
    disabled && styles['inputDisabled'],
  );

  const containerClassName: string = cx(
    withVendorCSSClassPrefix(bem('text-field', 'container')),
    styles['inputContainer'],
  );

  const startIconClassName: string = cx(withVendorCSSClassPrefix(bem('text-field', 'start-icon')), styles['startIcon']);

  const endIconClassName: string = cx(withVendorCSSClassPrefix(bem('text-field', 'end-icon')), styles['endIcon']);

  const endAdornmentClassName: string = cx(
    withVendorCSSClassPrefix(bem('text-field', 'end-adornment')),
    styles['endAdornment'],
  );

  return (
    <FormControl
      error={error}
      helperText={helperText}
      className={cx(withVendorCSSClassPrefix(bem('text-field')), className)}
      style={style}
    >
      {label && (
        <InputLabel required={required} error={hasError}>
          {label}
        </InputLabel>
      )}
      <div className={containerClassName}>
        {startIcon && (
          <div
            className={startIconClassName}
            onClick={onStartIconClick}
            role={onStartIconClick ? 'button' : undefined}
            tabIndex={onStartIconClick && !disabled ? 0 : undefined}
            onKeyDown={onStartIconClick && !disabled ? activateOnKey(onStartIconClick) : undefined}
            aria-label="Start icon"
          >
            {startIcon}
          </div>
        )}
        <input
          className={inputClassName}
          type={type}
          disabled={disabled}
          aria-invalid={hasError}
          aria-required={required}
          {...rest}
        />
        {endIcon && (
          <div
            className={endIconClassName}
            onClick={onEndIconClick}
            role={onEndIconClick ? 'button' : undefined}
            tabIndex={onEndIconClick && !disabled ? 0 : undefined}
            onKeyDown={onEndIconClick && !disabled ? activateOnKey(onEndIconClick) : undefined}
            aria-label={endIconLabel}
          >
            {endIcon}
          </div>
        )}
        {endAdornment && <div className={endAdornmentClassName}>{endAdornment}</div>}
      </div>
    </FormControl>
  );
};

export default TextField;
