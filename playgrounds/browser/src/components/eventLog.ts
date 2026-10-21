// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {h, mount} from '../lib/dom';
import {clearEvents, eventStore, PlaygroundEvent} from '../lib/events';
import {Scope} from '../lib/store';

/**
 * The live SDK event log: `client.on()` hooks (`on:*`) plus the calls the playground makes.
 */
export const eventLog = (scope: Scope): HTMLElement => {
  const list: HTMLOListElement = h('ol', {className: 'pg-events'});

  const render = (): void => {
    const events: PlaygroundEvent[] = eventStore.get();

    mount(
      list,
      events.map((event: PlaygroundEvent) =>
        h(
          'li',
          {},
          h('span', {className: 'pg-ev-time'}, event.time),
          h('span', {className: 'pg-ev-name', 'data-kind': event.kind}, event.name),
          h('span', {className: 'pg-ev-detail', title: event.detail}, event.detail),
        ),
      ),
      events.length === 0 && h('li', {className: 'pg-empty'}, 'No events yet.'),
    );
  };

  render();
  scope.add(eventStore.subscribe(render));

  return h(
    'section',
    {'aria-label': 'Events', className: 'pg-card'},
    h(
      'div',
      {className: 'pg-card-head'},
      h('h2', {}, 'SDK events'),
      h('button', {className: 'pg-link-btn', onclick: clearEvents, type: 'button'}, 'Clear'),
    ),
    list,
  );
};
