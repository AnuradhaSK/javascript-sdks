// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {User as IUser} from '@thunderid/browser';
import {FC, ReactElement, ReactNode} from 'react';

/**
 * Props for the BaseUser component.
 */
export interface BaseUserProps {
  /**
   * Render prop that takes the user object and returns a ReactNode.
   * @param user - The authenticated user object from ThunderID.
   * @returns A ReactNode to render.
   */
  children: (user: IUser | null) => ReactNode;

  /**
   * Optional element to render when no user is provided.
   */
  fallback?: ReactNode;

  /**
   * The user object to display. If not provided, the component will render the fallback.
   */
  user: IUser | null;
}

/**
 * Base User component that provides the core functionality for displaying user information.
 * This component takes a user object as a prop and uses render props to expose it.
 *
 * @remarks This is the base component that can be used in any context where you have
 * a user object available. For React applications, use the User component which
 * automatically retrieves the user from ThunderID context.
 *
 * @example
 * ```tsx
 * import { BaseUser } from '@thunderid/auth-react';
 *
 * const MyComponent = ({ user }) => {
 *   return (
 *     <BaseUser user={user} fallback={<p>No user data</p>}>
 *       {(user) => (
 *         <div>
 *           <h1>Welcome, {user.displayName}!</h1>
 *           <p>Email: {user.email}</p>
 *         </div>
 *       )}
 *     </BaseUser>
 *   );
 * }
 * ```
 */
const BaseUser: FC<BaseUserProps> = ({user, children, fallback = null}: BaseUserProps): ReactElement => {
  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children(user)}</>;
};

BaseUser.displayName = 'BaseUser';

export default BaseUser;
