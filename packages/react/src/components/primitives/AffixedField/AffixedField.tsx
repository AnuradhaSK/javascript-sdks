// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {PrefixOption, bem, withVendorCSSClassPrefix} from '@thunderid/browser';
import {ChangeEvent, FC, InputHTMLAttributes, ReactElement, useId} from 'react';
import useStyles from './AffixedField.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import {cx} from '../../../styles/emotion';
import FormControl from '../FormControl/FormControl';
import InputLabel from '../InputLabel/InputLabel';

export interface AffixedFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'prefix'> {
  /** Additional CSS class names applied to the outer form control. */
  className?: string;
  /** Whether the field is disabled. */
  disabled?: boolean;
  /** Error message to render below the field. */
  error?: string;
  /** Helper text to render below the field. */
  helperText?: string;
  /** Label rendered above the field. */
  label?: string;
  /**
   * Called when the user changes the selected prefix. Only fires when `prefixes` is an
   * array with two or more entries and the user picks a different one.
   */
  onPrefixChange?: (prefixValue: string) => void;
  /**
   * Currently selected prefix `value` (must match one of the resolved prefix entries'
   * `value`). Required when `prefixes` resolves to a non-empty list. Ignored otherwise.
   */
  prefixValue?: string;
  /**
   * Leading affix. `string` renders as a fixed span; `PrefixOption[]` renders as a fixed
   * span (single entry) or dropdown (multiple entries). Empty or undefined renders a
   * plain input with no leading element.
   */
  prefixes?: string | PrefixOption[];
  /** Whether the field is required. */
  required?: boolean;
}

/**
 * Converts the polymorphic `prefixes` prop into a uniform list. A string is treated
 * as a single fixed entry so the rest of the component can iterate a single shape.
 */
const normalizePrefixes = (prefixes: string | PrefixOption[] | undefined): PrefixOption[] => {
  if (typeof prefixes === 'string') {
    return prefixes.length > 0 ? [{label: prefixes, value: prefixes}] : [];
  }
  return prefixes ?? [];
};

const AffixedField: FC<AffixedFieldProps> = ({
  label,
  error,
  required,
  className,
  disabled,
  helperText,
  prefixes,
  prefixValue,
  onPrefixChange,
  type = 'text',
  style = {},
  ...rest
}: AffixedFieldProps) => {
  const {theme, colorScheme}: ReturnType<typeof useTheme> = useTheme();
  const hasError: boolean = !!error;
  const prefixList: PrefixOption[] = normalizePrefixes(prefixes);
  const hasPrefix: boolean = prefixList.length > 0;
  const hasFixedPrefix: boolean = prefixList.length === 1;
  const styles: Record<string, string> = useStyles(theme, colorScheme, disabled ?? false, hasError, hasPrefix);
  // Stable id for the visually-hidden prefix announcement; only referenced when a
  // fixed prefix is present, but generated unconditionally so the hook order is stable.
  const prefixDescriptionId: string = `${useId()}-prefix`;
  const generatedId: string = useId();
  const inputId: string = rest.id ?? generatedId;
  const helperTextId: string | undefined = error || helperText ? `${inputId}-helper-text` : undefined;

  const containerClassName: string = cx(
    withVendorCSSClassPrefix(bem('affixed-field', 'container')),
    styles['inputContainer'],
  );

  const inputClassName: string = cx(withVendorCSSClassPrefix(bem('affixed-field', 'input')), styles['input']);

  const renderPrefix = (): ReactElement | null => {
    if (prefixList.length === 0) return null;

    if (prefixList.length === 1) {
      return (
        <>
          <span
            className={cx(withVendorCSSClassPrefix(bem('affixed-field', 'prefix-span')), styles['prefixSpan'])}
            aria-hidden="true"
          >
            {prefixList[0].label}
          </span>
          {/* Assistive-tech-only mirror of the fixed prefix; wired to the input via aria-describedby. */}
          <span id={prefixDescriptionId} className={styles['visuallyHidden']}>
            {prefixList[0].label}
          </span>
        </>
      );
    }

    const selectedValue: string = prefixValue ?? prefixList[0].value;
    return (
      <select
        className={cx(withVendorCSSClassPrefix(bem('affixed-field', 'prefix-select')), styles['prefixSelect'])}
        value={selectedValue}
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLSelectElement>): void => onPrefixChange?.(e.target.value)}
        aria-label="Prefix"
      >
        {prefixList.map((p: PrefixOption) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    );
  };

  return (
    <FormControl
      error={error}
      helperText={helperText}
      helperTextId={helperTextId}
      className={cx(withVendorCSSClassPrefix(bem('affixed-field')), className)}
      style={style}
    >
      {label && (
        <InputLabel htmlFor={inputId} required={required} error={hasError}>
          {label}
        </InputLabel>
      )}
      <div className={containerClassName}>
        {renderPrefix()}
        <input
          className={inputClassName}
          type={type}
          disabled={disabled}
          aria-invalid={hasError}
          aria-required={required}
          {...rest}
          id={inputId}
          aria-describedby={
            [rest['aria-describedby'], hasFixedPrefix ? prefixDescriptionId : undefined, helperTextId]
              .filter(Boolean)
              .join(' ') || undefined
          }
        />
      </div>
    </FormControl>
  );
};

export default AffixedField;
