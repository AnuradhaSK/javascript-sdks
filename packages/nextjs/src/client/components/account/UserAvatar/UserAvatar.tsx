// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {BaseUserAvatar, BaseUserAvatarProps} from '@thunderid/react';
import {FC, ReactElement} from 'react';
import useThunderID from '../../../contexts/ThunderID/useThunderID';

export type UserAvatarProps = Omit<BaseUserAvatarProps, 'user'>;

/**
 * UserAvatar component renders an avatar for the currently signed-in user.
 * This component is the Next.js-specific implementation that uses BaseUserAvatar
 * and automatically retrieves the user data from ThunderID context.
 *
 * @example
 * ```tsx
 * <UserAvatar size={48} />
 * ```
 */
const UserAvatar: FC<UserAvatarProps> = (props: UserAvatarProps): ReactElement => {
  const {user} = useThunderID();

  return <BaseUserAvatar user={user} {...props} />;
};

export default UserAvatar;
