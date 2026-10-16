// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen, cleanup, waitFor} from '@testing-library/react';
import {getFlows} from '@thunderid/browser';
import {ReactElement} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import I18nProvider from '../../../../contexts/I18n/I18nProvider';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import ThunderIDContext, {ThunderIDContextProps} from '../../../../contexts/ThunderID/ThunderIDContext';
import {chooseOption} from '../../Select/__tests__/selectTestUtils';
import AuthFlowSelect from '../AuthFlowSelect';

vi.mock('@thunderid/browser', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/browser')>()),
  getFlows: vi.fn(),
}));

const thunderIDContext: ThunderIDContextProps = {
  baseUrl: 'https://localhost:8090',
  endpoints: {flows: 'https://rs.example.com/flows'},
} as unknown as ThunderIDContextProps;

const withProviders = (ui: ReactElement): ReactElement => (
  <ThunderIDContext.Provider value={thunderIDContext}>
    <I18nProvider>
      <ThemeProvider>{ui}</ThemeProvider>
    </I18nProvider>
  </ThunderIDContext.Provider>
);

describe('AuthFlowSelect', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads authentication flows itself, shows the name and submits the flow ID', async () => {
    vi.mocked(getFlows).mockResolvedValue({
      count: 2,
      flows: [
        {handle: 'password', id: 'flow-1', name: 'Password login'},
        {handle: 'passkey', id: 'flow-2', name: 'Passkey login'},
      ],
      startIndex: 1,
      totalResults: 2,
    } as never);
    const onChange = vi.fn();

    render(withProviders(<AuthFlowSelect label="Login flow" onChange={onChange} />));
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    chooseOption(screen.getByRole('combobox', {name: 'Login flow'}), 'Passkey login');

    expect(getFlows).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'https://localhost:8090',
        flowType: 'AUTHENTICATION',
        limit: 30,
        offset: 0,
        url: 'https://rs.example.com/flows',
      }),
    );
    const chosen: unknown = expect.objectContaining({value: 'flow-2'});
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({target: chosen}));
  });

  it('requests the first page once, when it renders', async () => {
    vi.mocked(getFlows).mockResolvedValue({count: 0, flows: [], startIndex: 1, totalResults: 0} as never);

    render(withProviders(<AuthFlowSelect label="Login flow" />));

    await waitFor(() => expect(getFlows).toHaveBeenCalledTimes(1));
  });

  it('shows the translated empty message when there are no flows', async () => {
    vi.mocked(getFlows).mockResolvedValue({count: 0, flows: [], startIndex: 1, totalResults: 0} as never);

    render(withProviders(<AuthFlowSelect label="Login flow" />));

    expect(await screen.findByText('No login flows found.')).toBeInTheDocument();
  });
});
