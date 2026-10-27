// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {User} from '@thunderid/browser';
import {FC, JSX} from 'react';
import useThunderID from '../../../contexts/ThunderID/useThunderID';
import BaseUserAvatar, {BaseUserAvatarProps} from './BaseUserAvatar';

export interface UserAvatarProps extends Omit<BaseUserAvatarProps, 'user'> {
  /**
   * Override the user to render. When omitted the signed-in user from
   * ThunderID context is used automatically.
   */
  user?: User | null;
}

/**
 * Context-aware avatar component. Renders an avatar for the currently
 * signed-in user without requiring an explicit `user` prop.
 *
 * Derives the profile picture and initials from the user's token claims,
 * with graceful fallback to generated initials when no image is available.
 *
 * @example
 * ```tsx
 * // Auto-reads from context
 * <UserAvatar size={48} />
 *
 * // Override with a specific user
 * <UserAvatar user={someUser} size={32} />
 * ```
 */
const UserAvatar: FC<UserAvatarProps> = ({user: userProp, ...rest}: UserAvatarProps): JSX.Element => {
  const {user} = useThunderID();
  return <BaseUserAvatar user={userProp ?? user} {...rest} />;
};

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
