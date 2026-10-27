// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {EmbeddedFlowComponentType} from '@thunderid/browser';
import type {EmbeddedFlowComponent} from '@thunderid/browser';
import {ReactElement} from 'react';
import {afterEach, describe, expect, it, vi, Mock} from 'vitest';
import I18nProvider from '../../../contexts/I18n/I18nProvider';
import ThemeProvider from '../../../contexts/Theme/ThemeProvider';
import ThunderIDContext, {ThunderIDContextProps} from '../../../contexts/ThunderID/ThunderIDContext';
import {
  chooseOption,
  getAllSelectControls,
  getSelectControl,
  readSelectedLabel,
} from '../../primitives/Select/__tests__/selectTestUtils';
import BaseAcceptInvite from '../AcceptInvite/BaseAcceptInvite';
import BaseInviteUser from '../InviteUser/BaseInviteUser';
import BaseRecovery from '../Recovery/BaseRecovery';
import BaseSignIn from '../SignIn/BaseSignIn';
import BaseSignUp from '../SignUp/BaseSignUp';

const thunderIDContext: ThunderIDContextProps = {
  applicationId: 'app-1',
  getStorageManager: vi.fn(() =>
    Promise.resolve({
      getTemporaryData: vi.fn(() => Promise.resolve({})),
      removeTemporaryDataParameter: vi.fn(),
      setTemporaryDataParameter: vi.fn(),
    }),
  ),
  isInitialized: true,
  isLoading: false,
  meta: null,
  vendor: 'thunderid',
} as unknown as ThunderIDContextProps;

const withProviders = (ui: ReactElement): ReactElement => (
  <ThunderIDContext.Provider value={thunderIDContext}>
    <I18nProvider>
      <ThemeProvider>{ui}</ThemeProvider>
    </I18nProvider>
  </ThunderIDContext.Provider>
);

const COUNTRY_OPTIONS = [
  {label: 'Sri Lanka', value: 'LK'},
  {label: 'India', value: 'IN'},
];

const selectField = (overrides: Record<string, unknown> = {}): EmbeddedFlowComponent =>
  ({
    id: 'country_input',
    label: 'Country',
    options: COUNTRY_OPTIONS,
    placeholder: 'Choose a country',
    ref: 'country',
    required: false,
    type: EmbeddedFlowComponentType.Select,
    ...overrides,
  }) as EmbeddedFlowComponent;

const submitAction = {
  eventType: 'SUBMIT',
  id: 'continue_action',
  label: 'Continue',
  type: EmbeddedFlowComponentType.Action,
  variant: 'PRIMARY',
} as EmbeddedFlowComponent;

const incompleteStep = (components: EmbeddedFlowComponent[]) => ({
  data: {components},
  executionId: 'exec-1',
  flowStatus: 'INCOMPLETE',
});

const incompleteServerStep = (components: EmbeddedFlowComponent[]) => ({
  data: {meta: {components}},
  executionId: 'exec-1',
  flowStatus: 'INCOMPLETE',
});

interface FlowHarness {
  mount: (components: EmbeddedFlowComponent[]) => ReactElement;
  submitted: Mock;
}

const FLOWS: Record<string, () => FlowHarness> = {
  BaseAcceptInvite: () => {
    const submitted: Mock = vi.fn().mockResolvedValue(undefined);

    return {
      mount: (components) => {
        submitted.mockResolvedValueOnce(incompleteStep(components));

        return withProviders(<BaseAcceptInvite executionId="exec-1" inviteToken="token-1" onSubmit={submitted} />);
      },
      submitted,
    };
  },
  BaseInviteUser: () => {
    const submitted: Mock = vi.fn().mockResolvedValue(undefined);

    return {
      mount: (components) =>
        withProviders(
          <BaseInviteUser
            isInitialized
            onInitialize={vi.fn().mockResolvedValue(incompleteStep(components))}
            onSubmit={submitted}
          />,
        ),
      submitted,
    };
  },
  BaseRecovery: () => {
    const submitted: Mock = vi.fn().mockResolvedValue(undefined);

    return {
      mount: (components) =>
        withProviders(
          <BaseRecovery
            isInitialized
            onInitialize={vi.fn().mockResolvedValue(incompleteStep(components))}
            onSubmit={submitted}
          />,
        ),
      submitted,
    };
  },
  BaseSignIn: () => {
    const submitted: Mock = vi.fn().mockResolvedValue(undefined);

    return {
      mount: (components) => withProviders(<BaseSignIn components={components} onSubmit={submitted} />),
      submitted,
    };
  },
  BaseSignUp: () => {
    const submitted: Mock = vi.fn().mockResolvedValue(undefined);

    return {
      mount: (components) =>
        withProviders(
          <BaseSignUp
            isInitialized
            onInitialize={vi.fn().mockResolvedValue(incompleteServerStep(components))}
            onSubmit={submitted}
          />,
        ),
      submitted,
    };
  },
};

