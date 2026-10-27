// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {FC, PropsWithChildren, ReactNode} from 'react';
import useThunderID from '../../../contexts/ThunderID/useThunderID';

/**
 * Props for the SignedIn component.
 */
export interface SignedInProps {
  /**
   * Content to show when the user is not signed in.
   */
  fallback?: ReactNode;
}

/**
 * A component that only renders its children when the user is signed in.
 *
 * @remarks This component is only supported in browser based React applications (CSR).
 *
 * @example
 * ```tsx
 * import { SignedIn } from '@thunderid/auth-react';
 *
 * const App = () => {
 *   return (
 *     <SignedIn fallback={<p>Please sign in to continue</p>}>
 *       <p>Welcome! You are signed in.</p>
 *     </SignedIn>
 *   );
 * }
 * ```
 */
const SignedIn: FC<PropsWithChildren<SignedInProps>> = ({
  children,
  fallback = null,
}: PropsWithChildren<SignedInProps>) => {
  const {isSignedIn} = useThunderID();

  if (!isSignedIn) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

SignedIn.displayName = 'SignedIn';

export default SignedIn;
