// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDRuntimeError, navigate} from '@thunderid/browser';
import {forwardRef, ForwardRefExoticComponent, MouseEvent, ReactElement, Ref, RefAttributes, useState} from 'react';
import BaseSignUpButton, {BaseSignUpButtonProps} from './BaseSignUpButton';
import useThunderID from '../../../../contexts/ThunderID/useThunderID';
import useTranslation from '../../../../hooks/useTranslation';

/**
 * Props interface of {@link SignUpButton}
 */
export type SignUpButtonProps = BaseSignUpButtonProps;

/**
 * SignUpButton component that supports both render props and traditional props patterns.
 * It redirects the user to the ThunderID sign-up page configured for the application.
 *
 * @remarks This component is only supported in browser based React applications (CSR).
 *
 * @example Using render props pattern
 * ```tsx
 * <SignUpButton>
 *   {({ signUp, isLoading }) => (
 *     <button onClick={signUp} disabled={isLoading}>
 *       {isLoading ? 'Creating Account...' : 'Create Account'}
 *     </button>
 *   )}
 * </SignUpButton>
 * ```
 *
 * @example Using traditional props pattern
 * ```tsx
 * <SignUpButton className="custom-button">Create Account</SignUpButton>
 * ```
 *
 * @example Using component-level preferences
 * ```tsx
 * <SignUpButton
 *   preferences={{
 *     i18n: {
 *       bundles: {
 *         'en-US': {
 *           translations: {
 *             'buttons.signUp': 'Custom Sign Up Text'
 *           }
 *         }
 *       }
 *     }
 *   }}
 * >
 *   Custom Sign Up
 * </SignUpButton>
 * ```
 */
const SignUpButton: ForwardRefExoticComponent<SignUpButtonProps & RefAttributes<HTMLButtonElement>> = forwardRef<
  HTMLButtonElement,
  SignUpButtonProps
>(({children, onClick, preferences, ...rest}: SignUpButtonProps, ref: Ref<HTMLButtonElement>): ReactElement => {
  const {signUp, signUpUrl, meta} = useThunderID();
  const {t} = useTranslation(preferences?.i18n);

  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e?: MouseEvent<HTMLButtonElement>): Promise<void> => {
    try {
      setIsLoading(true);

      // If a custom `signUpUrl` is provided, use it for navigation.
      if (signUpUrl) {
        navigate(signUpUrl);
      } else {
        await signUp();
      }

      if (onClick) {
        onClick(e!);
      }
    } catch (error) {
      throw new ThunderIDRuntimeError(
        `Sign up failed: ${error instanceof Error ? error.message : String(error)}`,
        'SignUpButton-handleSignUp-RuntimeError-001',
        'react',
        'Something went wrong while trying to sign up. Please try again later.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseSignUpButton
      ref={ref}
      onClick={handleSignUp}
      isLoading={isLoading}
      meta={meta}
      signUp={handleSignUp}
      preferences={preferences}
      {...rest}
    >
      {children ?? t('elements.buttons.signup.text')}
    </BaseSignUpButton>
  );
});

SignUpButton.displayName = 'SignUpButton';

export default SignUpButton;
