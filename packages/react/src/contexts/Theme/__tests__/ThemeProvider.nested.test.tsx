// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, render, screen} from '@testing-library/react';
import {ReactElement} from 'react';
import {afterEach, describe, expect, it} from 'vitest';
import ThemeProvider from '../ThemeProvider';
import useTheme from '../useTheme';

const primary = (): string => document.documentElement.style.getPropertyValue('--thunderid-color-primary-main').trim();

const Outer = ({inner, main}: {inner: boolean; main: string}): ReactElement => (
  <ThemeProvider mode="light" theme={{colors: {primary: {main}}}}>
    {inner && (
      <ThemeProvider mode="light" theme={{colors: {primary: {main: '#ef4444'}}}}>
        <div />
      </ThemeProvider>
    )}
  </ThemeProvider>
);

const Scheme = (): ReactElement => <span data-testid="scheme">{useTheme().colorScheme}</span>;

describe('ThemeProvider', () => {
  afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('style');
  });

  it('keeps the nested theme on the document root when the outer theme changes', () => {
    const {rerender} = render(<Outer inner main="#ff7300" />);

    expect(primary()).toBe('#ef4444');

    rerender(<Outer inner main="#0055ff" />);

    expect(primary()).toBe('#ef4444');
  });

  it('writes the outer theme again when the nested one unmounts', () => {
    const {rerender} = render(<Outer inner main="#ff7300" />);

    rerender(<Outer inner={false} main="#ff7300" />);

    expect(primary()).toBe('#ff7300');
  });

  it('follows a change of mode after mount', () => {
    const {rerender} = render(
      <ThemeProvider mode="light">
        <Scheme />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('scheme')).toHaveTextContent('light');

    rerender(
      <ThemeProvider mode="dark">
        <Scheme />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('scheme')).toHaveTextContent('dark');
  });
});
