// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix, bem} from '@thunderid/browser';
import {FC, InputHTMLAttributes, useId} from 'react';
import useStyles from './Toggle.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import {cx} from '../../../styles/emotion';
import FormControl from '../FormControl/FormControl';
import InputLabel from '../InputLabel/InputLabel';

/**
 * Props for the Toggle component.
 */
export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  className?: string;
  error?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
}

/**
 * A Toggle component that represents a boolean input. It is built on top of a hidden checkbox input
 * and styled to look like a switch.
 *
 * The component is wrapped in a FormControl to display error messages and helper text.
 * The label is associated with the input for accessibility.
 *
 * @param props - Props for the Toggle component
 * @returns A JSX element representing the Toggle
 */
const Toggle: FC<ToggleProps> = ({label, error, className, required, helperText, style = {}, ...rest}: ToggleProps) => {
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
      className={cx(withVendorCSSClassPrefix(bem('toggle')), className)}
      helperTextMarginLeft={`calc(${theme.vars.spacing.unit} * 5.5)`}
    >
      <label style={style} className={cx(withVendorCSSClassPrefix(bem('toggle', 'container')), styles['container'])}>
        <input
          type="checkbox"
          role="switch"
          className={cx(withVendorCSSClassPrefix(bem('toggle', 'input')), styles['input'])}
          aria-invalid={hasError}
          aria-required={required}
          {...rest}
          id={inputId}
          aria-describedby={describedBy}
        />
        <div className={cx(withVendorCSSClassPrefix(bem('toggle', 'track')), styles['track'])}>
          <span className={cx(withVendorCSSClassPrefix(bem('toggle', 'thumb')), styles['thumb'])} />
        </div>
        {label && (
          <InputLabel
            required={required}
            error={hasError}
            variant="inline"
            className={cx(withVendorCSSClassPrefix(bem('toggle', 'label')), styles['label'], styles['errorLabel'], {
              [withVendorCSSClassPrefix(bem('toggle', 'label', 'error'))]: hasError,
            })}
          >
            {label}
          </InputLabel>
        )}
      </label>
    </FormControl>
  );
};

export default Toggle;
