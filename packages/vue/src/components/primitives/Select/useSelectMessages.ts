// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getSelectMessages} from '@thunderid/browser';
import type {SelectMessages} from '@thunderid/browser';
import {inject} from 'vue';
import {I18N_KEY} from '../../../keys';
import type {I18nContextValue} from '../../../models/contexts';

export type {SelectMessages};

/**
 * The wording of `Select`: the active translations when there is an I18n provider, English otherwise, so `Select`
 * works without a provider. Call the result in a render function so a change of language is picked up.
 */
const useSelectMessages = (): (() => SelectMessages) => {
  const i18n: I18nContextValue | null = inject<I18nContextValue | null>(I18N_KEY, null);

  return (): SelectMessages => getSelectMessages(i18n ? (key: string) => i18n.t(key) : undefined);
};

export default useSelectMessages;