interface SubmittedPayload {
  data?: {inputs?: Record<string, unknown>};
  inputs?: Record<string, unknown>;
}

const lastSubmittedInputs = (submitted: Mock): Record<string, unknown> => {
  const [payload] = submitted.mock.calls.at(-1) as [SubmittedPayload];

  return payload.inputs ?? payload.data?.inputs ?? {};
};

const clickContinue = async (): Promise<void> => {
  fireEvent.click(await screen.findByRole('button', {name: /continue/i}));
};

describe.each(Object.keys(FLOWS))('%s with a SELECT field', (flowName: string) => {
  afterEach(cleanup);

  it('renders the options from the flow and keeps the placeholder until one is chosen', async () => {
    const harness: FlowHarness = FLOWS[flowName]();
    render(harness.mount([selectField(), submitAction]));
    await screen.findByText('Country');

    expect(readSelectedLabel(getSelectControl())).toBe('Choose a country');
  });

  it('submits the chosen option under the field reference', async () => {
    const harness: FlowHarness = FLOWS[flowName]();
    render(harness.mount([selectField(), submitAction]));
    await screen.findByText('Country');

    chooseOption(getSelectControl(), 'India');
    expect(readSelectedLabel(getSelectControl())).toBe('India');
    await clickContinue();

    await waitFor(() => expect(harness.submitted).toHaveBeenCalled());
    expect(lastSubmittedInputs(harness.submitted)).toMatchObject({country: 'IN'});
  });

  it('keeps several SELECT fields independent', async () => {
    const harness: FlowHarness = FLOWS[flowName]();
    const language: EmbeddedFlowComponent = selectField({
      id: 'language_input',
      label: 'Language',
      options: [
        {label: 'English', value: 'en'},
        {label: 'Tamil', value: 'ta'},
      ],
      ref: 'language',
    });
    render(harness.mount([selectField(), language, submitAction]));
    await screen.findByText('Language');

    chooseOption(getAllSelectControls()[1], 'Tamil');
    await clickContinue();

    await waitFor(() => expect(harness.submitted).toHaveBeenCalled());
    const inputs: Record<string, unknown> = lastSubmittedInputs(harness.submitted);
    expect(inputs).toMatchObject({language: 'ta'});
    expect(inputs['country'] ?? '').toBe('');
  });

  it('blocks submit while a required SELECT is empty and allows it once chosen', async () => {
    const harness: FlowHarness = FLOWS[flowName]();
    render(harness.mount([selectField({required: true}), submitAction]));
    await screen.findByText('Country');
    const callsBeforeSubmit: number = harness.submitted.mock.calls.length;

    await clickContinue();

    expect(harness.submitted).toHaveBeenCalledTimes(callsBeforeSubmit);

    chooseOption(getSelectControl(), 'Sri Lanka');
    fireEvent.blur(getSelectControl());
    await waitFor(() => expect(screen.getByRole('button', {name: /continue/i})).toBeEnabled());
    await clickContinue();

    await waitFor(() => expect(harness.submitted).toHaveBeenCalledTimes(callsBeforeSubmit + 1));
    expect(lastSubmittedInputs(harness.submitted)).toMatchObject({country: 'LK'});
  });
});
