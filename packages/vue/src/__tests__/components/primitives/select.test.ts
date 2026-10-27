// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {mount} from '@vue/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import Select from '../../../components/primitives/Select';
import {chooseOption, findAllSelectControls, findSelectControl, readSelectedLabel} from '../../helpers/selectControl';

const OPTIONS = [
  {label: 'Red', value: 'r'},
  {label: 'Green', value: 'g'},
  {label: 'Blue', value: 'b'},
];

const mounted: {unmount: () => void}[] = [];
const mountSelect = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => {
  const wrapper = mount(Select, {attachTo: document.body, attrs, props: {options: OPTIONS, ...props}});
  mounted.push(wrapper);

  return wrapper;
};

describe('Select (vue)', () => {
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  });

  describe('field chrome', () => {
    it('renders the label and marks a required field', () => {
      const wrapper = mountSelect({label: 'Colour', name: 'colour', required: true});

      expect(wrapper.find('label').text()).toContain('Colour');
      expect(wrapper.find('[class*="select__required"]').exists()).toBe(true);
      expect(findSelectControl(wrapper).attributes('required')).toBeDefined();
    });

    it('shows the helper text', () => {
      const wrapper = mountSelect({helperText: 'Choose a colour'});

      expect(wrapper.text()).toContain('Choose a colour');
    });

    it('shows the error instead of the helper text', () => {
      const wrapper = mountSelect({error: 'Colour is required', helperText: 'Choose a colour'});

      expect(wrapper.text()).toContain('Colour is required');
      expect(wrapper.text()).not.toContain('Choose a colour');
    });

    it('applies the class and style of the host to the field', () => {
      const wrapper = mountSelect({}, {class: 'custom', style: 'width: 40%'});

      expect(wrapper.classes()).toContain('custom');
      expect((wrapper.element as HTMLElement).style.width).toBe('40%');
    });
  });

  describe('events', () => {
    it('tells the host when the select is left', async () => {
      const onBlur = vi.fn();
      const wrapper = mountSelect({}, {onBlur});

      await findSelectControl(wrapper).trigger('blur');

      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('options', () => {
    it('renders each option as a native option with its value and label', () => {
      const wrapper = mountSelect();

      const options = Array.from((findSelectControl(wrapper).element as HTMLSelectElement).options);

      expect(options.map((option) => [option.value, option.textContent])).toEqual([
        ['r', 'Red'],
        ['g', 'Green'],
        ['b', 'Blue'],
      ]);
    });

    it('renders the placeholder as an empty option that is shown first', () => {
      const wrapper = mountSelect({modelValue: '', placeholder: 'Pick one'});

      const [placeholder] = Array.from((findSelectControl(wrapper).element as HTMLSelectElement).options);

      expect(placeholder.value).toBe('');
      expect(placeholder.textContent?.trim()).toBe('Pick one');
      expect(readSelectedLabel(findSelectControl(wrapper))).toBe('Pick one');
    });

    it('keeps the placeholder disabled when the field is required', () => {
      const wrapper = mountSelect({modelValue: '', placeholder: 'Pick one', required: true});

      expect((findSelectControl(wrapper).element as HTMLSelectElement).options[0].disabled).toBe(true);
    });

    it('lets an optional field be cleared by choosing the placeholder', async () => {
      const wrapper = mountSelect({modelValue: 'g', placeholder: 'Pick one'});

      expect((findSelectControl(wrapper).element as HTMLSelectElement).options[0].disabled).toBe(false);

      await chooseOption(findSelectControl(wrapper), 'Pick one');

      expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    });

    it('shows the label of the selected value', () => {
      const wrapper = mountSelect({modelValue: 'g'});

      expect(readSelectedLabel(findSelectControl(wrapper))).toBe('Green');
    });
  });

  describe('selecting', () => {
    it('emits the chosen value through update:modelValue', async () => {
      const wrapper = mountSelect({modelValue: 'r'});

      await chooseOption(findSelectControl(wrapper), 'Blue');

      expect(wrapper.emitted('update:modelValue')).toEqual([['b']]);
    });

    it('follows the model value', async () => {
      const wrapper = mountSelect({modelValue: 'r'});

      await wrapper.setProps({modelValue: 'b'});

      expect(readSelectedLabel(findSelectControl(wrapper))).toBe('Blue');
    });

    it('keeps each select of a form independent', async () => {
      const first = mountSelect({modelValue: 'r'});
      const second = mountSelect({modelValue: 'g'});

      await chooseOption(findAllSelectControls(first)[0], 'Blue');

      expect(first.emitted('update:modelValue')).toEqual([['b']]);
      expect(second.emitted('update:modelValue')).toBeUndefined();
    });
  });

  describe('native attributes', () => {
    it('names the select and ties the label to it', () => {
      const wrapper = mountSelect({label: 'Colour', name: 'colour'});

      expect(findSelectControl(wrapper).attributes('name')).toBe('colour');
      expect(findSelectControl(wrapper).attributes('id')).toBe('colour');
      expect(wrapper.find('label').attributes('for')).toBe('colour');
    });

    it('can be disabled', () => {
      const wrapper = mountSelect({disabled: true});

      expect(findSelectControl(wrapper).attributes('disabled')).toBeDefined();
    });
  });

  describe('options given as plain values', () => {
    it('accepts strings and numbers, and skips empty entries', () => {
      const wrapper = mountSelect({options: ['Red', 7, null, undefined, {label: 'Blue', value: 'b'}]});

      const options = Array.from((findSelectControl(wrapper).element as HTMLSelectElement).options);

      expect(options.map((option) => [option.value, option.textContent])).toEqual([
        ['Red', 'Red'],
        ['7', '7'],
        ['b', 'Blue'],
      ]);
    });

    it('renders no options without any', () => {
      const wrapper = mountSelect({options: null});

      expect((findSelectControl(wrapper).element as HTMLSelectElement).options).toHaveLength(0);
    });

    it('disables an option marked disabled', () => {
      const wrapper = mountSelect({options: [{label: 'Red', value: 'r', disabled: true}, ...OPTIONS.slice(1)]});

      const options = (findSelectControl(wrapper).element as HTMLSelectElement).options;

      expect(options[0].disabled).toBe(true);
      expect(options[1].disabled).toBe(false);
    });
  });

  describe('a selected value that is not among the options', () => {
    const selectedOption = {label: 'Saved colour', value: 'saved'};

    it('shows the label of the selected option', () => {
      const wrapper = mountSelect({modelValue: 'saved', selectedOption});

      expect(readSelectedLabel(findSelectControl(wrapper))).toBe('Saved colour');
    });

    it('adds no option when the value is among the options', () => {
      const wrapper = mountSelect({modelValue: 'g', selectedOption});

      expect((findSelectControl(wrapper).element as HTMLSelectElement).options).toHaveLength(OPTIONS.length);
    });

    it('adds no option for a different value', () => {
      const wrapper = mountSelect({modelValue: 'g', selectedOption});

      expect(wrapper.text()).not.toContain('Saved colour');
    });
  });

  describe('Load more', () => {
    const LOAD_MORE = '.thunderid-select__load-more';
    const optionLabels = (wrapper: ReturnType<typeof mountSelect>): string[] =>
      Array.from((findSelectControl(wrapper).element as HTMLSelectElement).options).map(
        (option) => option.textContent?.trim() ?? '',
      );

    it('lists no Load more option, and no status line, without a callback', () => {
      const wrapper = mountSelect();

      expect(optionLabels(wrapper)).toEqual(['Red', 'Green', 'Blue']);
      expect(wrapper.find('[role="status"]').exists()).toBe(false);
      expect(wrapper.find('button').exists()).toBe(false);
    });

    it('lists a Load more option after the last option when there is a callback', () => {
      const wrapper = mountSelect({onLoadMore: vi.fn()});

      expect(optionLabels(wrapper)).toEqual(['Red', 'Green', 'Blue', 'Load more']);
      expect(wrapper.find(LOAD_MORE).attributes('disabled')).toBeUndefined();
      expect(wrapper.find('button').exists()).toBe(false);
    });

    it('calls the callback each time the option is chosen', async () => {
      const onLoadMore = vi.fn();
      const wrapper = mountSelect({onLoadMore});

      await chooseOption(findSelectControl(wrapper), 'Load more');
      await chooseOption(findSelectControl(wrapper), 'Load more');

      expect(onLoadMore).toHaveBeenCalledTimes(2);
    });

    it('neither changes the selection nor emits a value when the option is chosen', async () => {
      const wrapper = mountSelect({modelValue: 'g', onLoadMore: vi.fn()});

      await chooseOption(findSelectControl(wrapper), 'Load more');

      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
      expect(readSelectedLabel(findSelectControl(wrapper))).toBe('Green');
    });

    it('still emits every other choice', async () => {
      const wrapper = mountSelect({modelValue: 'g', onLoadMore: vi.fn()});

      await chooseOption(findSelectControl(wrapper), 'Blue');

      expect(wrapper.emitted('update:modelValue')).toEqual([['b']]);
    });

    it('never submits the option as the value of the field', async () => {
      const wrapper = mountSelect({modelValue: 'g', name: 'colour', onLoadMore: vi.fn()});

      await chooseOption(findSelectControl(wrapper), 'Load more');

      expect((findSelectControl(wrapper).element as HTMLSelectElement).value).toBe('g');
    });

    it('waits while loading: the option is disabled and says so', () => {
      const wrapper = mountSelect({loading: true, onLoadMore: vi.fn()});

      expect(optionLabels(wrapper)).toEqual(['Red', 'Green', 'Blue', 'Loading more…']);
      expect(wrapper.find(LOAD_MORE).attributes('disabled')).toBeDefined();
    });

    it('says in the status line that more options are loading', () => {
      const wrapper = mountSelect({loading: true, onLoadMore: vi.fn()});

      expect(wrapper.find('[role="status"]').text()).toBe('Loading more…');
    });

    it('lets the options already listed stay selectable while loading', () => {
      const wrapper = mountSelect({loading: true, onLoadMore: vi.fn()});

      expect(findSelectControl(wrapper).attributes('disabled')).toBeUndefined();
      expect(findSelectControl(wrapper).attributes('aria-busy')).toBe('true');
    });
  });

  describe('loading and empty states', () => {
    const LOAD_MORE = '.thunderid-select__load-more';

    it('shows a loading message, and no Load more option, while the first options load', () => {
      const wrapper = mountSelect({loading: true, onLoadMore: vi.fn(), options: []});

      expect(wrapper.find('[role="status"]').text()).toBe('Loading…');
      expect(wrapper.find(LOAD_MORE).exists()).toBe(false);
    });

    it('lists the option again when nothing loaded and nothing is loading, so a failed load can be retried', () => {
      const wrapper = mountSelect({emptyText: 'Nothing here', onLoadMore: vi.fn(), options: []});

      expect(wrapper.find(LOAD_MORE).exists()).toBe(true);
      expect(wrapper.text()).not.toContain('Nothing here');
    });

    it('shows the empty text when there is nothing to pick and nothing more to load', () => {
      const wrapper = mountSelect({emptyText: 'Nothing here', options: []});

      expect(wrapper.find('[role="status"]').text()).toBe('Nothing here');
    });

    it('shows no empty text while loading', () => {
      const wrapper = mountSelect({emptyText: 'Nothing here', loading: true, options: []});

      expect(wrapper.text()).not.toContain('Nothing here');
    });

    it('shows no empty text when there are options', () => {
      const wrapper = mountSelect({emptyText: 'Nothing here'});

      expect(wrapper.text()).not.toContain('Nothing here');
    });

    it('shows no empty text when none was given', () => {
      const wrapper = mountSelect({options: []});

      expect(wrapper.find('[role="status"]').exists()).toBe(false);
    });
  });
});
