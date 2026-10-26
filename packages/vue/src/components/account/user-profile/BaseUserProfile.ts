// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AttributeSchema, Preferences, type User, startCase, withVendorCSSClassPrefix} from '@thunderid/browser';
import {type Component, type PropType, type Ref, type SetupContext, type VNode, defineComponent, h, ref} from 'vue';
import getDisplayName from '../../../utils/getDisplayName';
import getMappedUserProfileValue from '../../../utils/getMappedUserProfileValue';
import Alert from '../../primitives/Alert';
import Button from '../../primitives/Button';
import Card from '../../primitives/Card';
import Checkbox from '../../primitives/Checkbox';
import DatePicker from '../../primitives/DatePicker';
import Divider from '../../primitives/Divider';
import {PencilIcon} from '../../primitives/Icons';
import Spinner from '../../primitives/Spinner';
import TextField from '../../primitives/TextField';
import Typography from '../../primitives/Typography';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExtendedSchema {
  description?: string;
  displayName?: string;
  displayOrder?: string;
  multiValued?: boolean;
  mutability?: string;
  name?: string;
  regex?: string;
  required?: boolean;
  schemaId?: string;
  subAttributes?: ExtendedSchema[];
  type?: string;
  value?: any;
}

export interface BaseUserProfileProps {
  avatarSize?: 'sm' | 'md' | 'lg';
  cardLayout?: boolean;
  cardVariant?: 'elevated' | 'outlined' | 'flat';
  className?: string;
  compact?: boolean;
  editable?: boolean;
  error?: string | null;
  flattenedProfile?: User | null;
  hideFields?: string[];
  isLoading?: boolean;
  onUpdate?: (payload: any) => Promise<void>;
  preferences?: Preferences;
  profile?: User | null;
  schemas?: any[] | null;
  showAvatar?: boolean;
  showFields?: string[];
  t?: (key: string, fallback?: string) => string;
  title?: string;
  userSchema?: Record<string, AttributeSchema> | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FIELDS_TO_SKIP: string[] = [
  'roles.default',
  'active',
  'groups',
  'accountLocked',
  'accountDisabled',
  'oneTimePassword',
  'userSourceId',
  'idpType',
  'localCredentialExists',
  'ResourceType',
  'ExternalID',
  'MetaData',
  'verifiedMobileNumbers',
  'verifiedEmailAddresses',
  'phoneNumbers.mobile',
  'emailAddresses',
  'preferredMFAOption',
  'attributes',
  'isReadOnly',
  'isReadonly',
];

const READONLY_FIELDS: string[] = [
  'username',
  'userName',
  'user_name',
  'sub',
  'id',
  'ouId',
  'attributes',
  'isReadOnly',
  'isReadonly',
];

const DEFAULT_ATTRIBUTE_MAPPINGS: Record<string, string | string[]> = {
  email: ['emails', 'email'],
  firstName: ['name.givenName', 'given_name'],
  lastName: ['name.familyName', 'family_name'],
  picture: ['picture', 'avatar', 'pictureUrl', 'attributes.picture'],
  username: ['userName', 'username', 'user_name'],
};

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

function formatLabel(key: string): string {
  return key
    .split(/(?=[A-Z])|[_.]/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function buildPatchValue(
  flatKey: string,
  rawValue: any,
  _schemaId: string | undefined,
  multiValued: boolean | undefined,
): Record<string, unknown> {
  const value: unknown = multiValued ? [rawValue] : rawValue;

  const segments: string[] = flatKey.split('.');
  const nested: Record<string, unknown> = {};
  let cursor: Record<string, unknown> = nested;
  for (let i = 0; i < segments.length - 1; i += 1) {
    cursor[segments[i]] = {};
    cursor = cursor[segments[i]] as Record<string, unknown>;
  }
  cursor[segments[segments.length - 1]] = value;
  return nested;
}

// ─── Component ───────────────────────────────────────────────────────────────

const BaseUserProfile: Component = defineComponent({
  name: 'BaseUserProfile',
  inheritAttrs: false,
  props: {
    /** Avatar circle size. */
    avatarSize: {
      default: 'lg',
      type: String as PropType<'sm' | 'md' | 'lg'>,
    },
    cardLayout: {default: true, type: Boolean},
    /** Shadow / border style of the Card wrapper. */
    cardVariant: {
      default: 'elevated',
      type: String as PropType<'elevated' | 'outlined' | 'flat'>,
    },
    className: {default: '', type: String},
    /** Tighter field spacing for modal / dropdown contexts. */
    compact: {default: false, type: Boolean},
    editable: {default: true, type: Boolean},
    error: {default: null, type: String as PropType<string | null>},
    flattenedProfile: {default: null, type: Object as PropType<User | null>},
    hideFields: {default: () => [], type: Array as PropType<string[]>},
    isLoading: {default: false, type: Boolean},
    onUpdate: {default: undefined, type: Function as PropType<(payload: any) => Promise<void>>},
    preferences: {default: undefined, type: Object as PropType<Preferences>},
    profile: {default: null, type: Object as PropType<User | null>},
    schemas: {default: () => [], type: Array as PropType<any[] | null>},
    /** Whether to render the avatar hero banner. */
    showAvatar: {default: true, type: Boolean},
    showFields: {default: () => [], type: Array as PropType<string[]>},
    t: {default: undefined, type: Function as PropType<(key: string, fallback?: string) => string>},
    title: {default: 'Profile', type: String},
    /** User schema metadata. */
    userSchema: {default: null, type: Object as PropType<Record<string, AttributeSchema> | null>},
  },
  setup(props: BaseUserProfileProps, {slots}: SetupContext): () => VNode | VNode[] | null {
    const editingFields: Ref<Record<string, boolean>> = ref({});
    const editedValues: Ref<Record<string, any>> = ref({});

    const px: typeof withVendorCSSClassPrefix = withVendorCSSClassPrefix;
    const regexCache = new Map<string, RegExp | null>();

    const t = (key: string, fallback?: string): string => {
      if (props.t) {
        const res = props.t(key);
        if (res && res !== key) return res;
      }
      return fallback ?? key;
    };

    // ── Visibility ────────────────────────────────────────────────────────────

    function shouldShowField(fieldName: string, isSchemaBased = false): boolean {
      if (!isSchemaBased && FIELDS_TO_SKIP.includes(fieldName)) return false;
      if (props.hideFields && props.hideFields.length > 0 && props.hideFields.includes(fieldName)) return false;
      if (props.showFields && props.showFields.length > 0) return props.showFields.includes(fieldName);
      return true;
    }

    const fieldErrors: Ref<Record<string, string>> = ref({});

    function startEditing(fieldName: string, currentValue: any): void {
      editedValues.value = {...editedValues.value, [fieldName]: currentValue ?? ''};
      editingFields.value = {...editingFields.value, [fieldName]: true};
      fieldErrors.value = {...fieldErrors.value, [fieldName]: ''};
    }

    function cancelEditing(fieldName: string): void {
      const data: User | null = props.flattenedProfile ?? props.profile ?? null;
      const originalValue: any =
        (data as Record<string, any>)?.[fieldName] ?? (data as any)?.attributes?.[fieldName] ?? '';
      editedValues.value = {...editedValues.value, [fieldName]: originalValue};
      editingFields.value = {...editingFields.value, [fieldName]: false};
      fieldErrors.value = {...fieldErrors.value, [fieldName]: ''};
    }

    async function saveField(schema: ExtendedSchema): Promise<void> {
      if (!props.onUpdate || !schema.name) return;
      const fieldName: string = schema.name;
      const value: any = editedValues.value[fieldName] ?? '';
      const strVal: string = String(value ?? '').trim();
      const fieldLabel: string = schema.displayName || formatLabel(fieldName);

      if (schema.required && !strVal) {
        fieldErrors.value = {
          ...fieldErrors.value,
          [fieldName]: t('userProfile.field.required', `${fieldLabel} is required.`),
        };
        return;
      }

      if (schema.regex && strVal) {
        if (schema.regex.length > 250) {
          console.warn(`Regex pattern for field "${fieldName}" exceeds maximum length limit (250 chars).`);
        } else {
          let reg: RegExp | null | undefined = regexCache.get(schema.regex);
          if (reg === undefined) {
            try {
              reg = new RegExp(schema.regex);
              regexCache.set(schema.regex, reg);
            } catch (err) {
              regexCache.set(schema.regex, null);
              console.warn(`Invalid regular expression syntax in user schema for field "${fieldName}":`, err);
            }
          }
          if (reg && !reg.test(strVal)) {
            fieldErrors.value = {
              ...fieldErrors.value,
              [fieldName]: t('userProfile.field.invalidFormat', `${fieldLabel} has an invalid format.`),
            };
            return;
          }
        }
      }

      fieldErrors.value = {...fieldErrors.value, [fieldName]: ''};
      const submitVal: any = typeof value === 'string' ? strVal : value;
      const payload: Record<string, unknown> = buildPatchValue(
        fieldName,
        submitVal,
        schema.schemaId,
        schema.multiValued,
      );
      try {
        await props.onUpdate(payload);
        editingFields.value = {...editingFields.value, [fieldName]: false};
      } catch {
        // Keep field in editing mode on error so user input is preserved
      }
    }

    // ── Input rendering per schema type ───────────────────────────────────────

    function renderInput(schema: ExtendedSchema): VNode {
      const fieldName: string = schema.name ?? '';
      const currentValue: any = editedValues.value[fieldName];

      switch (schema.type) {
        case 'DATE_TIME':
          return h(DatePicker, {
            modelValue: String(currentValue ?? ''),
            'onUpdate:modelValue': (v: string) => {
              editedValues.value = {...editedValues.value, [fieldName]: v};
            },
            placeholder: `Enter your ${(schema.displayName || fieldName).toLowerCase()}`,
            required: schema.required,
          });

        case 'BOOLEAN':
          return h(Checkbox, {
            label: schema.displayName || fieldName,
            modelValue: Boolean(currentValue),
            'onUpdate:modelValue': (v: boolean) => {
              editedValues.value = {...editedValues.value, [fieldName]: v};
            },
          });

        default:
          return h(TextField, {
            modelValue: String(currentValue ?? ''),
            'onUpdate:modelValue': (v: string) => {
              editedValues.value = {...editedValues.value, [fieldName]: v};
            },
            placeholder: `Enter your ${(schema.displayName || fieldName).toLowerCase()}`,
            required: schema.required,
          });
      }
    }

    // ── Schema-driven field row ───────────────────────────────────────────────

    function renderSchemaFieldRow(schema: ExtendedSchema): VNode | null {
      const {name, displayName, description, mutability, value} = schema;
      if (!name || !shouldShowField(name)) return null;

      const label: string = displayName || description || formatLabel(name);
      const isReadonly: boolean = mutability === 'READ_ONLY' || READONLY_FIELDS.includes(name);
      const isEditable: boolean = Boolean(props.editable) && !isReadonly;
      const isEditing = Boolean(editingFields.value[name]);
      const hasValue: boolean = value !== undefined && value !== null && value !== '';

      if (!hasValue && !isEditing && !(isEditable && mutability === 'READ_WRITE')) return null;

      const editablePlaceholder: VNode | null = isEditable
        ? h(
            'span',
            {class: px('user-profile__field-placeholder'), onClick: () => startEditing(name, value)},
            `Enter your ${label.toLowerCase()}`,
          )
        : null;
      const displayValueNode: VNode | null = hasValue
        ? h('span', {class: px('user-profile__field-value')}, String(value))
        : editablePlaceholder;

      return h('div', {class: px('user-profile__field'), key: name}, [
        h('div', {class: px('user-profile__field-inner')}, [
          h('span', {class: px('user-profile__field-label')}, label),
          isEditing
            ? h('div', {class: px('user-profile__field-edit')}, [
                renderInput(schema),
                fieldErrors.value[name]
                  ? h('div', {class: px('user-profile__field-error')}, fieldErrors.value[name])
                  : null,
              ])
            : displayValueNode,
        ]),
        isEditable && !isReadonly
          ? h('div', {class: px('user-profile__field-actions')}, [
              isEditing
                ? [
                    h(
                      Button,
                      {
                        color: 'primary' as const,
                        onClick: () => saveField(schema),
                        size: 'small' as const,
                        variant: 'solid' as const,
                      },
                      () => t('userProfile.actions.save', 'Save'),
                    ),
                    h(
                      Button,
                      {
                        color: 'secondary' as const,
                        onClick: () => cancelEditing(name),
                        size: 'small' as const,
                        variant: 'solid' as const,
                      },
                      () => t('userProfile.actions.cancel', 'Cancel'),
                    ),
                  ]
                : hasValue
                  ? h(Button, {
                      class: px('user-profile__field-edit-btn'),
                      color: 'secondary' as const,
                      onClick: () => startEditing(name, value),
                      size: 'small' as const,
                      startIcon: h(PencilIcon),
                      title: t('userProfile.actions.edit', 'Edit'),
                      variant: 'ghost' as const,
                    })
                  : null,
            ])
          : null,
      ]);
    }

    // ── Fallback: no schemas ──────────────────────────────────────────────────

    function renderProfileWithoutSchemas(): VNode[] {
      const data: Record<string, any> | null = (props.flattenedProfile || props.profile) as Record<string, any> | null;
      if (!data) return [];

      return Object.entries(data)
        .filter(([key, value]: [string, any]) => {
          if (!shouldShowField(key)) return false;
          return value !== undefined && value !== null && value !== '';
        })
        .sort(([a]: [string, any], [b]: [string, any]) => a.localeCompare(b))
        .map(([key, value]: [string, any]) =>
          h('div', {class: px('user-profile__field'), key}, [
            h('div', {class: px('user-profile__field-inner')}, [
              h('span', {class: px('user-profile__field-label')}, formatLabel(key)),
              h(
                'span',
                {class: px('user-profile__field-value')},
                typeof value === 'object' ? JSON.stringify(value) : String(value),
              ),
            ]),
          ]),
        );
    }

    // ── Hero section ──────────────────────────────────────────────────────────

    function renderHero(currentUser: Record<string, any>): VNode {
      const displayName: string = getDisplayName(DEFAULT_ATTRIBUTE_MAPPINGS, currentUser as User);
      const email: any =
        getMappedUserProfileValue('email', DEFAULT_ATTRIBUTE_MAPPINGS, currentUser as User) ||
        getMappedUserProfileValue('username', DEFAULT_ATTRIBUTE_MAPPINGS, currentUser as User);

      const picture: string | null =
        getMappedUserProfileValue('picture', DEFAULT_ATTRIBUTE_MAPPINGS, currentUser as User) || null;

      const avatarSeed = String(
        currentUser['username'] || currentUser['userName'] || currentUser['email'] || currentUser['sub'] || displayName,
      );
      const avatarGradient: string = getAvatarGradient(avatarSeed);
      const initials: string =
        displayName
          .split(' ')
          .map((w: string) => w.charAt(0))
          .slice(0, 2)
          .join('')
          .toUpperCase() || '?';

      const avatarSizeClass: string = px(`user-profile__avatar--${props.avatarSize ?? 'lg'}`);

      return h('div', {class: px('user-profile__hero')}, [
        h('div', {class: px('user-profile__avatar-wrapper')}, [
          picture
            ? h('img', {
                alt: displayName,
                class: [px('user-profile__avatar'), avatarSizeClass].join(' '),
                src: picture,
              })
            : h(
                'div',
                {class: [px('user-profile__avatar'), avatarSizeClass].join(' '), style: {background: avatarGradient}},
                [h('span', {class: px('user-profile__avatar-initials')}, initials)],
              ),
        ]),
        h('div', {class: px('user-profile__hero-info')}, [
          h('span', {class: px('user-profile__hero-name')}, displayName),
          email ? h('span', {class: px('user-profile__hero-subtitle')}, String(email)) : null,
        ]),
      ]);
    }

    // ── Main render ───────────────────────────────────────────────────────────

    return (): VNode | VNode[] | null => {
      const data: User | null = props.flattenedProfile ?? props.profile ?? null;

      if (!data && !props.isLoading) {
        return slots['default']
          ? slots['default']({error: props.error, isLoading: props.isLoading, profile: null})
          : null;
      }

      if (slots['default']) {
        return slots['default']({error: props.error, isLoading: props.isLoading, profile: data});
      }

      const currentUser: Record<string, any> = data as Record<string, any>;
      const schemas: ExtendedSchema[] = (props.schemas ?? []) as ExtendedSchema[];
      const hasSchemas: boolean = schemas.length > 0;

      const rootClasses: string = [
        px('user-profile'),
        props.compact ? px('user-profile--compact') : '',
        props.className ?? '',
      ]
        .filter(Boolean)
        .join(' ');

      const children: VNode[] = [];

      // Hero
      if (props.showAvatar !== false && currentUser) {
        children.push(renderHero(currentUser));
      }

      // Error alert
      if (props.error) {
        children.push(h(Alert, {class: px('user-profile__error'), severity: 'error' as const}, () => props.error));
      }

      // Fields
      if (props.isLoading) {
        children.push(h('div', {class: px('user-profile__loading')}, [h(Spinner)]));
      } else if (props.userSchema && typeof props.userSchema === 'object' && Object.keys(props.userSchema).length > 0) {
        const metaSchemas: ExtendedSchema[] = Object.entries(props.userSchema)
          .filter(([key, metaAttr]: [string, AttributeSchema]) => {
            if (metaAttr?.credential) return false;
            return shouldShowField(key, true);
          })
          .map(([key, metaAttr]: [string, AttributeSchema]) => {
            const val =
              editedValues.value?.[key] ?? (currentUser as any)?.attributes?.[key] ?? (currentUser as any)?.[key] ?? '';
            const isReadonly =
              metaAttr.readOnly === true || metaAttr.mutability === 'READ_ONLY' || READONLY_FIELDS.includes(key);

            return {
              displayName: metaAttr.displayName ?? (key ? startCase(key) : ''),
              mutability: isReadonly ? 'READ_ONLY' : 'READ_WRITE',
              name: key,
              regex: metaAttr.regex,
              required: !!metaAttr.required,
              type: (metaAttr.type ?? 'STRING').toUpperCase(),
              value: val,
            };
          });

        const fieldRows: VNode[] = metaSchemas
          .map((schema: ExtendedSchema) => renderSchemaFieldRow(schema))
          .filter((node: VNode | null): node is VNode => node !== null);

        children.push(h('div', {class: px('user-profile__fields')}, fieldRows));
      } else if (hasSchemas) {
        const fieldRows: VNode[] = schemas
          .filter((s: ExtendedSchema) => s.name && shouldShowField(s.name))
          .sort((a: ExtendedSchema, b: ExtendedSchema) => {
            const orderA: number = a.displayOrder ? parseInt(a.displayOrder, 10) : 999;
            const orderB: number = b.displayOrder ? parseInt(b.displayOrder, 10) : 999;
            return orderA - orderB;
          })
          .map((schema: ExtendedSchema) => {
            const value: any = currentUser && schema.name ? currentUser[schema.name] : undefined;
            return renderSchemaFieldRow({...schema, value});
          })
          .filter((node: VNode | null): node is VNode => node !== null);

        children.push(h('div', {class: px('user-profile__fields')}, fieldRows));
      } else {
        children.push(h('div', {class: px('user-profile__fields')}, renderProfileWithoutSchemas()));
      }

      if (slots['footer']) {
        children.push(h('div', {class: px('user-profile__footer')}, slots['footer']()));
      }

      if (props.cardLayout) {
        return h(Card, {class: rootClasses, variant: props.cardVariant ?? 'elevated'}, () => children);
      }

      return h('div', {class: rootClasses}, children);
    };
  },
});

export default BaseUserProfile;
