// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ReactElement} from 'react';
import type {TraceStep} from '../lib/serverSession';

/**
 * The SDK calls a piece of server code made, in order, with their timing.
 */
const Trace = ({steps}: {steps: TraceStep[]}): ReactElement => (
  <ol className="pg-trace">
    {steps.map((step: TraceStep, index: number) => (
      // Steps are an ordered log; the index is their identity.
      // eslint-disable-next-line react/no-array-index-key
      <li key={index}>
        <span className="pg-trace-dot" data-kind={step.kind} aria-hidden="true" />
        <div>
          <div className="pg-trace-name">
            {step.name}
            {step.durationMs > 0 && <small>{step.durationMs.toFixed(1)} ms</small>}
          </div>
          <div className="pg-trace-detail">{step.detail}</div>
        </div>
      </li>
    ))}
    {steps.length === 0 && <li className="pg-empty">No SDK calls.</li>}
  </ol>
);

export default Trace;
