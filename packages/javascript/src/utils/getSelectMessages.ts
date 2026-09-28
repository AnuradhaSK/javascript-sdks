// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import getDefaultI18nBundles from '../i18n/utils/getDefaultI18nBundles';
import type {SelectMessages} from '../models/select';

type Translate = (key: string) => string;

let englishFallback: Record<string, string> | undefined;

const getEnglishFallback = (): Record<string, string> => {
  if (!englishFallback) {
    const translations: unknown = getDefaultI18nBundles()['en-US']?.translations;

    englishFallback = (translations ?? {}) as Record<string, string>;
  }

  return englishFallback;
};

/**
 * The wording of `Select`: the active translations when a translate function is given, the default English
 * otherwise, so `Select` works without an I18n provider. A key the translate function does not know comes back
 * as the key itself, and is treated the same as no translation.
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
const getSelectMessages = (translate?: Translate): SelectMessages => {
  const text = (key: string): string => {
    const translated: string | undefined = translate?.(key);

    return translated && translated !== key ? translated : (getEnglishFallback()[key] ?? key);
  };

  return {
    loadMore: text('elements.fields.select.load_more'),
    loading: text('elements.fields.select.loading'),
    loadingMore: text('elements.fields.select.loading_more'),
  };
};

export default getSelectMessages;
