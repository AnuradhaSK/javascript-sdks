// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EmbeddedFlowComponentType, getDefaultI18nBundles, substituteTranslationParams} from '@thunderid/browser';
import type {EmbeddedFlowComponent} from '@thunderid/browser';
import {mount} from '@vue/test-utils';
import {afterEach, describe, expect, it, vi, type Mock} from 'vitest';
import {ref, type Component} from 'vue';
import BaseAcceptInvite from '../../../components/auth/accept-invite/BaseAcceptInvite';
import BaseInviteUser from '../../../components/auth/invite-user/BaseInviteUser';
import BaseSignIn from '../../../components/auth/sign-in/BaseSignIn';
import BaseSignUp from '../../../components/auth/sign-up/BaseSignUp';
import {FLOW_KEY, FLOW_META_KEY, I18N_KEY} from '../../../keys';
import {chooseOption, findAllSelectControls, findSelectControl, readSelectedLabel} from '../../helpers/selectControl';

const i18n = {
  bundles: ref({}),
  currentLanguage: ref('en-US'),
  fallbackLanguage: 'en-US',
  injectBundles: vi.fn(),
  setLanguage: vi.fn(),
  t: (key: string, params?: Record<string, string | number>): string => {
    const translations = getDefaultI18nBundles()['en-US']?.translations as Record<string, string>;
    const value: string = translations?.[key] ?? key;

    return params ? substituteTranslationParams(value, params) : value;
  },
};

const provide = {
  [FLOW_KEY as symbol]: {
    addMessage: vi.fn(),
    clearMessages: vi.fn(),
    messages: ref([]),
    subtitle: ref(''),
    title: ref(''),
  },
  [FLOW_META_KEY as symbol]: {meta: ref(null)},
  [I18N_KEY as symbol]: i18n,
};

const mounted: {unmount: () => void}[] = [];
const mountFlow = (component: Component, props: Record<string, unknown>) => {
  const wrapper = mount(component, {attachTo: document.body, global: {provide}, props});
  mounted.push(wrapper);

  return wrapper;
};
type FlowWrapper = ReturnType<typeof mountFlow>;

