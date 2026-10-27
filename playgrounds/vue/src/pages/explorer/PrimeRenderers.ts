// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ManagedUser, MembershipGroup} from '@thunderid/browser';
import {
  type AdminListRenderProps,
  type BaseApplicationCreateRenderProps,
  type BaseApplicationDetailsRenderProps,
  type BaseGroupCreateRenderProps,
  type BaseUserDetailsRenderProps,
  type DataTableColumn,
  useTheme,
} from '@thunderid/vue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import Chip from 'primevue/chip';
import Column from 'primevue/column';
import DataTable, {type DataTablePageEvent, type DataTableRowSelectEvent} from 'primevue/datatable';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Password from 'primevue/password';
import Textarea from 'primevue/textarea';
import {Component, defineComponent, h, onBeforeUnmount, VNode, VNodeChild, watchEffect} from 'vue';

/**
 * Follows the playground's light or dark preview with PrimeVue's palette. PrimeVue resolves its
 * component tokens on the root element, so the dark mode class goes on `<html>`.
 */
export const PrimeTheme: Component = defineComponent({
  name: 'PrimeTheme',
  setup(_props: Record<string, never>, {slots}: {slots: {default?: () => VNodeChild}}): () => VNode {
    const {colorScheme} = useTheme();

    watchEffect(() => document.documentElement.classList.toggle('pg-prime-dark', colorScheme.value === 'dark'));
    onBeforeUnmount(() => document.documentElement.classList.remove('pg-prime-dark'));

    return (): VNode => h('div', {class: 'pg-prime-root'}, slots.default?.() as VNode[]);
  },
});

/**
 * The user list's default scoped slot drawn as a PrimeVue DataTable: the SDK's columns become table
 * columns, and the table's lazy paging maps onto the SDK's offset-based paging.
 */
export const userTable = (state: AdminListRenderProps<ManagedUser>): VNode =>
  h('div', {class: 'pg-prime-stack'}, [
    state.error ? h(Message, {severity: 'error'}, {default: () => state.error}) : null,
    h(
      DataTable,
      {
        dataKey: 'id',
        first: state.offset,
        lazy: true,
        loading: state.isLoading,
        onPage: (event: DataTablePageEvent) => state.onPageChange?.(event.first),
        onRowSelect: (event: DataTableRowSelectEvent) => state.onSelect?.(event.data as ManagedUser),
        paginator: Boolean(state.onPageChange),
        rows: state.limit,
        selection: state.rows.find((row: ManagedUser) => row.id === state.selectedRowId),
        selectionMode: state.onSelect ? 'single' : undefined,
        size: 'small',
        totalRecords: state.totalResults,
        value: state.rows,
      },
      {
        default: () =>
          state.columns.map((column: DataTableColumn<ManagedUser>) =>
            h(
              Column,
              {field: column.id, header: column.header, key: column.id},
              {
                body: ({data}: {data: ManagedUser}) => column.render(data),
              },
            ),
          ),
      },
    ),
  ]);

/** The group form's default scoped slot drawn with PrimeVue inputs. */
export const groupForm = (state: BaseGroupCreateRenderProps): VNode =>
  h(
    Card,
    {},
    {
      content: () =>
        h('div', {class: 'pg-prime-stack'}, [
          state.error ? h(Message, {severity: 'error'}, {default: () => state.error}) : null,
          h('label', {class: 'pg-prime-field'}, [
            h('span', 'Name *'),
            h(InputText, {
              modelValue: state.values.name,
              'onUpdate:modelValue': (value: string | undefined) => state.handleInputChange('name', value ?? ''),
            }),
          ]),
          h('label', {class: 'pg-prime-field'}, [
            h('span', 'Description'),
            h(Textarea, {
              autoResize: true,
              modelValue: state.values.description,
              'onUpdate:modelValue': (value: string) => state.handleInputChange('description', value),
              rows: 2,
            }),
          ]),
        ]),
      footer: () =>
        h('div', {class: 'pg-prime-actions'}, [
          state.onCancel
            ? h(Button, {label: 'Cancel', onClick: state.onCancel, severity: 'secondary', text: true})
            : null,
          h(Button, {
            disabled: !state.isValid || state.isSubmitting,
            label: 'Create group',
            loading: state.isSubmitting,
            onClick: state.handleSubmit,
          }),
        ]),
      subtitle: () => "Rendered with PrimeVue from the SDK's default scoped slot",
      title: () => 'New group',
    },
  );

/** The user details' default scoped slot drawn as a PrimeVue card. */
export const userCard = (state: BaseUserDetailsRenderProps): VNode =>
  h(
    Card,
    {},
    {
      content: () =>
        h('div', {class: 'pg-prime-stack'}, [
          state.error ? h(Message, {severity: 'error'}, {default: () => state.error}) : null,
          h(
            'div',
            {class: 'pg-prime-chips'},
            Object.entries(state.attributes).map(([name, value]: [string, unknown]) =>
              h(Chip, {key: name, label: `${name}: ${String(value)}`}),
            ),
          ),
          h(
            'div',
            {class: 'pg-prime-chips'},
            state.groups.map((group: MembershipGroup) =>
              h(Chip, {class: 'pg-prime-group', key: group.id, label: group.name}),
            ),
          ),
        ]),
      footer: () =>
        state.onDelete
          ? h('div', {class: 'pg-prime-actions'}, [
              h(Button, {
                label: 'Delete',
                loading: state.isDeleting,
                onClick: state.onDelete,
                severity: 'danger',
                text: true,
              }),
            ])
          : null,
      subtitle: () => (state.user ? `${state.user.type} · ${state.user.ouHandle ?? state.user.ouId}` : ''),
      title: () =>
        h('div', {class: 'pg-prime-title'}, [
          h(Avatar, {label: state.displayName.slice(0, 1), shape: 'circle'}),
          state.isLoading && !state.user ? 'Loading…' : state.displayName,
        ]),
    },
  );

