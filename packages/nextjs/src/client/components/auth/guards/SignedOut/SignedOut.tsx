// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {FC, PropsWithChildren, ReactNode} from 'react';
import useThunderID from '../../../../contexts/ThunderID/useThunderID';

/**
 * Props interface of {@link SignedOut}
 */
export interface SignedOutProps {
  /**
   * Content to show when the user is not signed-out.
   */
  fallback?: ReactNode;
}

/**
 * A component that only renders its children when the user is signed out.
 *
 * @example
 * ```tsx
 * import { SignedOut } from '@thunderid/auth-next';
 *
 * const App = () => {
 *   return (
 *     <SignedOut fallback={<p>Please sign out to continue</p>}>
 *       <p>Welcome! You are signed out.</p>
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

  return <>{!isSignedIn ? children : fallback}</>;
};

export default SignedOut;
