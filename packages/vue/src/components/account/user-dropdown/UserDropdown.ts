// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix} from '@thunderid/browser';
import {type Component, type PropType, type Ref, type VNode, defineComponent, h, ref} from 'vue';
import BaseUserDropdown, {type DropdownMenuItem} from './BaseUserDropdown';
import useThunderID from '../../../composables/useThunderID';
import UserProfileComponent from '../user-profile/UserProfile';

/**
 * UserDropdown — avatar button that opens a user identity menu.
 *
 * @example Default usage
 * ```vue
 * <UserDropdown />
 * ```
 *
 * @example With custom menu items and a separator
 * ```vue
 * <UserDropdown
 *   :menu-items="[
 *     { label: 'Settings', icon: h(SettingsIcon, { size: 15 }), onClick: goToSettings },
 *     { label: 'Help',     onClick: openHelp, separatorBefore: true },
 *   ]"
 * />
 * ```
 *
 * @example Small, left-aligned, no chevron
 * ```vue
 * <UserDropdown size="sm" menu-align="left" />
 * ```
 */
const UserDropdown: Component = defineComponent({
  name: 'UserDropdown',
  props: {
    /** Extra CSS class added to the root element. */
    className: {default: '', type: String},
    /**
     * How to align the dropdown panel relative to the trigger button.
     * - `'auto'` (default) — picks the side with more available viewport space at open time.
     * - `'left'` — panel left edge aligns with trigger left edge.
     * - `'right'` — panel right edge aligns with trigger right edge.
     */
    menuAlign: {
      default: 'auto',
      type: String as PropType<'auto' | 'left' | 'right'>,
    },
    /**
     * Extra items inserted between the Profile link and Sign Out.
     * Set `separatorBefore: true` on any item to add a divider line before it.
     * Set `danger: true` for destructive actions (red styling).
     * Pass an `icon` VNode to render an icon to the left of the label.
     */
    menuItems: {
      default: undefined,
      type: Array as PropType<DropdownMenuItem[]>,
    },
    /**
     * Called instead of opening the built-in profile popup when the profile menu item is
     * clicked. Use this when the app has its own account page to navigate to.
     *
     * @example
     * ```vue
     * <UserDropdown profile-label="Manage Account" :on-manage-profile="() => router.push('/account')" />
     * ```
     */
    onManageProfile: {default: undefined, type: Function as PropType<() => void>},
    /**
     * Label for the "Profile" menu item. Defaults to `'Profile'`; set this alongside
     * `onManageProfile` when redirecting to a custom account page instead of the built-in
     * profile popup.
     */
    profileLabel: {default: undefined, type: String},
    /** Whether to show the animated down-chevron beside the avatar. Default `false`. */
    showChevron: {default: false, type: Boolean},
    /**
     * Overall density / avatar size of the component.
     * - `'sm'` — 28 px avatar, compact menu (180 px min-width).
     * - `'md'` (default) — 32 px avatar, standard menu (220 px min-width).
     * - `'lg'` — 38 px avatar, spacious menu (280 px min-width).
     */
    size: {
      default: 'md',
      type: String as PropType<'sm' | 'md' | 'lg'>,
    },
    /** Show the user's display name as text beside the trigger avatar. Default `false`. */
    showTriggerLabel: {default: false, type: Boolean},
  },
  emits: ['profileClick'],
  setup(
    props: {
      className: string;
      menuAlign: 'auto' | 'left' | 'right';
      menuItems?: DropdownMenuItem[];
      onManageProfile?: () => void;
      profileLabel?: string;
      showChevron: boolean;
      showTriggerLabel: boolean;
      size: 'sm' | 'md' | 'lg';
    },
    {slots, emit}: {emit: any; slots: any},
  ): () => VNode | VNode[] | null {
    const {user, signOut} = useThunderID();
    const isProfileModalOpen: Ref<boolean> = ref(false);

    return (): VNode | VNode[] | null =>
      h(
        BaseUserDropdown,
        {
          class: withVendorCSSClassPrefix('user-dropdown--styled'),
          className: props.className,
          isProfileModalOpen: isProfileModalOpen.value,
          menuAlign: props.menuAlign,
          menuItems: props.menuItems,
          onProfileClick: (): void => {
            if (props.onManageProfile) {
              props.onManageProfile();
              return;
            }
            isProfileModalOpen.value = true;
            emit('profileClick');
          },
          onProfileModalClose: (): void => {
            isProfileModalOpen.value = false;
          },
          onSignOut: (): void => {
            signOut();
          },
          profileContent:
            !props.onManageProfile && isProfileModalOpen.value
              ? h(UserProfileComponent, {
                  cardLayout: false,
                  compact: true,
                  editable: true,
                })
              : null,
          profileLabel: props.profileLabel,
          showChevron: props.showChevron,
          showTriggerLabel: props.showTriggerLabel,
          size: props.size,
          user: user.value,
        },
        slots,
      );
  },
});

export default UserDropdown;
