// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {FC, PropsWithChildren, ReactNode} from 'react';
import useThunderID from '../../../../contexts/ThunderID/useThunderID';

/**
 * Props interface of {@link SignedIn}
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
 * @example
 * ```tsx
 * import { SignedIn } from '@thunderid/auth-next';
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

  return <>{isSignedIn ? children : fallback}</>;
};

export default SignedIn;
