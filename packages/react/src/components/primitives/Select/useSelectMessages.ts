// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getSelectMessages} from '@thunderid/browser';
import type {SelectMessages} from '@thunderid/browser';
import {ContextType, useContext, useMemo} from 'react';
import I18nContext from '../../../contexts/I18n/I18nContext';

export type {SelectMessages};

/**
 * The wording of `Select`: the active translations when there is an I18n provider, English otherwise, so `Select`
 * works without a provider.
 */
const useSelectMessages = (): SelectMessages => {
  const i18n: ContextType<typeof I18nContext> = useContext(I18nContext);

  return useMemo((): SelectMessages => getSelectMessages(i18n ? (key: string) => i18n.t(key) : undefined), [i18n]);
};

export default useSelectMessages;
