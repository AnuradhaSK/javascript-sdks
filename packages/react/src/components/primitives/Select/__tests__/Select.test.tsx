// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, render, screen} from '@testing-library/react';
import {ReactElement} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {
  changeEventWith,
  chooseOption,
  getAllSelectControls,
  getSelectControl,
  readSelectedLabel,
} from './selectTestUtils';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import Select from '../Select';

const OPTIONS = [
  {label: 'Red', value: 'r'},
  {label: 'Green', value: 'g'},
  {label: 'Blue', value: 'b'},
];

const withProviders = (ui: ReactElement): ReactElement => <ThemeProvider>{ui}</ThemeProvider>;

describe('Select', () => {
  afterEach(cleanup);

  describe('field chrome', () => {
    it('renders the label and marks a required field', () => {
      const {container} = render(withProviders(<Select label="Colour" required options={OPTIONS} />));

      expect(screen.getByText('Colour')).toBeInTheDocument();
      expect(container.querySelector('[class*="input-label__required"]')).not.toBeNull();
      expect(getSelectControl()).toHaveAttribute('aria-required', 'true');
    });

    it('shows the helper text', () => {
      render(withProviders(<Select helperText="Choose a colour" options={OPTIONS} />));

      expect(screen.getByText('Choose a colour')).toBeInTheDocument();
    });

    it('shows the error instead of the helper text and marks the select invalid', () => {
      render(withProviders(<Select error="Colour is required" helperText="Choose a colour" options={OPTIONS} />));

      expect(screen.getByText('Colour is required')).toBeInTheDocument();
      expect(screen.queryByText('Choose a colour')).toBeNull();
      expect(getSelectControl()).toHaveAttribute('aria-invalid', 'true');
    });

    it('applies the class name to the field', () => {
      const {container} = render(withProviders(<Select className="custom" options={OPTIONS} />));

      expect(container.querySelector('.custom')).not.toBeNull();
    });
  });

  describe('options', () => {
    it('renders each option as a native option with its value and label', () => {
      render(withProviders(<Select options={OPTIONS} />));

      expect(Array.from(getSelectControl().options).map((option) => [option.value, option.textContent])).toEqual([
        ['r', 'Red'],
        ['g', 'Green'],
        ['b', 'Blue'],
      ]);
    });

    it('renders the placeholder as an empty option that is shown first', () => {
      render(withProviders(<Select placeholder="Pick one" options={OPTIONS} defaultValue="" />));

      const [placeholder] = Array.from(getSelectControl().options);

      expect(placeholder.value).toBe('');
      expect(placeholder.textContent).toBe('Pick one');
      expect(readSelectedLabel(getSelectControl())).toBe('Pick one');
    });

    it('keeps the placeholder disabled when the field is required', () => {
      render(withProviders(<Select placeholder="Pick one" required options={OPTIONS} defaultValue="" />));

      expect(getSelectControl().options[0].disabled).toBe(true);
    });

    it('lets an optional field be cleared by choosing the placeholder', () => {
      const chosen: string[] = [];
      render(
        withProviders(
          <Select
            placeholder="Pick one"
            options={OPTIONS}
            value="g"
            onChange={(event) => chosen.push(event.target.value)}
          />,
        ),
      );

      expect(getSelectControl().options[0].disabled).toBe(false);

      chooseOption(getSelectControl(), 'Pick one');

      expect(chosen).toEqual(['']);
    });

    it('shows the placeholder again after an optional field that is not controlled is cleared', () => {
      render(withProviders(<Select placeholder="Pick one" options={OPTIONS} />));
      chooseOption(getSelectControl(), 'Blue');

      chooseOption(getSelectControl(), 'Pick one');

      expect(readSelectedLabel(getSelectControl())).toBe('Pick one');
    });

    it('starts an optional field that is not controlled on the placeholder', () => {
      render(withProviders(<Select placeholder="Pick one" options={OPTIONS} />));

      expect(readSelectedLabel(getSelectControl())).toBe('Pick one');
    });

    it('shows the label of the selected value', () => {
      render(withProviders(<Select options={OPTIONS} value="g" onChange={vi.fn()} />));

      expect(readSelectedLabel(getSelectControl())).toBe('Green');
    });
  });

  describe('selecting', () => {
    it('reports the chosen value through a native change event', () => {
      const onChange = vi.fn<(event: {target: HTMLSelectElement}) => void>();
      render(withProviders(<Select options={OPTIONS} defaultValue="r" onChange={onChange} />));

      chooseOption(getSelectControl(), 'Blue');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].target).toBe(getSelectControl());
      expect(onChange.mock.calls[0][0].target.value).toBe('b');
    });

    it('follows the controlled value', () => {
      const {rerender} = render(withProviders(<Select options={OPTIONS} value="r" onChange={vi.fn()} />));

      rerender(withProviders(<Select options={OPTIONS} value="b" onChange={vi.fn()} />));

      expect(readSelectedLabel(getSelectControl())).toBe('Blue');
    });

    it('keeps each select of a form independent', () => {
      render(
        withProviders(
          <>
            <Select options={OPTIONS} defaultValue="r" />
            <Select options={OPTIONS} defaultValue="g" />
          </>,
        ),
      );

      const [first, second] = getAllSelectControls();
      chooseOption(first, 'Blue');

      expect(readSelectedLabel(first)).toBe('Blue');
      expect(readSelectedLabel(second)).toBe('Green');
    });
  });

  describe('native attributes', () => {
    it('forwards the attributes of a select element', () => {
      render(
        withProviders(<Select id="colour" name="colour" data-testid="colour-select" options={OPTIONS} multiple />),
      );

      const control = screen.getByTestId<HTMLSelectElement>('colour-select');

      expect(control.id).toBe('colour');
      expect(control.name).toBe('colour');
      expect(control.multiple).toBe(true);
    });

    it('submits its value with the form', () => {
      const {container} = render(
        withProviders(
          <form>
            <Select name="colour" options={OPTIONS} defaultValue="g" />
          </form>,
        ),
      );

      expect(new FormData(container.querySelector('form')!).get('colour')).toBe('g');
    });

    it('can be disabled', () => {
      render(withProviders(<Select disabled options={OPTIONS} />));

      expect(getSelectControl()).toBeDisabled();
    });
  });

  describe('options given as plain values', () => {
    it('accepts strings and numbers, and skips empty entries', () => {
      render(withProviders(<Select options={['Red', 7, null, undefined, {label: 'Blue', value: 'b'}]} />));

      expect(Array.from(getSelectControl().options).map((option) => [option.value, option.textContent])).toEqual([
        ['Red', 'Red'],
        ['7', '7'],
        ['b', 'Blue'],
      ]);
    });

    it('renders no options without any', () => {
      render(withProviders(<Select options={null} />));

      expect(getSelectControl().options).toHaveLength(0);
    });

    it('disables an option marked disabled', () => {
      render(withProviders(<Select options={[{label: 'Red', value: 'r', disabled: true}, ...OPTIONS.slice(1)]} />));

      expect(getSelectControl().options[0].disabled).toBe(true);
      expect(getSelectControl().options[1].disabled).toBe(false);
    });
  });

  describe('a selected value that is not among the options', () => {
    const selectedOption = {label: 'Saved colour', value: 'saved'};

    it('shows the label of the selected option', () => {
      render(
        withProviders(<Select options={OPTIONS} value="saved" selectedOption={selectedOption} onChange={vi.fn()} />),
      );

      expect(readSelectedLabel(getSelectControl())).toBe('Saved colour');
    });

    it('adds no option when the value is among the options', () => {
      render(withProviders(<Select options={OPTIONS} value="g" selectedOption={selectedOption} onChange={vi.fn()} />));

      expect(getSelectControl().options).toHaveLength(OPTIONS.length);
    });

    it('adds no option for a different value', () => {
      render(withProviders(<Select options={OPTIONS} value="g" selectedOption={selectedOption} onChange={vi.fn()} />));

      expect(screen.queryByRole('option', {name: 'Saved colour'})).toBeNull();
    });

    it('adds no option when the value is not controlled', () => {
      render(withProviders(<Select options={OPTIONS} selectedOption={selectedOption} />));

      expect(screen.queryByRole('option', {name: 'Saved colour'})).toBeNull();
    });
  });

  describe('Load more', () => {
    const optionLabels = (): (string | null)[] => Array.from(getSelectControl().options).map((o) => o.textContent);

    it('lists no Load more option, and no status line, without a callback', () => {
      const {container} = render(withProviders(<Select options={OPTIONS} />));

      expect(optionLabels()).toEqual(['Red', 'Green', 'Blue']);
      expect(container.querySelector('[role="status"]')).toBeNull();
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('lists a Load more option after the last option when there is a callback', () => {
      render(withProviders(<Select options={OPTIONS} onLoadMore={vi.fn()} />));

      expect(optionLabels()).toEqual(['Red', 'Green', 'Blue', 'Load more']);
      expect(screen.getByRole('option', {name: 'Load more'})).toBeEnabled();
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('calls the callback each time the option is chosen', () => {
      const onLoadMore = vi.fn();
      render(withProviders(<Select options={OPTIONS} onLoadMore={onLoadMore} />));

      chooseOption(getSelectControl(), 'Load more');
      chooseOption(getSelectControl(), 'Load more');

      expect(onLoadMore).toHaveBeenCalledTimes(2);
    });

    it('neither changes the selection nor calls onChange when the option is chosen', () => {
      const onChange = vi.fn();
      render(withProviders(<Select options={OPTIONS} value="g" onChange={onChange} onLoadMore={vi.fn()} />));

      chooseOption(getSelectControl(), 'Load more');

      expect(onChange).not.toHaveBeenCalled();
      expect(readSelectedLabel(getSelectControl())).toBe('Green');
    });

    it('puts back the first selection of a select that is not controlled', () => {
      render(withProviders(<Select options={OPTIONS} onLoadMore={vi.fn()} />));

      chooseOption(getSelectControl(), 'Load more');

      expect(readSelectedLabel(getSelectControl())).toBe('Red');
    });

    it('puts back an empty choice of an optional select that is not controlled', () => {
      render(withProviders(<Select placeholder="Pick one" options={OPTIONS} onLoadMore={vi.fn()} />));
      chooseOption(getSelectControl(), 'Blue');
      chooseOption(getSelectControl(), 'Pick one');

      chooseOption(getSelectControl(), 'Load more');

      expect(readSelectedLabel(getSelectControl())).toBe('Pick one');
    });

    it('puts back the last choice of a select that is not controlled', () => {
      render(withProviders(<Select options={OPTIONS} defaultValue="g" onLoadMore={vi.fn()} />));
      chooseOption(getSelectControl(), 'Blue');

      chooseOption(getSelectControl(), 'Load more');

      expect(readSelectedLabel(getSelectControl())).toBe('Blue');
    });

    it('still passes every other choice to onChange', () => {
      const onChange = vi.fn();
      render(withProviders(<Select options={OPTIONS} onChange={onChange} onLoadMore={vi.fn()} />));

      chooseOption(getSelectControl(), 'Blue');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(changeEventWith('b'));
    });

    it('never submits the option as the value of the field', () => {
      const {container} = render(
        withProviders(
          <form>
            <Select name="colour" options={OPTIONS} defaultValue="g" onLoadMore={vi.fn()} />
          </form>,
        ),
      );

      chooseOption(getSelectControl(), 'Load more');

      expect(new FormData(container.querySelector('form')!).get('colour')).toBe('g');
    });

    it('waits while loading: the option is disabled and says so', () => {
      render(withProviders(<Select options={OPTIONS} loading onLoadMore={vi.fn()} />));

      expect(optionLabels()).toEqual(['Red', 'Green', 'Blue', 'Loading more…']);
      expect(screen.getByRole('option', {name: 'Loading more…'})).toBeDisabled();
    });

    it('says in the status line that more options are loading', () => {
      render(withProviders(<Select options={OPTIONS} loading onLoadMore={vi.fn()} />));

      expect(screen.getByRole('status')).toHaveTextContent('Loading more…');
    });

    it('lets the options already listed stay selectable while loading', () => {
      render(withProviders(<Select options={OPTIONS} loading onLoadMore={vi.fn()} />));

      expect(getSelectControl()).toBeEnabled();
      expect(getSelectControl()).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('loading and empty states', () => {
    it('shows a loading message, and no Load more option, while the first options load', () => {
      render(withProviders(<Select options={[]} loading onLoadMore={vi.fn()} />));

      expect(screen.getByRole('status')).toHaveTextContent('Loading…');
      expect(getSelectControl().options).toHaveLength(0);
    });

    it('lists the option again when nothing loaded and nothing is loading, so a failed load can be retried', () => {
      render(withProviders(<Select options={[]} onLoadMore={vi.fn()} emptyText="Nothing here" />));

      expect(screen.getByRole('option', {name: 'Load more'})).toBeInTheDocument();
      expect(screen.queryByText('Nothing here')).toBeNull();
    });

    it('shows the empty text when there is nothing to pick and nothing more to load', () => {
      render(withProviders(<Select options={[]} emptyText="Nothing here" />));

      expect(screen.getByRole('status')).toHaveTextContent('Nothing here');
    });

    it('shows no empty text while loading', () => {
      render(withProviders(<Select options={[]} loading emptyText="Nothing here" />));

      expect(screen.queryByText('Nothing here')).toBeNull();
    });

    it('shows no empty text when there are options', () => {
      render(withProviders(<Select options={OPTIONS} emptyText="Nothing here" />));

      expect(screen.queryByText('Nothing here')).toBeNull();
    });

    it('shows no empty text when none was given', () => {
      const {container} = render(withProviders(<Select options={[]} />));

      expect(container.querySelector('[role="status"]')).toBeNull();
    });
  });
});
