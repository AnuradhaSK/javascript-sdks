// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {FC, PropsWithChildren, ReactNode} from 'react';
import useThunderID from '../../../contexts/ThunderID/useThunderID';

/**
 * Props for the SignedOut component.
 */
export interface SignedOutProps {
  /**
   * Content to show when the user is signed in.
   */
  fallback?: ReactNode;
}

/**
 * A component that only renders its children when the user is signed out.
 *
 * @remarks This component is only supported in browser based React applications (CSR).
 *
 * @example
 * ```tsx
 * import { SignedOut } from '@thunderid/auth-react';
 *
 * const App = () => {
 *   return (
 *     <SignedOut fallback={<p>You are already signed in</p>}>
 *       <p>Please sign in to continue</p>
 *     </SignedOut>
 *   );
 * }
 * ```
 */
const SignedOut: FC<PropsWithChildren<SignedOutProps>> = ({
  children,
  fallback = null,
}: PropsWithChildren<SignedOutProps>) => {
  const {isSignedIn} = useThunderID();

  if (!isSignedIn) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

SignedOut.displayName = 'SignedOut';

export default SignedOut;
