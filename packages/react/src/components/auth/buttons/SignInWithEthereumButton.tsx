// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {WithPreferences} from '@thunderid/browser';
import {FC, HTMLAttributes} from 'react';
import useTranslation from '../../../hooks/useTranslation';
import Button from '../../primitives/Button/Button';

export interface SignInWithEthereumButtonProps extends WithPreferences {
  /**
   * Whether the component is in loading state.
   */
  isLoading?: boolean;
}

/**
 * Sign In With Ethereum Button Component.
 * Handles authentication with Sign In With Ethereum identity provider.
 */
const SignInWithEthereumButton: FC<SignInWithEthereumButtonProps & HTMLAttributes<HTMLButtonElement>> = ({
  isLoading,
  preferences,
  children,
  ...rest
}: SignInWithEthereumButtonProps & HTMLAttributes<HTMLButtonElement>) => {
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
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#627EEA"
            d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
          />
        </svg>
      }
    >
      {children ?? t('elements.buttons.ethereum.text')}
    </Button>
  );
};

export default SignInWithEthereumButton;
