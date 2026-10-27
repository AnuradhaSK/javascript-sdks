// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen, cleanup} from '@testing-library/react';
import {createTheme, ANONYMOUS_ANIMAL_ICONS, EmbeddedFlowComponent} from '@thunderid/browser';
import {ReactElement} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import ThemeContext, {ThemeContextValue} from '../../../../contexts/Theme/ThemeContext';
import {AdapterProps} from '../../../../models/adapters';
import ImageComponent from '../ImageComponent';

const themeContextValue: ThemeContextValue = {
  colorScheme: 'light',
  direction: 'ltr',
  theme: createTheme(),
  toggleTheme: vi.fn(),
};

const withTheme = (ui: ReactElement): ReactElement => (
  <ThemeContext.Provider value={themeContextValue}>{ui}</ThemeContext.Provider>
);

const buildProps = (config: Record<string, unknown>): AdapterProps => ({
  component: {config} as unknown as EmbeddedFlowComponent,
  formErrors: {},
  formValues: {},
  isFormValid: true,
  isLoading: false,
  onInputChange: vi.fn(),
  touchedFields: {},
});

describe('ImageComponent', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a plain image URL as-is', () => {
    render(withTheme(<ImageComponent {...buildProps({src: 'https://example.com/logo.png', alt: 'Acme'})} />));
    const img: HTMLElement = screen.getByAltText('Acme');
    expect(img).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('renders an emoji: spec as its glyph, not an image', () => {
    const {container} = render(withTheme(<ImageComponent {...buildProps({src: 'emoji:🐼', alt: 'Panda'})} />));
    expect(screen.getByText('🐼')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('renders an anonymous_animal avatar: spec using the bundled icon markup', () => {
    const [name] = Object.keys(ANONYMOUS_ANIMAL_ICONS);
    render(
      withTheme(
        <ImageComponent
          {...buildProps({src: `avatar:shape=rounded,variant=anonymous_animal,content=${name}`, alt: 'Anonymous'})}
        />,
      ),
    );
    const img: HTMLElement = screen.getByAltText('Anonymous');
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain(ANONYMOUS_ANIMAL_ICONS[name].color);
  });
});
