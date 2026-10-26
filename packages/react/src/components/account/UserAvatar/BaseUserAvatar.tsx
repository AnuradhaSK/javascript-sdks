// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {pickAnonymousAvatarName, User} from '@thunderid/browser';
import {FC, JSX, useMemo} from 'react';
import {Avatar} from '../../primitives/Avatar/Avatar';

export interface BaseUserAvatarProps {
  /**
   * Seed used to deterministically pick the anonymous avatar shown when `user` is `null`
   * (e.g. a session or device identifier, so the same anonymous session keeps the same
   * avatar across renders). Falls back to a random pick when omitted.
   */
  anonymousAvatarSeed?: string;
  /**
   * Optional CSS class name for the avatar container.
   */
  className?: string;
  /**
   * Size of the avatar in pixels.
   * @default 40
   */
  size?: number;
  /**
   * The user object. When provided, the avatar derives the image URL and
   * initials from the user's profile fields automatically. When `null`, a
   * curated anonymous avatar is shown instead.
   */
  user: User | null;
}

/**
 * Resolves the profile picture URL from common user claim fields.
 */
const resolvePicture = (user: User): string | undefined => {
  for (const key of ['picture', 'profileUrl', 'profile', 'URL', 'avatarUrl', 'avatar']) {
    const val: unknown = user[key];
    if (typeof val === 'string' && val) return val;
  }
  return undefined;
};

/**
 * Resolves a display name suitable for generating avatar initials.
 */
const resolveName = (user: User): string | undefined => {
  const given: string = user['givenName'] || user['given_name'] || '';
  const family: string = user['familyName'] || user['family_name'] || '';
  if (given && family) return `${given} ${family}`;

  return user['displayName'] || user['name'] || given || user['username'] || user['email'] || undefined;
};

/**
 * Base `UserAvatar` component. Renders an avatar derived from a user object
 * without any context dependency — pass the `user` prop explicitly.
 *
 * For the context-aware version that reads the signed-in user automatically,
 * use `UserAvatar`.
 *
 * @example
 * ```tsx
 * <BaseUserAvatar user={user} size={48} />
 * <BaseUserAvatar user={null} anonymousAvatarSeed={sessionId} size={48} />
 * ```
 */
const BaseUserAvatar: FC<BaseUserAvatarProps> = ({
  user,
  size = 40,
  className,
  anonymousAvatarSeed = undefined,
}: BaseUserAvatarProps): JSX.Element => {
  const imageUrl: string | undefined = useMemo(() => {
    if (user) return resolvePicture(user);
    return `avatar:variant=anonymous_animal,content=${pickAnonymousAvatarName(anonymousAvatarSeed)}`;
  }, [user, anonymousAvatarSeed]);
  const name: string | undefined = user ? resolveName(user) : undefined;

  return <Avatar imageUrl={imageUrl} name={name} size={size} className={className} />;
};

BaseUserAvatar.displayName = 'BaseUserAvatar';

export default BaseUserAvatar;
