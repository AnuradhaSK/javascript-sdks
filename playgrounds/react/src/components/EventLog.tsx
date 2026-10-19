// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ReactElement} from 'react';
import {clearEvents, PlaygroundEvent, useEvents} from '../lib/events';

const EventLog = (): ReactElement => {
  const events: PlaygroundEvent[] = useEvents();

  return (
    <section aria-label="Events" className="pg-card">
      <div className="pg-card-head">
        <h2>SDK events</h2>
        <button type="button" className="pg-link-btn" onClick={clearEvents}>
          Clear
        </button>
      </div>
      <ol className="pg-events">
        {events.map((event: PlaygroundEvent) => (
          <li key={event.id}>
            <span className="pg-ev-time">{event.time}</span>
            <span className="pg-ev-name" data-kind={event.kind}>
              {event.name}
            </span>
            <span className="pg-ev-detail" title={event.detail}>
              {event.detail}
            </span>
          </li>
        ))}
        {events.length === 0 && <li className="pg-empty">No events yet.</li>}
      </ol>
    </section>
  );
};

export default EventLog;
