// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen, cleanup, waitFor} from '@testing-library/react';
import {getUserTypes} from '@thunderid/browser';
import {ReactElement} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import I18nProvider from '../../../../contexts/I18n/I18nProvider';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import ThunderIDContext, {ThunderIDContextProps} from '../../../../contexts/ThunderID/ThunderIDContext';
import {chooseOption} from '../../Select/__tests__/selectTestUtils';
import UserTypeSelect from '../UserTypeSelect';

vi.mock('@thunderid/browser', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/browser')>()),
  getUserTypes: vi.fn(),
}));

const thunderIDContext: ThunderIDContextProps = {
  baseUrl: 'https://localhost:8090',
  endpoints: {userTypes: 'https://rs.example.com/user-types'},
} as unknown as ThunderIDContextProps;

const withProviders = (ui: ReactElement): ReactElement => (
  <ThunderIDContext.Provider value={thunderIDContext}>
    <I18nProvider>
      <ThemeProvider>{ui}</ThemeProvider>
    </I18nProvider>
  </ThunderIDContext.Provider>
);

describe('UserTypeSelect', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads user types itself, shows the handle and submits the handle', async () => {
    vi.mocked(getUserTypes).mockResolvedValue({
      count: 2,
      startIndex: 1,
      totalResults: 2,
      types: [
        {displayName: 'Staff', handle: 'employee', id: 'type-1'},
        {displayName: 'Staff', handle: 'contractor', id: 'type-2'},
      ],
    } as never);
    const onChange = vi.fn();

    render(withProviders(<UserTypeSelect label="User type" onChange={onChange} />));
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    expect(screen.queryByText('Staff')).not.toBeInTheDocument();
    chooseOption(screen.getByRole('combobox', {name: 'User type'}), 'contractor');

    expect(getUserTypes).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'https://localhost:8090',
        limit: 30,
        offset: 0,
        url: 'https://rs.example.com/user-types',
      }),
    );
    const chosen: unknown = expect.objectContaining({value: 'contractor'});
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({target: chosen}));
  });

  it('requests the first page once, when it renders', async () => {
    vi.mocked(getUserTypes).mockResolvedValue({count: 0, startIndex: 1, totalResults: 0, types: []} as never);

    render(withProviders(<UserTypeSelect label="User type" />));

    await waitFor(() => expect(getUserTypes).toHaveBeenCalledTimes(1));
  });

  it('shows the translated empty message when there are no user types', async () => {
    vi.mocked(getUserTypes).mockResolvedValue({count: 0, startIndex: 1, totalResults: 0, types: []} as never);

    render(withProviders(<UserTypeSelect label="User type" />));

    expect(await screen.findByText('No user types found.')).toBeInTheDocument();
  });
});
