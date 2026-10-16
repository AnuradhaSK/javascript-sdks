// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {ThunderIDRuntimeError, EmbeddedFlowType} from '@thunderid/node';
import {BaseSignUp, BaseSignUpProps} from '@thunderid/react';
import {FC} from 'react';
import useThunderID from '../../../contexts/ThunderID/useThunderID';

/**
 * Props for the SignUp component.
 */
export type SignUpProps = BaseSignUpProps;

/**
 * A styled SignUp component that provides embedded sign-up flow with pre-built styling.
 * This component handles the API calls for sign-up and delegates UI logic to BaseSignUp.
 *
 * @example
 * ```tsx
 * import { SignUp } from '@thunderid/react';
 *
 * const App = () => {
 *   return (
 *     <SignUp
 *       onSuccess={(response) => {
 *         console.log('Sign-up successful:', response);
 *         // Handle successful sign-up (e.g., redirect, show confirmation)
 *       }}
 *       onError={(error) => {
 *         console.error('Sign-up failed:', error);
 *       }}
 *       onComplete={(redirectUrl) => {
 *         // Platform-specific redirect handling (e.g., Next.js router.push)
 *         router.push(redirectUrl); // or window.location.href = redirectUrl
 *       }}
 *       size="medium"
 *       variant="outlined"
 *       afterSignUpUrl="/welcome"
 *     />
 *   );
 * };
 * ```
 */
const SignUp: FC<SignUpProps> = ({
  className,
  size = 'medium',
  variant = 'outlined',
  afterSignUpUrl,
  onError,
  children,
}: SignUpProps) => {
  const {signUp, applicationId: contextApplicationId, scopes} = useThunderID();

  /**
   * Initialize the sign-up flow.
   */
  const handleInitialize = async (payload?: any): Promise<any> => {
    if (!signUp) {
      throw new ThunderIDRuntimeError(
        '`signUp` function is not available.',
        'SignUp-handleInitialize-RuntimeError-001',
        'nextjs',
      );
    }

    return (await signUp({
      flowType: EmbeddedFlowType.Registration,
      ...(contextApplicationId && {applicationId: contextApplicationId}),
      ...(scopes && {scopes}),
      ...payload,
    })) as unknown as Promise<any>;
  };

  /**
   * Handle sign-up steps.
   */
  const handleOnSubmit = async (payload: any): Promise<any> => {
    if (!signUp) {
      throw new ThunderIDRuntimeError(
        '`signUp` function is not available.',
        'SignUp-handleOnSubmit-RuntimeError-001',
        'nextjs',
      );
    }

    return (await signUp(payload)) as unknown as Promise<any>;
  };

  return (
    <BaseSignUp
      afterSignUpUrl={afterSignUpUrl}
      onInitialize={handleInitialize}
      onSubmit={handleOnSubmit}
      onError={onError}
      className={className}
      size={size}
      variant={variant}
      isInitialized={true}
    >
      {children}
    </BaseSignUp>
  );
};

export default SignUp;
