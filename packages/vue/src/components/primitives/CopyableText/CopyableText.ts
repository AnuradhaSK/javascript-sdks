// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {copyTextToClipboard, withVendorCSSClassPrefix} from '@thunderid/browser';
import {type Component, type SetupContext, type VNode, defineComponent, h, ref, type Ref} from 'vue';
import useI18n from '../../../composables/useI18n';
import Button from '../Button';
import {CheckIcon, CopyIcon} from '../Icons';
import PasswordField from '../PasswordField';

type CopyableTextProps = Readonly<{
  label: string;
  masked: boolean;
  value: string;
}>;

/**
 * Shows a text value with an optional label and a button that copies it to the clipboard. It uses the Clipboard
 * API and falls back to a textarea when that is not available, then shows "Copied!" for 3 seconds. With `masked`
 * the value sits in a read-only password field with the same show and hide control as `PasswordField`, and copying
 * always copies the real value. The copy control is an icon button inside the box in both layouts. A browser does
 * not copy out of a password field, which is why copying is a button of its own. Vue counterpart of the React
 * `CopyableText`.
 */
const CopyableText: Component = defineComponent({
  name: 'CopyableText',
  props: {
    /** Optional label shown above the value box. */
    label: {default: '', type: String},
    /** Hides the value in a read-only password field until the user chooses to show it, as for a secret. */
    masked: {default: false, type: Boolean},
    /** The text to display and copy. */
    value: {required: true, type: String},
  },
  setup(props: CopyableTextProps, {attrs}: SetupContext): () => VNode {
    const {t} = useI18n();
    const copied: Ref<boolean> = ref(false);

    const handleCopy = async (): Promise<void> => {
      await copyTextToClipboard(props.value);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 3000);
    };

    return (): VNode => {
      const rootClass: string = [withVendorCSSClassPrefix('copyable-text'), (attrs.class as string) || '']
        .filter(Boolean)
        .join(' ');

      const copyLabel: string = copied.value
        ? t('elements.display.copyable_text.copied')
        : t('elements.display.copyable_text.copy');

      const copyButton: VNode = h(
        Button,
        {
          'aria-label': copyLabel,
          class: withVendorCSSClassPrefix('copyable-text__copy'),
          onClick: () => {
            handleCopy().catch(() => undefined);
          },
          size: 'small',
          title: copyLabel,
          variant: 'ghost',
        },
        () => (copied.value ? CheckIcon() : CopyIcon()),
      );

      return h('div', {class: rootClass, style: attrs.style}, [
        props.label ? h('span', {class: withVendorCSSClassPrefix('copyable-text__label')}, props.label) : null,
        props.masked
          ? h(
              PasswordField,
              {
                ariaLabel: props.label || undefined,
                autocomplete: 'off',
                hideLabel: t('elements.display.copyable_text.hide'),
                modelValue: props.value,
                readonly: true,
                showLabel: t('elements.display.copyable_text.show'),
              },
              {append: () => copyButton},
            )
          : h('div', {class: withVendorCSSClassPrefix('copyable-text__box')}, [
              h('span', {class: withVendorCSSClassPrefix('copyable-text__value')}, props.value),
              copyButton,
            ]),
      ]);
    };
  },
});

export default CopyableText;
