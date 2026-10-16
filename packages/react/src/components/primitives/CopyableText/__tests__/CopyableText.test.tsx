// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {ReactElement} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import I18nProvider from '../../../../contexts/I18n/I18nProvider';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import CopyableText from '../CopyableText';

const SECRET = 'sup3r-s3cret-value';

const withProviders = (ui: ReactElement): ReactElement => (
  <I18nProvider>
    <ThemeProvider>{ui}</ThemeProvider>
  </I18nProvider>
);

describe('CopyableText', () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText}});
  });

  afterEach(cleanup);

  describe('without masking', () => {
    it('shows the value and the label, and has no Show or Hide button', () => {
      render(withProviders(<CopyableText label="Client ID" value="abc123" />));

      expect(screen.getByText('Client ID')).toBeInTheDocument();
      expect(screen.getByText('abc123')).toBeInTheDocument();
      expect(screen.queryByRole('button', {name: /show|hide/i})).not.toBeInTheDocument();
    });

    it('copies the value', async () => {
      render(withProviders(<CopyableText value="abc123" />));

      fireEvent.click(screen.getByRole('button', {name: 'Copy'}));

      await waitFor(() => expect(writeText).toHaveBeenCalledWith('abc123'));
      expect(await screen.findByRole('button', {name: 'Copied!'})).toBeInTheDocument();
    });
  });

  describe('copy control', () => {
    it('is an icon button with no visible text, named Copy', () => {
      render(withProviders(<CopyableText value="abc123" />));

      const copy: HTMLElement = screen.getByRole('button', {name: 'Copy'});

      expect(copy).toHaveTextContent('');
      expect(copy.querySelector('svg')).not.toBeNull();
    });

    it('sits inside the box that holds the value', () => {
      render(withProviders(<CopyableText value="abc123" />));

      expect(screen.getByRole('button', {name: 'Copy'}).parentElement).toBe(screen.getByText('abc123').parentElement);
    });

    it('sits inside the password field when the value is masked', () => {
      render(withProviders(<CopyableText label="Client secret" masked value={SECRET} />));
      const field: HTMLElement = screen.getByLabelText('Client secret');

      expect(field.parentElement?.contains(screen.getByRole('button', {name: 'Copy'}))).toBe(true);
    });

    it('uses the same icon whether or not the value is masked', () => {
      const {unmount} = render(withProviders(<CopyableText value="abc123" />));
      const plainIcon: string = screen.getByRole('button', {name: 'Copy'}).querySelector('svg')?.innerHTML ?? '';
      unmount();

      render(withProviders(<CopyableText masked value="abc123" />));

      expect(plainIcon).not.toBe('');
      expect(screen.getByRole('button', {name: 'Copy'}).querySelector('svg')?.innerHTML).toBe(plainIcon);
    });

    it('swaps to a check mark after copying, and is named Copied!', async () => {
      render(withProviders(<CopyableText value="abc123" />));
      const copyIcon: string = screen.getByRole('button', {name: 'Copy'}).querySelector('svg')?.innerHTML ?? '';

      fireEvent.click(screen.getByRole('button', {name: 'Copy'}));

      const copied: HTMLElement = await screen.findByRole('button', {name: 'Copied!'});
      expect(copied.querySelector('svg')?.innerHTML).not.toBe(copyIcon);
    });
  });

  describe('with masking', () => {
    const field = (): HTMLInputElement => screen.getByLabelText<HTMLInputElement>('Client secret');

    it('shows the value in a read-only password field', () => {
      render(withProviders(<CopyableText label="Client secret" masked value={SECRET} />));

      expect(field()).toHaveAttribute('type', 'password');
      expect(field()).toHaveAttribute('readonly');
      expect(field()).toHaveValue(SECRET);
      expect(field()).toHaveAttribute('autocomplete', 'off');
    });

    it('does not put the value on the page as text', () => {
      const {container} = render(withProviders(<CopyableText label="Client secret" masked value={SECRET} />));

      expect(container.textContent).not.toContain(SECRET);
    });

    it('shows the value on Show and hides it again on Hide', () => {
      render(withProviders(<CopyableText label="Client secret" masked value={SECRET} />));

      fireEvent.click(screen.getByRole('button', {name: 'Show'}));
      expect(field()).toHaveAttribute('type', 'text');

      fireEvent.click(screen.getByRole('button', {name: 'Hide'}));
      expect(field()).toHaveAttribute('type', 'password');
    });

    it('names the toggle after what it does next and does not also mark it pressed', () => {
      render(withProviders(<CopyableText label="Client secret" masked value={SECRET} />));

      expect(screen.getByRole('button', {name: 'Show'})).not.toHaveAttribute('aria-pressed');

      fireEvent.click(screen.getByRole('button', {name: 'Show'}));

      expect(screen.getByRole('button', {name: 'Hide'})).not.toHaveAttribute('aria-pressed');
    });

    it('toggles with an eye icon, not a text button', () => {
      render(withProviders(<CopyableText label="Client secret" masked value={SECRET} />));
      const toggle: HTMLElement = screen.getByRole('button', {name: 'Show'});

      expect(toggle).toHaveTextContent('');
      expect(toggle.querySelector('svg')).not.toBeNull();
      const eyeShape: string = toggle.querySelector('svg')?.innerHTML ?? '';

      fireEvent.click(toggle);
      const hideToggle: HTMLElement = screen.getByRole('button', {name: 'Hide'});
      expect(hideToggle).toHaveTextContent('');
      expect(hideToggle.querySelector('svg')?.innerHTML).not.toBe(eyeShape);
    });

    it('can be toggled from the keyboard', () => {
      render(withProviders(<CopyableText label="Client secret" masked value={SECRET} />));

      fireEvent.keyDown(screen.getByRole('button', {name: 'Show'}), {key: 'Enter'});

      expect(field()).toHaveAttribute('type', 'text');
    });

    it('copies the real value while it is hidden', async () => {
      render(withProviders(<CopyableText label="Client secret" masked value={SECRET} />));

      fireEvent.click(screen.getByRole('button', {name: 'Copy'}));

      await waitFor(() => expect(writeText).toHaveBeenCalledWith(SECRET));
      expect(field()).toHaveAttribute('type', 'password');
    });

    it('shows Copied! after copying', async () => {
      render(withProviders(<CopyableText label="Client secret" masked value={SECRET} />));

      fireEvent.click(screen.getByRole('button', {name: 'Copy'}));

      expect(await screen.findByRole('button', {name: 'Copied!'})).toBeInTheDocument();
    });

    it('starts hidden again for a new component', () => {
      const {unmount} = render(withProviders(<CopyableText label="Client secret" masked value={SECRET} />));
      fireEvent.click(screen.getByRole('button', {name: 'Show'}));
      unmount();

      render(withProviders(<CopyableText label="Client secret" masked value={SECRET} />));

      expect(field()).toHaveAttribute('type', 'password');
    });
  });
});
