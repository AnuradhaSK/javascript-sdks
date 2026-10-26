// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {WithPreferences} from '@thunderid/browser';
import {FC, HTMLAttributes} from 'react';
import useTranslation from '../../../hooks/useTranslation';
import Button from '../../primitives/Button/Button';

export interface FacebookButtonProps extends WithPreferences {
  /**
   * Whether the component is in loading state.
   */
  isLoading?: boolean;
}

/**
 * Facebook Sign-In Button Component.
 * Handles authentication with Facebook identity provider.
 */
const FacebookButton: FC<FacebookButtonProps & HTMLAttributes<HTMLButtonElement>> = ({
  isLoading,
  preferences,
  children,
  ...rest
}: FacebookButtonProps & HTMLAttributes<HTMLButtonElement>) => {
  const {t} = useTranslation(preferences?.i18n);

  return (
    <Button
      {...rest}
      fullWidth
      type="button"
      color="primary"
      variant="solid"
      disabled={isLoading}
      startIcon={
        <svg width="18" height="18" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#1976D2"
            d="M448,0H64C28.704,0,0,28.704,0,64v384c0,35.296,28.704,64,64,64h384c35.296,0,64-28.704,64-64V64C512,28.704,483.296,0,448,0z"
          />
          <path
            fill="#FAFAFA"
            d="M432,256h-80v-64c0-17.664,14.336-16,32-16h32V96h-64l0,0c-53.024,0-96,42.976-96,96v64h-64v80h64v176h96V336h48L432,256z"
          />
        </svg>
      }
    >
      {children ?? t('elements.buttons.facebook.text')}
    </Button>
  );
};

export default FacebookButton;
