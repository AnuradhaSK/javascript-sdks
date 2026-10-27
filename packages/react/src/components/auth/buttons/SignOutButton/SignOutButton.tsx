// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDRuntimeError} from '@thunderid/browser';
import {forwardRef, ForwardRefExoticComponent, MouseEvent, ReactElement, Ref, RefAttributes, useState} from 'react';
import BaseSignOutButton, {BaseSignOutButtonProps} from './BaseSignOutButton';
import useThunderID from '../../../../contexts/ThunderID/useThunderID';
import useTranslation from '../../../../hooks/useTranslation';

/**
 * Props interface of {@link SignOutButton}
 */
export type SignOutButtonProps = BaseSignOutButtonProps;

/**
 * SignOutButton component that supports both render props and traditional props patterns.
 *
 * @remarks This component is only supported in browser based React applications (CSR).
 *
 * @example Using render props pattern
 * ```tsx
 * <SignOutButton>
 *   {({signOut, isLoading}) => (
 *     <button onClick={signOut} disabled={isLoading}>
 *       {isLoading ? 'Signing out...' : 'Sign Out'}
 *     </button>
 *   )}
 * </SignOutButton>
 * ```
 *
 * @example Using traditional props pattern
 * ```tsx
 * <SignOutButton className="custom-button">Sign Out</SignOutButton>
 * ```
 *
 * @example Using component-level preferences
 * ```tsx
 * <SignOutButton
 *   preferences={{
 *     i18n: {
 *       bundles: {
 *         'en-US': {
 *           translations: {
 *             'buttons.signOut': 'Custom Sign Out Text'
 *           }
 *         }
 *       }
 *     }
 *   }}
 * >
 *   Custom Sign Out
 * </SignOutButton>
 * ```
 */
const SignOutButton: ForwardRefExoticComponent<SignOutButtonProps & RefAttributes<HTMLButtonElement>> = forwardRef<
  HTMLButtonElement,
  SignOutButtonProps
>(({children, onClick, preferences, ...rest}: SignOutButtonProps, ref: Ref<HTMLButtonElement>): ReactElement => {
  const {signOut, meta} = useThunderID();
  const {t} = useTranslation(preferences?.i18n);

  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async (e?: MouseEvent<HTMLButtonElement>): Promise<void> => {
    try {
      setIsLoading(true);

      await signOut();

      if (onClick) {
        onClick(e!);
      }
    } catch (error) {
      throw new ThunderIDRuntimeError(
        `Sign out failed: ${error instanceof Error ? error.message : String(error)}`,
        'SignOutButton-handleSignOut-RuntimeError-001',
        'react',
        'Something went wrong while trying to sign out. Please try again later.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseSignOutButton
      ref={ref}
      onClick={handleSignOut}
      isLoading={isLoading}
      meta={meta}
      signOut={handleSignOut}
      preferences={preferences}
      {...rest}
    >
      {children ?? t('elements.buttons.signout.text')}
    </BaseSignOutButton>
  );
});

SignOutButton.displayName = 'SignOutButton';

export default SignOutButton;
