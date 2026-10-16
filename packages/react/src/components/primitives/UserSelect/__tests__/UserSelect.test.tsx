// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen, cleanup, waitFor} from '@testing-library/react';
import {getUsers} from '@thunderid/browser';
import {ReactElement} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import I18nProvider from '../../../../contexts/I18n/I18nProvider';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import ThunderIDContext, {ThunderIDContextProps} from '../../../../contexts/ThunderID/ThunderIDContext';
import {chooseOption} from '../../Select/__tests__/selectTestUtils';
import UserSelect from '../UserSelect';

vi.mock('@thunderid/browser', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/browser')>()),
  getUsers: vi.fn(),
}));

const thunderIDContext: ThunderIDContextProps = {
  baseUrl: 'https://localhost:8090',
  endpoints: {users: 'https://rs.example.com/users'},
} as unknown as ThunderIDContextProps;

const withProviders = (ui: ReactElement): ReactElement => (
  <ThunderIDContext.Provider value={thunderIDContext}>
    <I18nProvider>
      <ThemeProvider>{ui}</ThemeProvider>
    </I18nProvider>
  </ThunderIDContext.Provider>
);

describe('UserSelect', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads the user directory itself and submits the chosen ID', async () => {
    vi.mocked(getUsers).mockResolvedValue({
      count: 2,
      startIndex: 1,
      totalResults: 2,
      users: [
        {display: 'Jane Doe', id: 'user-1'},
        {display: 'John Roe', id: 'user-2'},
      ],
    } as never);
    const onChange = vi.fn();

    render(withProviders(<UserSelect label="Owner" onChange={onChange} />));
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    chooseOption(screen.getByRole('combobox', {name: 'Owner'}), 'Jane Doe');

    expect(getUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'https://localhost:8090',
        limit: 30,
        offset: 0,
        url: 'https://rs.example.com/users',
      }),
    );
    const chosen: unknown = expect.objectContaining({value: 'user-1'});
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({target: chosen}));
  });

  it('requests the first page once, when it renders', async () => {
    vi.mocked(getUsers).mockResolvedValue({count: 0, startIndex: 1, totalResults: 0, users: []} as never);

    render(withProviders(<UserSelect label="Owner" />));

    await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(1));
  });
});
