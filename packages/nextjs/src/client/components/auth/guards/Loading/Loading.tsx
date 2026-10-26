// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {FC, PropsWithChildren, ReactNode} from 'react';
import useThunderID from '../../../../contexts/ThunderID/useThunderID';

/**
 * Props for the Loading component.
 */
export interface LoadingProps {
  /**
   * Content to show when the user is not signed in.
   */
  fallback?: ReactNode;
}

/**
 * A component that only renders its children when the ThunderID is loading.
 *
 * @remarks This component is only supported in browser based React applications (CSR).
 *
 * @example
 * ```tsx
 * import { Loading } from '@thunderid/auth-react';
 *
 * const App = () => {
 *   return (
 *     <Loading fallback={<p>Finished Loading...</p>}>
 *       <p>Loading...</p>
 *     </Loading>
 *   );
 * }
 * ```
 */
const Loading: FC<PropsWithChildren<LoadingProps>> = ({children, fallback = null}: PropsWithChildren<LoadingProps>) => {
  const {isLoading} = useThunderID();

  if (!isLoading) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

Loading.displayName = 'Loading';

export default Loading;
