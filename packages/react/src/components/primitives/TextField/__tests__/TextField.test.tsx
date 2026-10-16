// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {ReactElement} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import TextField from '../TextField';

const withProviders = (ui: ReactElement): ReactElement => <ThemeProvider>{ui}</ThemeProvider>;

describe('TextField end icon', () => {
  afterEach(cleanup);

  it('is a button named "End icon" when it can be clicked', () => {
    render(withProviders(<TextField endIcon={<svg />} onEndIconClick={vi.fn()} />));

    expect(screen.getByRole('button', {name: 'End icon'})).toBeInTheDocument();
  });

  it('takes the name it is given', () => {
    render(withProviders(<TextField endIcon={<svg />} endIconLabel="Clear" onEndIconClick={vi.fn()} />));

    expect(screen.getByRole('button', {name: 'Clear'})).toBeInTheDocument();
  });

  it('is not a button without a click handler', () => {
    render(withProviders(<TextField endIcon={<svg />} />));

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('responds to Enter and Space as well as to a click', () => {
    const onEndIconClick = vi.fn();
    render(withProviders(<TextField endIcon={<svg />} onEndIconClick={onEndIconClick} />));
    const button: HTMLElement = screen.getByRole('button', {name: 'End icon'});

    fireEvent.click(button);
    fireEvent.keyDown(button, {key: 'Enter'});
    fireEvent.keyDown(button, {key: ' '});

    expect(onEndIconClick).toHaveBeenCalledTimes(3);
  });

  it('ignores other keys', () => {
    const onEndIconClick = vi.fn();
    render(withProviders(<TextField endIcon={<svg />} onEndIconClick={onEndIconClick} />));

    fireEvent.keyDown(screen.getByRole('button', {name: 'End icon'}), {key: 'a'});

    expect(onEndIconClick).not.toHaveBeenCalled();
  });

  it('does not respond to the keyboard while disabled', () => {
    const onEndIconClick = vi.fn();
    render(withProviders(<TextField disabled endIcon={<svg />} onEndIconClick={onEndIconClick} />));

    fireEvent.keyDown(screen.getByRole('button', {name: 'End icon'}), {key: 'Enter'});

    expect(onEndIconClick).not.toHaveBeenCalled();
  });

  it('lets the start icon be operated from the keyboard too', () => {
    const onStartIconClick = vi.fn();
    render(withProviders(<TextField startIcon={<svg />} onStartIconClick={onStartIconClick} />));

    fireEvent.keyDown(screen.getByRole('button', {name: 'Start icon'}), {key: 'Enter'});

    expect(onStartIconClick).toHaveBeenCalledTimes(1);
  });
});

describe('TextField end adornment', () => {
  afterEach(cleanup);

  it('shows the extra content inside the field', () => {
    render(withProviders(<TextField endAdornment={<button type="button">Copy</button>} />));

    const adornment: HTMLElement = screen.getByRole('button', {name: 'Copy'});

    expect(adornment.closest('[class*="text-field__container"]')).toBe(
      screen.getByRole('textbox').closest('[class*="text-field__container"]'),
    );
  });

  it('shows it together with an end icon', () => {
    render(
      withProviders(
        <TextField endAdornment={<button type="button">Copy</button>} endIcon={<svg />} onEndIconClick={vi.fn()} />,
      ),
    );

    expect(screen.getByRole('button', {name: 'Copy'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'End icon'})).toBeInTheDocument();
  });

  it('adds nothing without it', () => {
    const {container} = render(withProviders(<TextField />));

    expect(container.querySelector('[class*="end-adornment"]')).toBeNull();
  });
});
