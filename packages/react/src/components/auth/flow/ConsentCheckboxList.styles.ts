// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Theme} from '@thunderid/browser';
import {useMemo} from 'react';
import {css} from '../../../styles/emotion';

const useStyles = (theme: Theme, colorScheme: string): Record<string, string> =>
  useMemo(
    () => ({
      bullet: css`
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: #9e9e9e;
        flex-shrink: 0;
      `,
      divider: css`
        opacity: 0.5;
        margin: 0.25rem 0;
      `,
      labelContainer: css`
        display: flex;
        align-items: center;
        gap: 0.4rem;
      `,
      listContainer: css`
        display: flex;
        flex-direction: column;
      `,
      listItem: css`
        padding: 0 0.25rem;
        margin-bottom: 4px;
      `,
      listRow: css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.125rem 0;
      `,
      typography: css`
        margin: 0;
      `,
    }),
    [theme, colorScheme],
  );

export default useStyles;
