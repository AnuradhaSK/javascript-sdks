// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {bem, withVendorCSSClassPrefix} from '@thunderid/browser';
import {CSSProperties, FC, ReactNode} from 'react';
import useStyles from './FormControl.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import {cx} from '../../../styles/emotion';
import Typography from '../Typography/Typography';

export type FormControlHelperTextAlign = 'left' | 'center';

export interface FormControlProps {
  /**
   * The content to be wrapped by the form control
   */
  children: ReactNode;
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Error message to display below the content
   */
  error?: string;
  /**
   * Helper text to display below the content
   */
  helperText?: string;
  /**
   * id of the helper text element, so the field it describes can reference it with `aria-describedby`
   */
  helperTextId?: string;
  /**
   * Custom alignment for helper text (default: left, center for OTP)
   */
  helperTextAlign?: FormControlHelperTextAlign;
  /**
   * Custom margin left for helper text (for components like Checkbox)
   */
  helperTextMarginLeft?: string;
  /**
   * HTML id attribute
   */
  id?: string;
  /**
   * Custom container style
   */
  style?: CSSProperties;
}

const FormControl: FC<FormControlProps> = ({
  children,
  error,
  helperText,
  helperTextId,
  className,
  id,
  helperTextAlign = 'left',
  helperTextMarginLeft,
}: FormControlProps) => {
  const {theme, colorScheme}: ReturnType<typeof useTheme> = useTheme();
  const styles: Record<string, string> = useStyles(theme, colorScheme, helperTextAlign, helperTextMarginLeft, !!error);

  return (
    <div id={id} className={cx(withVendorCSSClassPrefix(bem('form-control')), styles['formControl'], className)}>
      {children}
      {(error || helperText) && (
        <Typography
          id={helperTextId}
          variant="caption"
          color={error ? 'error' : 'textSecondary'}
          className={cx(withVendorCSSClassPrefix(bem('form-control', 'helper-text')), styles['helperText'], {
            [withVendorCSSClassPrefix(bem('form-control', 'helper-text', 'error'))]: !!error,
            [styles['helperTextError']]: !!error,
          })}
        >
          {error || helperText}
        </Typography>
      )}
    </div>
  );
};

export default FormControl;
