// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {FlowMetadataResponse, WithPreferences, withVendorCSSClassPrefix} from '@thunderid/browser';
import {
  forwardRef,
  ForwardRefExoticComponent,
  ButtonHTMLAttributes,
  ReactElement,
  ReactNode,
  Ref,
  RefAttributes,
} from 'react';
import {cx} from '../../../../styles/emotion';
import Button from '../../../primitives/Button/Button';

/**
 * Common props shared by all {@link BaseSignOutButton} components.
 */
export interface CommonBaseSignOutButtonProps {
  /**
   * Loading state during sign-out process
   */
  isLoading?: boolean;
  /**
   * Flow metadata returned by the platform (v2 only). `null` while loading or unavailable.
   */
  meta?: FlowMetadataResponse | null;
  /**
   * Function to initiate the sign-out process
   */
  signOut: () => Promise<void>;
}

/**
 * Props passed to the render function of {@link BaseSignOutButton}
 */
export type BaseSignOutButtonRenderProps = CommonBaseSignOutButtonProps;

/**
 * Props interface of {@link BaseSignOutButton}
 */
export interface BaseSignOutButtonProps
  extends Partial<CommonBaseSignOutButtonProps>,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    WithPreferences {
  /**
   * Render prop function that receives sign-out props, or traditional ReactNode children
   */
  children?: ((props: BaseSignOutButtonRenderProps) => ReactNode) | ReactNode;
}

/**
 * Base SignOutButton component that supports both render props and traditional props patterns.
 *
 * @example Using render props
 * ```tsx
 * <BaseSignOutButton>
 *   {({signOut, isLoading}) => (
 *     <button onClick={signOut} disabled={isLoading}>
 *       {isLoading ? 'Signing out...' : 'Sign Out'}
 *     </button>
 *   )}
 * </BaseSignOutButton>
 * ```
 *
 * @example Using traditional props
 * ```tsx
 * <BaseSignOutButton className="custom-button">Sign Out</BaseSignOutButton>
 * ```
 */
const BaseSignOutButton: ForwardRefExoticComponent<BaseSignOutButtonProps & RefAttributes<HTMLButtonElement>> =
  forwardRef<HTMLButtonElement, BaseSignOutButtonProps>(
    (
      {children, className, style, signOut, isLoading, meta, preferences, ...rest}: BaseSignOutButtonProps,
      ref: Ref<HTMLButtonElement>,
    ): ReactElement => {
      if (typeof children === 'function') {
        return <>{children({isLoading, meta, signOut: signOut!})}</>;
      }

      return (
        <Button
          ref={ref}
          className={cx(withVendorCSSClassPrefix('sign-out-button'), className)}
          style={style}
          disabled={isLoading}
          loading={isLoading}
          type="button"
          {...rest}
        >
          {children}
        </Button>
      );
    },
  );

BaseSignOutButton.displayName = 'BaseSignOutButton';

export default BaseSignOutButton;
