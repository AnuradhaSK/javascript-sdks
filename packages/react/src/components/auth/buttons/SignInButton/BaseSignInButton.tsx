// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {FlowMetadataResponse, WithPreferences, withVendorCSSClassPrefix} from '@thunderid/browser';
import {
  ButtonHTMLAttributes,
  forwardRef,
  ForwardRefExoticComponent,
  ReactElement,
  ReactNode,
  Ref,
  RefAttributes,
} from 'react';
import {cx} from '../../../../styles/emotion';
import Button from '../../../primitives/Button/Button';

/**
 * Common props shared by all {@link BaseSignInButton} components.
 */
export interface CommonBaseSignInButtonProps {
  /**
   * Loading state during sign-in process
   */
  isLoading?: boolean;
  /**
   * Flow metadata returned by the platform (v2 only). `null` while loading or unavailable.
   */
  meta?: FlowMetadataResponse | null;
  /**
   * Function to initiate the sign-in process
   */
  signIn: () => Promise<void>;
}

/**
 * Props passed to the render function of {@link BaseSignInButton}
 */
export type BaseSignInButtonRenderProps = CommonBaseSignInButtonProps;

/**
 * Props interface of {@link BaseSignInButton}
 */
export interface BaseSignInButtonProps
  extends Partial<CommonBaseSignInButtonProps>,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    WithPreferences {
  /**
   * Render prop function that receives sign-in props, or traditional ReactNode children
   */
  children?: ((props: BaseSignInButtonRenderProps) => ReactNode) | ReactNode;
}

/**
 * Base SignInButton component that supports both render props and traditional props patterns.
 *
 * @example Using render props
 * ```tsx
 * <BaseSignInButton>
 *   {({signIn, isLoading}) => (
 *     <button onClick={signIn} disabled={isLoading}>
 *       {isLoading ? 'Signing in...' : 'Sign In'}
 *     </button>
 *   )}
 * </BaseSignInButton>
 * ```
 *
 * @example Using traditional props
 * ```tsx
 * <BaseSignInButton className="custom-button">Sign In</BaseSignInButton>
 * ```
 */
const BaseSignInButton: ForwardRefExoticComponent<BaseSignInButtonProps & RefAttributes<HTMLButtonElement>> =
  forwardRef<HTMLButtonElement, BaseSignInButtonProps>(
    (
      {children, className, style, signIn, isLoading, meta, preferences, ...rest}: BaseSignInButtonProps,
      ref: Ref<HTMLButtonElement>,
    ): ReactElement => {
      if (typeof children === 'function') {
        return <>{children({isLoading, meta, signIn: signIn!})}</>;
      }

      return (
        <Button
          ref={ref}
          className={cx(withVendorCSSClassPrefix('sign-in-button'), className)}
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

BaseSignInButton.displayName = 'BaseSignInButton';

export default BaseSignInButton;
