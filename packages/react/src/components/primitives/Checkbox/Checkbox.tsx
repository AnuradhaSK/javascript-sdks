// Copyright 2024 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix, bem} from '@thunderid/browser';
import {FC, InputHTMLAttributes, useId} from 'react';
import useStyles from './Checkbox.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import {cx} from '../../../styles/emotion';
import FormControl from '../FormControl/FormControl';
import InputLabel from '../InputLabel/InputLabel';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Error message to display below the checkbox
   */
  error?: string;
  /**
   * Helper text to display below the checkbox
   */
  helperText?: string;
  /**
   * Label text to display next to the checkbox
   */
  label?: string;
  /**
   * Whether the field is required
   */
  required?: boolean;
}

const Checkbox: FC<CheckboxProps> = ({
  label,
  error,
  className,
  required,
  helperText,
  style = {},
  ...rest
}: CheckboxProps) => {
  const {theme, colorScheme}: ReturnType<typeof useTheme> = useTheme();
  const hasError = !!error;
  const generatedId: string = useId();
  const inputId: string = rest.id ?? generatedId;
  const helperTextId: string | undefined = error || helperText ? `${inputId}-helper-text` : undefined;
  const describedBy: string | undefined =
    [rest['aria-describedby'], helperTextId].filter(Boolean).join(' ') || undefined;
  const styles: Record<string, string> = useStyles(theme, colorScheme, hasError, !!required);

  return (
    <FormControl
      error={error}
      helperText={helperText}
      helperTextId={helperTextId}
      className={cx(withVendorCSSClassPrefix(bem('checkbox')), className)}
      helperTextMarginLeft={`calc(${theme.vars.spacing.unit} * 3.5)`}
    >
      <div style={style} className={cx(withVendorCSSClassPrefix(bem('checkbox', 'container')), styles['container'])}>
        <input
          type="checkbox"
          className={cx(withVendorCSSClassPrefix(bem('checkbox', 'input')), styles['input'], styles['errorInput'], {
            [withVendorCSSClassPrefix(bem('checkbox', 'input', 'error'))]: hasError,
          })}
          aria-invalid={hasError}
          aria-required={required}
          {...rest}
          id={inputId}
          aria-describedby={describedBy}
        />
        {label && (
          <InputLabel
            htmlFor={inputId}
            required={required}
            error={hasError}
            variant="inline"
            className={cx(withVendorCSSClassPrefix(bem('checkbox', 'label')), styles['label'], styles['errorLabel'], {
              [withVendorCSSClassPrefix(bem('checkbox', 'label', 'error'))]: hasError,
            })}
          >
            {label}
          </InputLabel>
        )}
      </div>
    </FormControl>
  );
};

export default Checkbox;
