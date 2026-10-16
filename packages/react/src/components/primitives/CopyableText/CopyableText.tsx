// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {copyTextToClipboard} from '@thunderid/browser';
import {FC, ReactElement, useCallback, useState} from 'react';
import useStyles from './CopyableText.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import Button from '../Button/Button';
import Check from '../Icons/Check';
import Copy from '../Icons/Copy';
import PasswordField from '../PasswordField/PasswordField';

export interface CopyableTextProps {
  /**
   * Optional label displayed above the value box.
   */
  label?: string;
  /**
   * Hides the value in a read-only password field until the user chooses to show it, as for a secret. Copying always
   * copies the real value.
   */
  masked?: boolean;
  /**
   * The text value to display and copy.
   */
  value: string;
}

const ignoreChange = (): void => undefined;

/**
 * A React component that displays a text value with an optional label and a button to copy the value to
 * the clipboard. When the button is clicked, it attempts to copy the value using the Clipboard API, and
 * falls back to a textarea method if the API is not supported.
 * After copying, it shows a "Copied!" message for 3 seconds before resetting.
 *
 * The copy control is an icon button inside the box in both layouts. With `masked`, the value sits in a read-only
 * password field with the same show and hide control as `PasswordField`. A browser does not copy out of a password
 * field, which is why copying is a button of its own.
 */
const CopyableText: FC<CopyableTextProps> = ({label, masked = false, value}: CopyableTextProps): ReactElement => {
  const {theme} = useTheme();
  const styles: Record<string, string> = useStyles(theme);
  const {t} = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy: ReturnType<typeof useCallback> = useCallback(async (): Promise<void> => {
    await copyTextToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, [value]);

  const copyLabel: string = copied
    ? t('elements.display.copyable_text.copied')
    : t('elements.display.copyable_text.copy');

  const copyButton: ReactElement = (
    <Button
      variant="icon"
      size="small"
      className={styles['copyButton']}
      aria-label={copyLabel}
      title={copyLabel}
      onClick={() => {
        handleCopy().catch(() => undefined);
      }}
    >
      {copied ? <Check width={16} height={16} /> : <Copy width={16} height={16} />}
    </Button>
  );

  return (
    <div className={styles['container']}>
      {label && <span className={styles['label']}>{label}</span>}
      {masked ? (
        <PasswordField
          aria-label={label}
          autoComplete="off"
          endAdornment={copyButton}
          hideLabel={t('elements.display.copyable_text.hide')}
          onChange={ignoreChange}
          readOnly
          showLabel={t('elements.display.copyable_text.show')}
          value={value}
        />
      ) : (
        <div className={styles['valueBox']}>
          <span className={styles['valueText']}>{value}</span>
          {copyButton}
        </div>
      )}
    </div>
  );
};

export default CopyableText;
