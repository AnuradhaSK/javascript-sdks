// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EmbeddedFlowComponentType, getDefaultI18nBundles, substituteTranslationParams} from '@thunderid/browser';
import type {EmbeddedFlowComponent} from '@thunderid/browser';
import {mount} from '@vue/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ref, type Component} from 'vue';
import BaseSignIn from '../../components/auth/sign-in/BaseSignIn';
import BaseSignUp from '../../components/auth/sign-up/BaseSignUp';
import BaseAcceptInvite from '../../components/presentation/accept-invite/BaseAcceptInvite';
import BaseInviteUser from '../../components/presentation/invite-user/BaseInviteUser';
import {FLOW_KEY, FLOW_META_KEY, I18N_KEY} from '../../keys';

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

const ownerPicker = (required = false, type = EmbeddedFlowComponentType.UserSelect): EmbeddedFlowComponent =>
  ({
    id: 'owner_input',
    label: 'Owner',
    ref: 'owner',
    required,
    type,
  }) as EmbeddedFlowComponent;

const submitAction = {
  eventType: 'SUBMIT',
  id: 'continue_action',
  label: 'Continue',
  type: EmbeddedFlowComponentType.Action,
  variant: 'PRIMARY',
} as EmbeddedFlowComponent;

const usersPage = {
  nextOffset: null,
  options: [
    {label: 'Jane Doe', value: 'user-1'},
    {label: 'John Roe', value: 'user-2'},
  ],
};

const PICKER = 'select';

/** Waits for the picker and for the users the supplied data source returned. */
const waitForOwnerPicker = async (wrapper: FlowWrapper): Promise<void> => {
  await vi.waitFor(() => expect(wrapper.find(PICKER).exists()).toBe(true));
  await vi.waitFor(() => expect((wrapper.find(PICKER).element as HTMLSelectElement).options).toHaveLength(2));
};

const expectNoPicker = async (wrapper: FlowWrapper): Promise<void> => {
  await vi.waitFor(() => expect(wrapper.find('button[type="submit"]').exists()).toBe(true));
  expect(wrapper.find(PICKER).exists()).toBe(false);
};

const incompleteStep = {
  data: {components: [ownerPicker(), submitAction]},
  executionId: 'exec-1',
  flowStatus: 'INCOMPLETE',
};

describe.each([
  EmbeddedFlowComponentType.UserSelect,
  EmbeddedFlowComponentType.AuthFlowSelect,
  EmbeddedFlowComponentType.UserTypeSelect,
])('%s is skipped where no signed-in user exists (vue)', (pickerType: EmbeddedFlowComponentType) => {
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  });

  it('logs that the type is unsupported, as it does for any component it cannot draw', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mountFlow(BaseSignIn, {
      components: [ownerPicker(false, pickerType), submitAction],
      onSubmit: vi.fn(),
    });

    await expectNoPicker(wrapper);

    expect(warn.mock.calls.flat().join(' ')).toContain(`Unsupported component type: ${pickerType}. Skipping render.`);
    warn.mockRestore();
  });

  it('BaseSignIn skips the picker and still renders the rest of the step', async () => {
    const wrapper = mountFlow(BaseSignIn, {
      components: [ownerPicker(false, pickerType), submitAction],
      onSubmit: vi.fn(),
    });

    await expectNoPicker(wrapper);
  });

  it('BaseSignUp skips the picker and still renders the rest of the step', async () => {
    const onInitialize = vi.fn().mockResolvedValue({
      data: {meta: {components: [ownerPicker(false, pickerType), submitAction]}},
      executionId: 'exec-1',
      flowStatus: 'INCOMPLETE',
    });
    const wrapper = mountFlow(BaseSignUp, {isInitialized: true, onInitialize, onSubmit: vi.fn()});

    await expectNoPicker(wrapper);
  });

  it('BaseAcceptInvite skips the picker and still renders the rest of the step', async () => {
    const onSubmit = vi.fn().mockResolvedValue(incompleteStep);
    const wrapper = mountFlow(BaseAcceptInvite, {flowId: 'exec-1', inviteToken: 'token-1', onSubmit});

    await expectNoPicker(wrapper);
  });

  it('a required picker that is not rendered does not block the step from being submitted', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountFlow(BaseSignIn, {components: [ownerPicker(true, pickerType), submitAction], onSubmit});

    await vi.waitFor(() => expect(wrapper.find('button[type="submit"]').exists()).toBe(true));
    await wrapper.find('button[type="submit"]').trigger('click');

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});

describe.each([
  {loader: 'fetchUsers', type: EmbeddedFlowComponentType.UserSelect},
  {loader: 'fetchAuthFlows', type: EmbeddedFlowComponentType.AuthFlowSelect},
  {loader: 'fetchUserTypes', type: EmbeddedFlowComponentType.UserTypeSelect},
])('$type is wired into InviteUser, where a signed-in admin exists (vue)', ({loader, type}) => {
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  });

  it('BaseInviteUser renders a usable picker fed by the supplied data source', async () => {
    const fetchOptions = vi.fn().mockResolvedValue(usersPage);
    const onInitialize = vi.fn().mockResolvedValue({
      data: {components: [ownerPicker(false, type), submitAction]},
      executionId: 'exec-1',
      flowStatus: 'INCOMPLETE',
    });
    const wrapper = mountFlow(BaseInviteUser, {[loader]: fetchOptions, onInitialize, onSubmit: vi.fn()});

    await waitForOwnerPicker(wrapper);

    expect(fetchOptions).toHaveBeenCalledWith(expect.objectContaining({limit: 30, offset: 0}));
  });
});
