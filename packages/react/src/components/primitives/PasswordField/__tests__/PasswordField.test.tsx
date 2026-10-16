// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {ReactElement} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import PasswordField, {PasswordFieldProps} from '../PasswordField';

const withProviders = (ui: ReactElement): ReactElement => <ThemeProvider>{ui}</ThemeProvider>;

const renderField = (props: Partial<PasswordFieldProps> = {}) =>
  render(withProviders(<PasswordField aria-label="Password" onChange={vi.fn()} value="hunter2" {...props} />));

const input = (): HTMLInputElement => screen.getByLabelText<HTMLInputElement>('Password');

describe('PasswordField', () => {
  afterEach(cleanup);

  describe('show and hide', () => {
    it('starts with the value hidden', () => {
      renderField();

      expect(input()).toHaveAttribute('type', 'password');
    });

    it('shows the value on Show and hides it again on Hide', () => {
      renderField();

      fireEvent.click(screen.getByRole('button', {name: 'Show password'}));
      expect(input()).toHaveAttribute('type', 'text');

      fireEvent.click(screen.getByRole('button', {name: 'Hide password'}));
      expect(input()).toHaveAttribute('type', 'password');
    });

    it('names the button after what it does next, in the wording it is given', () => {
      renderField({hideLabel: 'Hide', showLabel: 'Show'});

      expect(screen.getByRole('button', {name: 'Show'})).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', {name: 'Show'}));

      expect(screen.getByRole('button', {name: 'Hide'})).toBeInTheDocument();
    });

    it('does not use a generic name for the button', () => {
      renderField();

      expect(screen.queryByRole('button', {name: 'End icon'})).toBeNull();
    });

    it('can be operated from the keyboard', () => {
      renderField();

      fireEvent.keyDown(screen.getByRole('button', {name: 'Show password'}), {key: 'Enter'});
      expect(input()).toHaveAttribute('type', 'text');

      fireEvent.keyDown(screen.getByRole('button', {name: 'Hide password'}), {key: ' '});
      expect(input()).toHaveAttribute('type', 'password');
    });

    it('can be reached with the Tab key', () => {
      renderField();

      expect(screen.getByRole('button', {name: 'Show password'})).toHaveAttribute('tabindex', '0');
    });

    it('does not toggle while disabled', () => {
      renderField({disabled: true});

      fireEvent.click(screen.getByRole('button', {name: 'Show password'}));

      expect(input()).toHaveAttribute('type', 'password');
    });
  });

  describe('value', () => {
    it('reports what is typed as a string', () => {
      const onChange = vi.fn();
      renderField({onChange});

      fireEvent.change(input(), {target: {value: 'hunter3'}});

      expect(onChange).toHaveBeenCalledWith('hunter3');
    });

    it('asks the browser to offer the current password unless told otherwise', () => {
      renderField();

      expect(input()).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  describe('read only', () => {
    it('keeps the value from being edited and still shows and hides it', () => {
      renderField({readOnly: true});

      expect(input()).toHaveAttribute('readonly');

      fireEvent.click(screen.getByRole('button', {name: 'Show password'}));

      expect(input()).toHaveAttribute('type', 'text');
    });
  });
});