const selectField = (overrides: Record<string, unknown> = {}): EmbeddedFlowComponent =>
  ({
    id: 'country_input',
    label: 'Country',
    options: [
      {label: 'Sri Lanka', value: 'LK'},
      {label: 'India', value: 'IN'},
    ],
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

interface FlowHarness {
  mount: (components: EmbeddedFlowComponent[]) => FlowWrapper;
  submitted: Mock;
}

const FLOWS: Record<string, () => FlowHarness> = {
  BaseAcceptInvite: () => {
    const submitted: Mock = vi.fn().mockResolvedValue(undefined);

    return {
      mount: (components) => {
        submitted.mockResolvedValueOnce(incompleteStep(components));

        return mountFlow(BaseAcceptInvite, {flowId: 'exec-1', inviteToken: 'token-1', onSubmit: submitted});
      },
      submitted,
    };
  },
  BaseInviteUser: () => {
    const submitted: Mock = vi.fn().mockResolvedValue(undefined);

    return {
      mount: (components) =>
        mountFlow(BaseInviteUser, {
          onInitialize: vi.fn().mockResolvedValue(incompleteStep(components)),
          onSubmit: submitted,
        }),
      submitted,
    };
  },
  BaseSignIn: () => {
    const submitted: Mock = vi.fn().mockResolvedValue(undefined);

    return {
      mount: (components) => mountFlow(BaseSignIn, {components, onSubmit: submitted}),
      submitted,
    };
  },
  BaseSignUp: () => {
    const submitted: Mock = vi.fn().mockResolvedValue(undefined);

    return {
      mount: (components) =>
        mountFlow(BaseSignUp, {
          isInitialized: true,
          onInitialize: vi.fn().mockResolvedValue({
            data: {meta: {components}},
            executionId: 'exec-1',
            flowStatus: 'INCOMPLETE',
          }),
          onSubmit: submitted,
        }),
      submitted,
    };
  },
};

const SUBMIT = 'button[type="submit"]';

const waitForField = async (wrapper: FlowWrapper, label: string): Promise<void> => {
  await vi.waitFor(() => expect(wrapper.text()).toContain(label));
};

const clickContinue = async (wrapper: FlowWrapper): Promise<void> => {
  await vi.waitFor(() => expect(wrapper.find(SUBMIT).exists()).toBe(true));
  await wrapper.find(SUBMIT).trigger('click');
};

const submittedText = (submitted: Mock): string => JSON.stringify(submitted.mock.calls.at(-1) ?? []);

describe.each(Object.keys(FLOWS))('%s with a SELECT field (vue)', (flowName: string) => {
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  });

  it('renders the options from the flow and keeps the placeholder until one is chosen', async () => {
    const wrapper = FLOWS[flowName]().mount([selectField(), submitAction]);
    await waitForField(wrapper, 'Country');

    expect(readSelectedLabel(findSelectControl(wrapper))).toBe('Choose a country');
  });

  it('lets an optional SELECT be cleared again through the placeholder, and still submits', async () => {
    const harness: FlowHarness = FLOWS[flowName]();
    const wrapper = harness.mount([selectField(), submitAction]);
    await waitForField(wrapper, 'Country');
    await chooseOption(findSelectControl(wrapper), 'India');

    await chooseOption(findSelectControl(wrapper), 'Choose a country');

    expect(readSelectedLabel(findSelectControl(wrapper))).toBe('Choose a country');
    const callsBefore: number = harness.submitted.mock.calls.length;
    await clickContinue(wrapper);
    await vi.waitFor(() => expect(harness.submitted.mock.calls.length).toBeGreaterThan(callsBefore));
    expect(submittedText(harness.submitted)).not.toContain('"country":"IN"');
  });

  it('keeps the placeholder of a required SELECT from being chosen', async () => {
    const wrapper = FLOWS[flowName]().mount([selectField({required: true}), submitAction]);
    await waitForField(wrapper, 'Country');

    expect((findSelectControl(wrapper).element as HTMLSelectElement).options[0].disabled).toBe(true);
  });

  it('submits the chosen option under the field reference', async () => {
    const harness: FlowHarness = FLOWS[flowName]();
    const wrapper = harness.mount([selectField(), submitAction]);
    await waitForField(wrapper, 'Country');

    await chooseOption(findSelectControl(wrapper), 'India');
    expect(readSelectedLabel(findSelectControl(wrapper))).toBe('India');
    const callsBefore: number = harness.submitted.mock.calls.length;
    await clickContinue(wrapper);

    await vi.waitFor(() => expect(harness.submitted.mock.calls.length).toBeGreaterThan(callsBefore));
    expect(submittedText(harness.submitted)).toContain('"country":"IN"');
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
    const wrapper = harness.mount([selectField(), language, submitAction]);
    await waitForField(wrapper, 'Language');

    await chooseOption(findAllSelectControls(wrapper)[1], 'Tamil');
    const callsBefore: number = harness.submitted.mock.calls.length;
    await clickContinue(wrapper);

    await vi.waitFor(() => expect(harness.submitted.mock.calls.length).toBeGreaterThan(callsBefore));
    expect(submittedText(harness.submitted)).toContain('"language":"ta"');
    expect(submittedText(harness.submitted)).not.toContain('"country":"');
  });

  it('blocks submit while a required SELECT is empty', async () => {
    const harness: FlowHarness = FLOWS[flowName]();
    const wrapper = harness.mount([selectField({required: true}), submitAction]);
    await waitForField(wrapper, 'Country');
    const callsBefore: number = harness.submitted.mock.calls.length;

    await clickContinue(wrapper);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(harness.submitted.mock.calls.length).toBe(callsBefore);
  });

  it.skipIf(flowName !== 'BaseSignIn')('submits a required SELECT once it is chosen', async () => {
    const harness: FlowHarness = FLOWS[flowName]();
    const wrapper = harness.mount([selectField({required: true}), submitAction]);
    await waitForField(wrapper, 'Country');
    await clickContinue(wrapper);

    await chooseOption(findSelectControl(wrapper), 'Sri Lanka');
    await vi.waitFor(() => expect(wrapper.find(SUBMIT).attributes('disabled')).toBeUndefined());
    await clickContinue(wrapper);

    await vi.waitFor(() => expect(harness.submitted).toHaveBeenCalledTimes(1));
    expect(submittedText(harness.submitted)).toContain('"country":"LK"');
  });
});
