// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen, cleanup, fireEvent, waitFor} from '@testing-library/react';
import {createTheme, EmbeddedFlowComponentType, ThunderIDAPIError} from '@thunderid/browser';
import type {EmbeddedFlowComponent, SelectPage} from '@thunderid/browser';
import {afterEach, describe, expect, it, vi} from 'vitest';
import I18nProvider from '../../../../contexts/I18n/I18nProvider';
import ThemeContext, {ThemeContextValue} from '../../../../contexts/Theme/ThemeContext';
import {chooseOption} from '../../../primitives/Select/__tests__/selectTestUtils';
import {renderInviteUserComponents} from '../AuthOptionFactory';

interface PickerCase {
  label: string;
  loaderOption: 'fetchAuthFlows' | 'fetchUserTypes';
  name: RegExp;
  page: SelectPage;
  submitted: {name: string; value: string};
  type: EmbeddedFlowComponentType;
}

const CASES: PickerCase[] = [
  {
    label: 'Login flow',
    loaderOption: 'fetchAuthFlows',
    name: /login flow/i,
    page: {
      nextOffset: null,
      options: [
        {label: 'Password login', value: 'flow-1'},
        {label: 'Passkey login', value: 'flow-2'},
      ],
      totalResults: 2,
    },
    submitted: {name: 'Passkey login', value: 'flow-2'},
    type: EmbeddedFlowComponentType.AuthFlowSelect,
  },
  {
    label: 'User type',
    loaderOption: 'fetchUserTypes',
    name: /user type/i,
    page: {
      nextOffset: null,
      options: [
        {label: 'employee', value: 'employee'},
        {label: 'contractor', value: 'contractor'},
      ],
      totalResults: 2,
    },
    submitted: {name: 'contractor', value: 'contractor'},
    type: EmbeddedFlowComponentType.UserTypeSelect,
  },
];

const themeContextValue: ThemeContextValue = {
  colorScheme: 'light',
  direction: 'ltr',
  theme: createTheme(),
  toggleTheme: vi.fn(),
};

describe.each(CASES)('AuthOptionFactory $type', (picker: PickerCase) => {
  afterEach(() => {
    cleanup();
  });

  const input: EmbeddedFlowComponent = {
    id: 'picker_input',
    label: picker.label,
    ref: 'picked',
    required: false,
    type: picker.type,
  };

  const renderPicker = ({
    component = input,
    loader,
    onInputBlur,
    onInputChange = vi.fn(),
    onPickerError,
  }: {
    component?: EmbeddedFlowComponent;
    loader?: ReturnType<typeof vi.fn>;
    onInputBlur?: (name: string) => void;
    onInputChange?: (name: string, value: string) => void;
    onPickerError?: (error: Error) => void;
  }): ReturnType<typeof render> => {
    const elements = renderInviteUserComponents(
      [component],
      {picked: ''},
      {},
      {},
      false,
      true,
      () => undefined,
      onInputChange,
      {...(loader ? {[picker.loaderOption]: loader} : {}), onInputBlur, onPickerError},
    );

    return render(
      <I18nProvider>
        <ThemeContext.Provider value={themeContextValue}>{elements}</ThemeContext.Provider>
      </I18nProvider>,
    );
  };

  it('renders a labelled picker that requests its first page', async () => {
    const loader = vi.fn().mockResolvedValue(picker.page);
    renderPicker({loader});

    expect(screen.getByRole('combobox', {name: picker.name})).toBeInTheDocument();
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
  });

  it('loads the first page from the supplied data source and submits the value, not the label', async () => {
    const loader = vi.fn().mockResolvedValue(picker.page);
    const onInputChange = vi.fn();
    renderPicker({loader, onInputChange});

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    expect(loader).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledWith(expect.objectContaining({limit: 30, offset: 0}));

    chooseOption(screen.getByRole('combobox', {name: picker.name}), picker.submitted.name);

    expect(onInputChange).toHaveBeenCalledWith('picked', picker.submitted.value);
  });

  it('hands a failed load to onPickerError and shows no error in the picker', async () => {
    const failure: ThunderIDAPIError = new ThunderIDAPIError('nope', 'getX-ForbiddenError-001', 'javascript', 403);
    const loader = vi.fn().mockRejectedValue(failure);
    const onPickerError = vi.fn();
    renderPicker({loader, onPickerError});

    await waitFor(() => expect(onPickerError).toHaveBeenCalledWith(failure));
    expect(screen.queryByText(/nope|failed/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /retry/i})).not.toBeInTheDocument();
  });

  it('renders nothing when no data source is supplied', () => {
    const {container} = renderPicker({});

    expect(container.querySelector('select')).toBeNull();
  });

  it('logs that the type is not supported when no data source is supplied, as it does for OU_SELECT', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    renderPicker({});

    expect(warn.mock.calls.flat().join(' ')).toContain(
      `${picker.type} component type is not supported. Skipping render.`,
    );
    warn.mockRestore();
  });

  it('tells the flow when the picker is left, so a required picker can show its error', async () => {
    const loader = vi.fn().mockResolvedValue(picker.page);
    const onInputBlur = vi.fn();
    renderPicker({loader, onInputBlur});
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));

    fireEvent.blur(screen.getByRole('combobox', {name: picker.name}));

    expect(onInputBlur).toHaveBeenCalledWith('picked');
  });

  it('keeps an accessible name when the flow gives an empty label', async () => {
    const loader = vi.fn().mockResolvedValue(picker.page);
    renderPicker({component: {...input, label: '', placeholder: 'Pick one'}, loader});
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pick one');
  });
});
