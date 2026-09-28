// Copyright 2024 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Theme} from '@thunderid/browser';
import {useMemo} from 'react';
import {css} from '../../../styles/emotion';

/**
 * Creates styles for the TextField component using BEM methodology
 * @param theme - The theme object containing design tokens
 * @param colorScheme - The current color scheme (used for memoization)
 * @param disabled - Whether the component is disabled
 * @param hasError - Whether the component has an error
 * @param hasStartIcon - Whether the component has a start icon
 * @param hasEndIcon - Whether the component has an end icon
 * @param hasEndAdornment - Whether the component has extra content before the end icon
 * @returns Object containing CSS class names for component styling
 */
const useStyles = (
  theme: Theme,
  colorScheme: string,
  disabled: boolean,
  hasError: boolean,
  hasStartIcon: boolean,
  hasEndIcon: boolean,
  hasEndAdornment = false,
): Record<string, string> =>
  useMemo(() => {
    const inlineStartPadding: string = hasStartIcon
      ? `calc(${theme.vars.spacing.unit} * 5)`
      : `calc(${theme.vars.spacing.unit} * 1.5)`;
    let inlineEndPadding = `calc(${theme.vars.spacing.unit} * 1.5)`;

    if (hasEndIcon && hasEndAdornment) {
      inlineEndPadding = `calc(${theme.vars.spacing.unit} * 8)`;
    } else if (hasEndIcon || hasEndAdornment) {
      inlineEndPadding = `calc(${theme.vars.spacing.unit} * 5)`;
    }

    const inputContainer: string = css`
      position: relative;
      display: flex;
      align-items: center;
    `;

    const input: string = css`
      width: 100%;
      padding-block: ${theme.vars.spacing.unit};
      padding-inline-start: ${inlineStartPadding};
      padding-inline-end: ${inlineEndPadding};
      border: 1px solid ${hasError ? theme.vars.colors.error.main : theme.vars.colors.border};
      border-radius: ${theme.vars.components?.Field?.root?.borderRadius || theme.vars.borderRadius.medium};
      font-size: ${theme.vars.typography.fontSizes.md};
      font-family: ${theme.vars.typography.fontFamily};
      color: ${theme.vars.colors.text.primary};
      background-color: ${disabled ? theme.vars.colors.background.disabled : theme.vars.colors.background.surface};
      outline: none;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;

      &:focus {
        border-color: ${hasError ? theme.vars.colors.error.main : theme.vars.colors.primary.main};
        box-shadow: 0 0 0 2px ${hasError ? `${theme.vars.colors.error.main}20` : `${theme.vars.colors.primary.main}20`};
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        border-color: ${hasError ? theme.vars.colors.error.main : theme.vars.colors.primary.main};
      }

      &::placeholder {
        color: ${theme.vars.colors.text.secondary};
        opacity: 0.7;
      }
    `;

    const inputError: string = css`
      border-color: ${theme.vars.colors.error.main};

      &:focus {
        border-color: ${theme.vars.colors.error.main};
        box-shadow: 0 0 0 2px ${theme.vars.colors.error.main}20;
      }

      &:hover:not(:disabled) {
        border-color: ${theme.vars.colors.error.main};
      }
    `;

    const inputDisabled: string = css`
      background-color: ${theme.vars.colors.background.disabled};
      opacity: 0.6;
      cursor: not-allowed;
    `;

    const icon: string = css`
      position: absolute;
      background: none;
      border: none;
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
      padding: calc(${theme.vars.spacing.unit} / 2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${theme.vars.colors.text.secondary};
      opacity: ${disabled ? 0.5 : 1};
      top: 50%;
      transform: translateY(-50%);
      transition:
        color 0.2s ease,
        opacity 0.2s ease;

      &:hover:not(:disabled) {
        color: ${theme.vars.colors.text.primary};
      }

      &:focus {
        outline: 2px solid ${theme.vars.colors.primary.main};
        outline-offset: 2px;
      }
    `;

    const startIcon: string = css`
      ${icon};
      inset-inline-start: ${theme.vars.spacing.unit};
    `;

    const endIcon: string = css`
      ${icon};
      inset-inline-end: calc(${theme.vars.spacing.unit} * ${hasEndAdornment ? 4.5 : 1});
    `;

    const endAdornment: string = css`
      position: absolute;
      display: flex;
      align-items: center;
      top: 50%;
      transform: translateY(-50%);
      inset-inline-end: ${theme.vars.spacing.unit};
    `;

    return {
      endAdornment,
      endIcon,
      icon,
      input,
      inputContainer,
      inputDisabled,
      inputError,
      startIcon,
    };
  }, [theme, colorScheme, disabled, hasError, hasStartIcon, hasEndIcon, hasEndAdornment]);

export default useStyles;
