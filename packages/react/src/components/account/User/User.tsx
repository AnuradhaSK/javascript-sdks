// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {User as IUser} from '@thunderid/browser';
import {FC, ReactElement, ReactNode} from 'react';
import BaseUser, {BaseUserProps} from './BaseUser';
import useThunderID from '../../../contexts/ThunderID/useThunderID';

/**
 * Props for the User component.
 * Extends BaseUserProps but makes the user prop optional since it will be obtained from useThunderID
 */
export interface UserProps extends Omit<BaseUserProps, 'user'> {
  /**
   * Render prop that takes the user object and returns a ReactNode.
   * @param user - The authenticated user object from ThunderID.
   * @returns A ReactNode to render.
   */
  children: (user: IUser | null) => ReactNode;

  /**
   * Optional element to render when no user is signed in.
   */
  fallback?: ReactNode;
}

/**
 * A component that uses render props to expose the authenticated user object.
 * This component automatically retrieves the user from ThunderID context.
 *
 * @remarks This component is only supported in browser based React applications (CSR).
 *
 * @example
 * ```tsx
 * import { IUser } from '@thunderid/auth-react';
 *
 * const App = () => {
 *   return (
 *     <User fallback={<p>Please sign in</p>}>
 *       {(user) => (
 *         <div>
 *           <h1>Welcome, {user.displayName}!</h1>
 *           <p>Email: {user.email}</p>
 *         </div>
 *       )}
 *     </User>
 *   );
 * }
 * ```
 */
const User: FC<UserProps> = ({children, fallback = null}: UserProps): ReactElement => {
  const {user} = useThunderID();

  return (
    <BaseUser user={user} fallback={fallback}>
      {children}
    </BaseUser>
  );
};

User.displayName = 'User';

export default User;