/** A secret the SDK hands over once, drawn as a PrimeVue warning with a masked, revealable field. */
const secretNotice = (secret: string, onDismiss?: () => void): VNode =>
  h('div', {class: 'pg-prime-stack'}, [
    h(Message, {severity: 'warn'}, {default: () => 'Copy the client secret now. It will not be shown again.'}),
    h(Password, {feedback: false, modelValue: secret, readonly: true, toggleMask: true}),
    onDismiss ? h(Button, {label: 'Done', onClick: onDismiss}) : null,
  ]);

/** The application form's default scoped slot drawn with PrimeVue inputs and checkboxes. */
export const applicationForm = (state: BaseApplicationCreateRenderProps): VNode =>
  h(
    Card,
    {},
    {
      content: () =>
        state.clientSecret
          ? secretNotice(state.clientSecret, state.onSecretDismiss)
          : h('div', {class: 'pg-prime-stack'}, [
              state.error ? h(Message, {severity: 'error'}, {default: () => state.error}) : null,
              h('label', {class: 'pg-prime-field'}, [
                h('span', 'Name *'),
                h(InputText, {
                  modelValue: state.values.name,
                  'onUpdate:modelValue': (value: string | undefined) => state.handleInputChange('name', value ?? ''),
                }),
              ]),
              h('label', {class: 'pg-prime-field'}, [
                h('span', 'Redirect URIs (comma separated)'),
                h(InputText, {
                  modelValue: state.values.redirectUris,
                  'onUpdate:modelValue': (value: string | undefined) =>
                    state.handleInputChange('redirectUris', value ?? ''),
                }),
              ]),
              h(
                'div',
                {class: 'pg-prime-chips'},
                state.grantTypeOptions.map((option: {label: string; value: string}) =>
                  h('label', {class: 'pg-prime-title', key: option.value}, [
                    h(Checkbox, {
                      binary: true,
                      modelValue: state.values.grantTypes.includes(option.value),
                      'onUpdate:modelValue': (checked: boolean) =>
                        state.handleGrantTypesChange(
                          checked
                            ? [...state.values.grantTypes, option.value]
                            : state.values.grantTypes.filter((value: string) => value !== option.value),
                        ),
                    }),
                    option.label,
                  ]),
                ),
              ),
              h('label', {class: 'pg-prime-title'}, [
                h(Checkbox, {
                  binary: true,
                  modelValue: state.values.publicClient,
                  'onUpdate:modelValue': (checked: boolean) => state.handlePublicClientChange(checked),
                }),
                'Public client',
              ]),
            ]),
      footer: () =>
        state.clientSecret
          ? null
          : h('div', {class: 'pg-prime-actions'}, [
              state.onCancel
                ? h(Button, {label: 'Cancel', onClick: state.onCancel, severity: 'secondary', text: true})
                : null,
              h(Button, {
                disabled: !state.isValid || state.isSubmitting,
                label: 'Create application',
                loading: state.isSubmitting,
                onClick: state.handleSubmit,
              }),
            ]),
      subtitle: () => "Rendered with PrimeVue from the SDK's default scoped slot",
      title: () => 'New application',
    },
  );

/**
 * The application details' default scoped slot drawn as a PrimeVue card. The slot hands over only the
 * actions the app allowed; the SDK leaves the confirmation of a destructive action to the custom UI.
 */
export const applicationCard = (state: BaseApplicationDetailsRenderProps): VNode =>
  h(
    Card,
    {},
    {
      content: () =>
        h('div', {class: 'pg-prime-stack'}, [
          state.error ? h(Message, {severity: 'error'}, {default: () => state.error}) : null,
          state.clientSecret ? secretNotice(state.clientSecret, state.onSecretDismiss) : null,
          h(
            'div',
            {class: 'pg-prime-chips'},
            (state.oauth?.grantTypes ?? []).map((grantType: string) =>
              h(Chip, {class: 'pg-prime-group', key: grantType, label: grantType}),
            ),
          ),
          h(
            'div',
            {class: 'pg-prime-chips'},
            (state.oauth?.redirectUris ?? []).map((uri: string) => h(Chip, {key: uri, label: uri})),
          ),
        ]),
      footer: () =>
        h('div', {class: 'pg-prime-actions'}, [
          state.onRegenerateSecret
            ? h(Button, {
                label: 'Regenerate secret',
                loading: state.isRegeneratingSecret,
                onClick: state.onRegenerateSecret,
                severity: 'secondary',
                text: true,
              })
            : null,
          state.onDelete
            ? h(Button, {
                label: 'Delete',
                loading: state.isDeleting,
                onClick: state.onDelete,
                severity: 'danger',
                text: true,
              })
            : null,
        ]),
      subtitle: () =>
        state.oauth?.clientId ? `Client ID ${state.oauth.clientId}` : (state.application?.template ?? ''),
      title: () => (state.isLoading && !state.application ? 'Loading…' : (state.application?.name ?? '')),
    },
  );
