// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix} from '@thunderid/browser';
import {type Component, type PropType, type VNode, defineComponent, h} from 'vue';
import BaseLanguageSwitcher from './BaseLanguageSwitcher';
import useI18n from '../../../composables/useI18n';
import type {SelectOption} from '../../primitives/Select/Select';

interface LanguageSwitcherSetupProps {
  className: string;
  languages: SelectOption[];
}

/**
 * LanguageSwitcher — styled language selection component.
 *
 * Retrieves current language and setLanguage from i18n context.
 */
const LanguageSwitcher: Component = defineComponent({
  name: 'LanguageSwitcher',
  props: {
    className: {default: '', type: String},
    languages: {
      default: () => [
        {label: 'English', value: 'en'},
        {label: 'French', value: 'fr'},
        {label: 'Spanish', value: 'es'},
        {label: 'Portuguese', value: 'pt'},
      ],
      type: Array as PropType<SelectOption[]>,
    },
  },
  setup(props: LanguageSwitcherSetupProps, {slots}: {slots: any}): () => VNode {
    const {currentLanguage, setLanguage} = useI18n();

    return (): VNode =>
      h(
        BaseLanguageSwitcher,
        {
          class: withVendorCSSClassPrefix('language-switcher--styled'),
          className: props.className,
          currentLanguage: currentLanguage?.value ?? 'en',
          languages: props.languages,
          onLanguageChange: setLanguage,
        },
        slots,
      );
  },
});

export default LanguageSwitcher;
