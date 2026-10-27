// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {type User, withVendorCSSClassPrefix} from '@thunderid/browser';
import {
  type Component,
  type PropType,
  type Ref,
  type VNode,
  Teleport,
  defineComponent,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import getDisplayName from '../../../utils/getDisplayName';
import getMappedUserProfileValue from '../../../utils/getMappedUserProfileValue';
import {ChevronDownIcon, LogOutIcon, UserIcon, XIcon} from '../../primitives/Icons';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * A single item in the dropdown menu.
 *
 * @example
 * ```ts
 * const items: DropdownMenuItem[] = [
 *   { label: 'Settings', icon: h(SettingsIcon, { size: 15 }), onClick: () => router.push('/settings') },
 *   { label: 'Help',     onClick: openHelp, separatorBefore: true },
 *   { label: 'Delete account', onClick: deleteAccount, danger: true, separatorBefore: true },
 * ];
 * ```
 */
export interface DropdownMenuItem {
  /** Renders with red text and red hover background. Use for destructive actions. */
  danger?: boolean;
  /** Optional icon VNode rendered to the left of the label. */
  icon?: VNode | null;
  /** The visible text label. */
  label: string;
  /** Called when the item is clicked (menu closes first). */
  onClick: () => void;
  /** When `true`, a thin divider is rendered immediately before this item. */
  separatorBefore?: boolean;
}

export interface BaseUserDropdownProps {
  className?: string;
  isProfileModalOpen?: boolean;
  menuAlign?: 'auto' | 'left' | 'right';
  menuItems?: DropdownMenuItem[];
  onProfileClick?: () => void;
  onProfileModalClose?: () => void;
  onSignOut?: () => void;
  /** Label for the default profile menu item. Defaults to `'Profile'`. */
  profileLabel?: string;
  profileContent?: VNode | null;
  showChevron?: boolean;
  showTriggerLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  user?: User | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_ATTRIBUTE_MAPPINGS: Record<string, string | string[]> = {
  email: ['emails', 'email'],
  firstName: ['name.givenName', 'given_name'],
  lastName: ['name.familyName', 'family_name'],
  picture: ['picture', 'avatar', 'pictureUrl', 'attributes.picture'],
  username: ['userName', 'username', 'user_name'],
};

/** Approximate min-width for each size, used for auto-alignment decisions. */
const MENU_MIN_WIDTHS: Record<string, number> = {lg: 280, md: 220, sm: 180};

const AVATAR_GRADIENTS: string[] = [
  'linear-gradient(135deg, #4b6ef5 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #4b6ef5 100%)',
  'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #ec4899 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #4b6ef5 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAvatarGradient(seed: string): string {
  if (!seed) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function resolveUserInfo(user: User | null): {
  displayName: string;
  gradient: string;
  initials: string;
  picture: string | null;
  subtitle: string;
} {
  if (!user) {
    return {displayName: 'User', gradient: AVATAR_GRADIENTS[0], initials: '?', picture: null, subtitle: ''};
  }

  const displayName: string = getDisplayName(DEFAULT_ATTRIBUTE_MAPPINGS, user) || 'User';
  const initials: string =
    displayName
      .split(' ')
      .map((w: string) => w.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const picture: string | null = getMappedUserProfileValue('picture', DEFAULT_ATTRIBUTE_MAPPINGS, user) || null;

  const seed = String(
    getMappedUserProfileValue('username', DEFAULT_ATTRIBUTE_MAPPINGS, user) ||
      getMappedUserProfileValue('email', DEFAULT_ATTRIBUTE_MAPPINGS, user) ||
      displayName,
  );

  const subtitle = String(
    getMappedUserProfileValue('email', DEFAULT_ATTRIBUTE_MAPPINGS, user) ||
      getMappedUserProfileValue('username', DEFAULT_ATTRIBUTE_MAPPINGS, user) ||
      '',
  );

  return {displayName, gradient: getAvatarGradient(seed), initials, picture, subtitle};
}

// ─── Component ───────────────────────────────────────────────────────────────

const BaseUserDropdown: Component = defineComponent({
  name: 'BaseUserDropdown',
  inheritAttrs: false,
  props: {
    className: {default: '', type: String},
    isProfileModalOpen: {default: false, type: Boolean},
    /**
     * How to align the dropdown panel relative to the trigger.
     * - `'auto'` (default) — opens toward the side with more viewport space.
     * - `'left'` — panel left edge aligns with trigger left edge.
     * - `'right'` — panel right edge aligns with trigger right edge.
     */
    menuAlign: {default: 'auto', type: String as PropType<'auto' | 'left' | 'right'>},
    /**
     * Extra items rendered between the Profile link and Sign Out.
     * Each item can carry an icon, a danger flag, and a separatorBefore flag.
     */
    menuItems: {default: undefined, type: Array as PropType<DropdownMenuItem[]>},
    onProfileClick: {default: undefined, type: Function as PropType<() => void>},
    onProfileModalClose: {default: undefined, type: Function as PropType<() => void>},
    onSignOut: {default: undefined, type: Function as PropType<() => void>},
    profileContent: {default: null, type: Object as PropType<VNode | null>},
    /** Label for the default profile menu item. Defaults to `'Profile'`. */
    profileLabel: {default: 'Profile', type: String},
    /** Show the animated chevron on the trigger. Default `false`. */
    showChevron: {default: false, type: Boolean},
    /** Show the user's display name as text beside the trigger avatar. Default `false`. */
    showTriggerLabel: {default: false, type: Boolean},
    /** Controls avatar size on the trigger and spacing density of the menu. */
    size: {default: 'md', type: String as PropType<'sm' | 'md' | 'lg'>},
    user: {default: null, type: Object as PropType<User | null>},
  },
  setup(props: BaseUserDropdownProps, {slots}: {slots: any}): () => VNode | VNode[] | null {
    const isOpen: Ref<boolean> = ref(false);
    const containerRef: Ref<HTMLElement | null> = ref(null);
    const modalOverlayRef: Ref<HTMLElement | null> = ref(null);
    const avatarImageError: Ref<boolean> = ref(false);
    const px: typeof withVendorCSSClassPrefix = withVendorCSSClassPrefix;

    watch(
      () => resolveUserInfo(props.user ?? null).picture,
      (): void => {
        avatarImageError.value = false;
      },
    );

    // ── Click-outside / Escape ────────────────────────────────────────────────

    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
        isOpen.value = false;
      }
    }

    function handleModalClose(): void {
      props.onProfileModalClose?.();
      const triggerBtn = containerRef.value?.querySelector<HTMLElement>(`.${px('user-dropdown__trigger')}`);
      triggerBtn?.focus();
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (props.isProfileModalOpen) {
        if (event.key === 'Escape') {
          handleModalClose();
        } else if (event.key === 'Tab') {
          const overlay = modalOverlayRef.value;
          if (overlay) {
            const focusables = overlay.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
            if (focusables.length > 0) {
              const first = focusables[0];
              const last = focusables[focusables.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }
          }
        }
      } else if (event.key === 'Escape') {
        isOpen.value = false;
      }
    }

    watch(
      () => props.isProfileModalOpen,
      (open) => {
        if (open) {
          nextTick(() => {
            const closeBtn = modalOverlayRef.value?.querySelector<HTMLElement>(`.${px('user-dropdown__modal-close')}`);
            closeBtn?.focus();
          });
        }
      },
    );

    onMounted((): void => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    });

    onUnmounted((): void => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    });

    // ── Auto-alignment ────────────────────────────────────────────────────────

    function resolveMenuAlign(): 'left' | 'right' {
      if (props.menuAlign !== 'auto') return props.menuAlign ?? 'right';
      if (!containerRef.value) return 'right';
      const rect: DOMRect = containerRef.value.getBoundingClientRect();
      const spaceRight: number = window.innerWidth - rect.left;
      const spaceLeft: number = rect.right;
      return spaceRight >= spaceLeft ? 'left' : 'right';
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (): VNode | VNode[] | null => {
      if (slots.default) {
        return slots.default({
          isOpen: isOpen.value,
          toggle: (): void => {
            isOpen.value = !isOpen.value;
          },
          user: props.user,
        });
      }

      const {displayName, initials, gradient, picture, subtitle} = resolveUserInfo(props.user ?? null);
      const size: 'sm' | 'md' | 'lg' = props.size ?? 'md';

      // ── Trigger ────────────────────────────────────────────────────────────

      const avatarSizeClass: string = size !== 'md' ? px(`user-dropdown__avatar--${size}`) : '';
      const triggerClass: string = [
        px('user-dropdown__trigger'),
        isOpen.value ? px('user-dropdown__trigger--open') : '',
      ]
        .filter(Boolean)
        .join(' ');

      const trigger: VNode = h(
        'button',
        {
          'aria-expanded': isOpen.value,
          'aria-haspopup': 'true',
          class: triggerClass,
          onClick: (e: MouseEvent): void => {
            e.stopPropagation();
            isOpen.value = !isOpen.value;
          },
          type: 'button',
        },
        [
          picture && !avatarImageError.value
            ? h('img', {
                alt: displayName,
                class: [px('user-dropdown__avatar'), avatarSizeClass].filter(Boolean).join(' '),
                onError: (): void => {
                  avatarImageError.value = true;
                },
                src: picture,
              })
            : h(
                'span',
                {
                  class: [px('user-dropdown__avatar'), avatarSizeClass].filter(Boolean).join(' '),
                  style: {background: gradient},
                },
                initials,
              ),
          props.showTriggerLabel ? h('span', {class: px('user-dropdown__trigger-label')}, displayName) : null,
          props.showChevron ? h('span', {class: px('user-dropdown__chevron')}, [h(ChevronDownIcon, {size: 14})]) : null,
        ],
      );

      // ── Menu ───────────────────────────────────────────────────────────────

      let menu: VNode | null = null;

      if (isOpen.value) {
        const resolvedAlign: 'left' | 'right' = resolveMenuAlign();
        const alignClass: string = resolvedAlign === 'left' ? px('user-dropdown__menu--align-left') : '';
        const sizeClass: string = size !== 'md' ? px(`user-dropdown__menu--size-${size}`) : '';
        const menuClass: string = [px('user-dropdown__menu'), alignClass, sizeClass].filter(Boolean).join(' ');

        // Build menu contents
        const menuChildren: (VNode | null)[] = [];

        // Header
        menuChildren.push(
          h('div', {class: px('user-dropdown__menu-header')}, [
            picture
              ? h('img', {
                  alt: displayName,
                  class: px('user-dropdown__menu-header-avatar'),
                  src: picture,
                })
              : h('div', {class: px('user-dropdown__menu-header-avatar'), style: {background: gradient}}, initials),
            h('div', {class: px('user-dropdown__menu-header-info')}, [
              h('span', {class: px('user-dropdown__menu-header-name')}, displayName),
              subtitle ? h('span', {class: px('user-dropdown__menu-header-subtitle')}, subtitle) : null,
            ]),
          ]),
        );

        menuChildren.push(h('div', {class: px('user-dropdown__menu-divider')}));

        // Default Profile item
        if (props.onProfileClick) {
          menuChildren.push(
            h(
              'button',
              {
                class: px('user-dropdown__item'),
                onClick: (): void => {
                  isOpen.value = false;
                  props.onProfileClick!();
                },
                type: 'button',
              },
              [h(UserIcon, {size: 15}), h('span', null, props.profileLabel ?? 'Profile')],
            ),
          );
        }

        // Custom items from prop (with optional separatorBefore per item)
        if (props.menuItems && props.menuItems.length > 0) {
          props.menuItems.forEach((item: DropdownMenuItem, idx: number): void => {
            if (item.separatorBefore) {
              menuChildren.push(h('div', {class: px('user-dropdown__menu-divider'), key: `sep-${idx}`}));
            }
            menuChildren.push(
              h(
                'button',
                {
                  class: [px('user-dropdown__item'), item.danger ? px('user-dropdown__item--danger') : '']
                    .filter(Boolean)
                    .join(' '),
                  key: `item-${idx}`,
                  onClick: (): void => {
                    isOpen.value = false;
                    item.onClick();
                  },
                  type: 'button',
                },
                [item.icon ?? null, h('span', null, item.label)],
              ),
            );
          });
        }

        // Legacy slot items (backward compat)
        if (slots.items) {
          menuChildren.push(...(slots.items() ?? []));
        }

        // Default Sign Out item (always last, always separated)
        if (props.onSignOut) {
          menuChildren.push(h('div', {class: px('user-dropdown__menu-divider')}));
          menuChildren.push(
            h(
              'button',
              {
                class: [px('user-dropdown__item'), px('user-dropdown__item--danger')].join(' '),
                onClick: (): void => {
                  isOpen.value = false;
                  props.onSignOut!();
                },
                type: 'button',
              },
              [h(LogOutIcon, {size: 15}), h('span', null, 'Sign Out')],
            ),
          );
        }

        menu = h('div', {class: menuClass}, menuChildren.filter(Boolean));
      }

      // ── Container ─────────────────────────────────────────────────────────

      const container: VNode = h(
        'div',
        {class: [px('user-dropdown'), props.className].filter(Boolean).join(' '), ref: containerRef},
        [trigger, menu],
      );

      // ── Profile modal ──────────────────────────────────────────────────────

      if (props.isProfileModalOpen) {
        return h('div', [
          container,
          h(Teleport, {to: 'body'}, [
            h(
              'div',
              {
                'aria-label': 'User profile',
                'aria-modal': 'true',
                class: px('user-dropdown__modal-overlay'),
                ref: modalOverlayRef,
                role: 'dialog',
                onClick: (e: MouseEvent): void => {
                  if ((e.target as HTMLElement).classList.contains(px('user-dropdown__modal-overlay'))) {
                    handleModalClose();
                  }
                },
              },
              [
                h('div', {class: px('user-dropdown__modal-content')}, [
                  h(
                    'button',
                    {
                      'aria-label': 'Close profile',
                      class: px('user-dropdown__modal-close'),
                      onClick: handleModalClose,
                      type: 'button',
                    },
                    [h(XIcon, {size: 18})],
                  ),
                  props.profileContent,
                ]),
              ],
            ),
          ]),
        ]);
      }

      return container;
    };
  },
});

export default BaseUserDropdown;
