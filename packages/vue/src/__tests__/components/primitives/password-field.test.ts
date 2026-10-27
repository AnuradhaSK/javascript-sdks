// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {mount} from '@vue/test-utils';
import {afterEach, describe, expect, it} from 'vitest';
import PasswordField from '../../../components/primitives/PasswordField';

const mounted: {unmount: () => void}[] = [];
const mountField = (props: Record<string, unknown> = {}) => {
  const wrapper = mount(PasswordField, {
    attachTo: document.body,
    props: {ariaLabel: 'Password', modelValue: 'hunter2', ...props},
  });
  mounted.push(wrapper);

  return wrapper;
};

const TOGGLE = '.thunderid-password-field__toggle';

describe('PasswordField (vue)', () => {
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  });

  describe('show and hide', () => {
    it('starts with the value hidden', () => {
      const wrapper = mountField();

      expect(wrapper.find('input').attributes('type')).toBe('password');
    });

    it('shows the value on Show and hides it again on Hide', async () => {
      const wrapper = mountField();

      await wrapper.find(TOGGLE).trigger('click');
      expect(wrapper.find('input').attributes('type')).toBe('text');
      expect(wrapper.find(TOGGLE).attributes('aria-label')).toBe('Hide password');

      await wrapper.find(TOGGLE).trigger('click');
      expect(wrapper.find('input').attributes('type')).toBe('password');
      expect(wrapper.find(TOGGLE).attributes('aria-label')).toBe('Show password');
    });

    it('names the button in the wording it is given', async () => {
      const wrapper = mountField({hideLabel: 'Hide', showLabel: 'Show'});

      expect(wrapper.find(TOGGLE).attributes('aria-label')).toBe('Show');

      await wrapper.find(TOGGLE).trigger('click');

      expect(wrapper.find(TOGGLE).attributes('aria-label')).toBe('Hide');
    });

    it('is a plain button, so it does not submit the form it sits in', () => {
      const wrapper = mountField();

      expect(wrapper.find(TOGGLE).attributes('type')).toBe('button');
    });

    it('stays out of the tab order of a field that is edited', () => {
      const wrapper = mountField();

      expect(wrapper.find(TOGGLE).attributes('tabindex')).toBe('-1');
    });
  });

  describe('value', () => {
    it('reports what is typed', async () => {
      const wrapper = mountField();

      await wrapper.find('input').setValue('hunter3');

      expect(wrapper.emitted('update:modelValue')).toEqual([['hunter3']]);
    });

    it('names the input when there is no visible label', () => {
      const wrapper = mountField();

      expect(wrapper.find('input').attributes('aria-label')).toBe('Password');
    });

    it('asks the browser to offer the current password unless told otherwise', () => {
      const wrapper = mountField();

      expect(wrapper.find('input').attributes('autocomplete')).toBe('current-password');
    });
  });

  describe('read only', () => {
    it('keeps the value from being edited and still shows and hides it', async () => {
      const wrapper = mountField({readonly: true});

      expect(wrapper.find('input').attributes('readonly')).toBeDefined();

      await wrapper.find(TOGGLE).trigger('click');

      expect(wrapper.find('input').attributes('type')).toBe('text');
    });

    it('keeps the button in the tab order, since it is the only control left', () => {
      const wrapper = mountField({readonly: true});

      expect(wrapper.find(TOGGLE).attributes('tabindex')).toBe('0');
    });
  });

  describe('append slot', () => {
    it('shows the extra content inside the field, after the show and hide button', () => {
      const wrapper = mount(PasswordField, {
        attachTo: document.body,
        props: {ariaLabel: 'Password', modelValue: 'hunter2'},
        slots: {append: '<button type="button" class="extra">Copy</button>'},
      });
      mounted.push(wrapper);

      const field = wrapper.find('.thunderid-password-field__wrapper');

      expect(field.find('.extra').exists()).toBe(true);
      expect(
        field.find(TOGGLE).element.compareDocumentPosition(field.find('.extra').element) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('adds nothing without it', () => {
      const wrapper = mountField();

      expect(wrapper.find('.thunderid-password-field__wrapper').findAll('button')).toHaveLength(1);
    });
  });
});
