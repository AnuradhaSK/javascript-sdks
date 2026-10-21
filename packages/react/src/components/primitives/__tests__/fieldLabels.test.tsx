// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, render, screen} from '@testing-library/react';
import {ReactElement} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import ThemeProvider from '../../../contexts/Theme/ThemeProvider';
import AffixedField from '../AffixedField/AffixedField';
import Checkbox from '../Checkbox/Checkbox';
import DatePicker from '../DatePicker/DatePicker';
import MultiInput from '../MultiInput/MultiInput';
import OtpField from '../OtpField/OtpField';
import PasswordField from '../PasswordField/PasswordField';
import Select from '../Select/Select';
import Toggle from '../Toggle/Toggle';

const withProviders = (ui: ReactElement): ReactElement => <ThemeProvider>{ui}</ThemeProvider>;

const fields: [string, (props: {error?: string; id?: string}) => ReactElement][] = [
  ['PasswordField', (props) => <PasswordField label="Field" onChange={vi.fn()} {...props} />],
  ['Select', (props) => <Select label="Field" options={[{label: 'One', value: '1'}]} {...props} />],
  ['Checkbox', (props) => <Checkbox label="Field" {...props} />],
  ['Toggle', (props) => <Toggle label="Field" {...props} />],
  ['DatePicker', (props) => <DatePicker label="Field" {...props} />],
  ['AffixedField', (props) => <AffixedField label="Field" {...props} />],
];

describe.each(fields)('%s label and description', (_name, renderField) => {
  afterEach(cleanup);

  it('names the control with its label', () => {
    render(withProviders(renderField({})));

    expect(screen.getByLabelText('Field')).toBeInTheDocument();
  });

  it('keeps an id the caller gives', () => {
    render(withProviders(renderField({id: 'field'})));

    expect(screen.getByLabelText('Field')).toHaveAttribute('id', 'field');
  });

  it('describes an invalid control with its error', () => {
    render(withProviders(renderField({error: 'Fix this'})));
    const control: HTMLElement = screen.getByLabelText('Field');

    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAccessibleDescription('Fix this');
  });
});

describe('MultiInput label and description', () => {
  afterEach(cleanup);

  it('names the entry input with its label and describes it with the helper text', () => {
    render(withProviders(<MultiInput label="Emails" helperText="Add one or more" values={[]} onChange={vi.fn()} />));

    expect(screen.getByLabelText('Emails')).toHaveAccessibleDescription('Add one or more');
  });
});

describe('OtpField label and description', () => {
  afterEach(cleanup);

  it('names the group of digit inputs with its label', () => {
    render(withProviders(<OtpField label="Code" length={4} />));

    expect(screen.getByRole('group', {name: 'Code'})).toBeInTheDocument();
  });

  it('describes each invalid digit input with the error', () => {
    render(withProviders(<OtpField label="Code" length={4} error="Wrong code" />));

    screen.getAllByRole('textbox').forEach((input: HTMLElement) => {
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAccessibleDescription('Wrong code');
    });
  });
});
