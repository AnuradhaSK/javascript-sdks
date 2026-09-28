// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Theme} from '@thunderid/browser';
import {useMemo} from 'react';
import {css} from '../../../styles/emotion';

const useStyles = (theme: Theme): Record<string, string> =>
  useMemo(
    () => ({
      container: css`
        display: flex;
        flex-direction: column;
        gap: calc(${theme.vars.spacing.unit} * 0.5);
        width: 100%;
      `,
      copyButton: css`
        color: ${theme.vars.colors.text.secondary};

        &:hover:not(:disabled) {
          color: ${theme.vars.colors.text.primary};
        }
      `,
      label: css`
        color: ${theme.vars.colors.text.secondary};
        font-size: 0.875rem;
        font-weight: 500;
      `,
      valueBox: css`
        align-items: center;
        background-color: ${theme.vars.colors.background.surface};
        border: 1px solid ${theme.vars.colors.border};
        border-radius: ${theme.vars.borderRadius.small};
        display: flex;
        gap: calc(${theme.vars.spacing.unit} * 1);
        padding: calc(${theme.vars.spacing.unit} * 0.75) calc(${theme.vars.spacing.unit} * 1);
      `,
      valueText: css`
        color: ${theme.vars.colors.text.primary};
        flex: 1;
        font-family: monospace;
        font-size: 0.85rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        word-break: break-all;
      `,
    }),
    [theme],
  );

export default useStyles;
