// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {WithPreferences} from '@thunderid/browser';
import {FC, HTMLAttributes} from 'react';
import useTranslation from '../../../hooks/useTranslation';
import Button from '../../primitives/Button/Button';

export interface MicrosoftButtonProps extends WithPreferences {
  /**
   * Whether the component is in loading state.
   */
  isLoading?: boolean;
}

/**
 * Microsoft Sign-In Button Component.
 * Handles authentication with Microsoft identity provider.
 */
const MicrosoftButton: FC<MicrosoftButtonProps & HTMLAttributes<HTMLButtonElement>> = ({
  isLoading,
  preferences,
  children,
  ...rest
}: MicrosoftButtonProps & HTMLAttributes<HTMLButtonElement>) => {
  const {t} = useTranslation(preferences?.i18n);

  return (
    <Button
      {...rest}
      fullWidth
      type="button"
      color="secondary"
      variant="solid"
      disabled={isLoading}
      startIcon={
        <svg width="14" height="14" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
          <path fill="#f3f3f3" d="M0 0h23v23H0z" />
          <path fill="#f35325" d="M1 1h10v10H1z" />
          <path fill="#81bc06" d="M12 1h10v10H12z" />
          <path fill="#05a6f0" d="M1 12h10v10H1z" />
          <path fill="#ffba08" d="M12 12h10v10H12z" />
        </svg>
      }
    >
      {children ?? t('elements.buttons.microsoft.text')}
    </Button>
  );
};

export default MicrosoftButton;
