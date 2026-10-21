// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {OtpField, PasswordField, Select} from '@thunderid/react';
import {ChangeEvent, ReactElement, ReactNode, useState} from 'react';
import type {Action, Args} from './types';

const str = (args: Args, key: string): string => String(args[key] ?? '');
const bool = (args: Args, key: string): boolean => args[key] === true;
const num = (args: Args, key: string): number => Number(args[key] ?? 0);

export const PasswordFieldStory = ({action, args}: {action: Action; args: Args}): ReactElement => {
  const [value, setValue] = useState<string>('');

  return (
    <div style={{width: 320, maxWidth: '100%'}}>
      <PasswordField
        label={str(args, 'label')}
        placeholder={str(args, 'placeholder')}
        helperText={str(args, 'helperText') || undefined}
        error={str(args, 'error') || undefined}
        disabled={bool(args, 'disabled')}
        required={bool(args, 'required')}
        value={value}
        onChange={(next: string) => {
          setValue(next);
          action('onChange', `"${'•'.repeat(next.length)}"`);
        }}
      />
    </div>
  );
};

export const OtpFieldStory = ({action, args}: {action: Action; args: Args}): ReactElement => {
  const [value, setValue] = useState<string>('');

  return (
    <OtpField
      label={str(args, 'label')}
      length={num(args, 'length')}
      type={str(args, 'type') as 'text' | 'number' | 'password'}
      disabled={bool(args, 'disabled')}
      error={str(args, 'error') || undefined}
      value={value}
      onChange={(event: {target: {value: string}}) => {
        setValue(event.target.value);
        action('onChange', `"${event.target.value}"`);
      }}
      onComplete={(code: string) => action('onComplete', `"${code}"`)}
    />
  );
};

export const SelectStory = ({action, args}: {action: Action; args: Args}): ReactElement => {
  const [value, setValue] = useState<string>('');

  return (
    <div style={{width: 320, maxWidth: '100%'}}>
      <Select
        label={str(args, 'label')}
        placeholder={str(args, 'placeholder')}
        helperText={str(args, 'helperText') || undefined}
        error={str(args, 'error') || undefined}
        disabled={bool(args, 'disabled')}
        loading={bool(args, 'loading')}
        options={[
          {label: 'Engineering', value: 'eng'},
          {label: 'Design', value: 'design'},
          {label: 'Sales', value: 'sales'},
        ]}
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          setValue(event.target.value);
          action('onChange', `"${event.target.value}"`);
        }}
      />
    </div>
  );
};

export const Narrow = ({children, width = 360}: {children: ReactNode; width?: number}): ReactElement => (
  <div style={{width, maxWidth: '100%'}}>{children}</div>
);
