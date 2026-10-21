// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {H3Event} from 'h3';

export const TRACE_HEADER = 'x-playground-trace';

export interface TraceStep {
  detail: string;
  label: string;
  ms: number;
  status: 'ok' | 'error' | 'info';
}

interface TraceState {
  started: number;
  steps: TraceStep[];
}

const stateOf = (event: H3Event): TraceState => {
  const context: Record<string, unknown> = event.context as Record<string, unknown>;

  context.playgroundTrace ??= {started: Date.now(), steps: []};

  return context.playgroundTrace as TraceState;
};

/**
 * Records one step of the request's trip through the server middleware, the SDK, and the handler.
 * The steps travel back in a response header so the API explorer can show them next to the body.
 */
export const traceStep = (event: H3Event, label: string, detail = '', status: TraceStep['status'] = 'info'): void => {
  const state: TraceState = stateOf(event);

  state.steps.push({detail, label, ms: Date.now() - state.started, status});

  if (!event.node.res.headersSent) {
    setResponseHeader(event, TRACE_HEADER, encodeURIComponent(JSON.stringify(state.steps)));
  }
};

/**
 * Runs one SDK call as a traced step.
 */
export const traced = async <T>(
  event: H3Event,
  label: string,
  call: () => Promise<T>,
  describe: (result: T) => string,
): Promise<T> => {
  try {
    const result: T = await call();

    traceStep(event, label, describe(result), 'ok');

    return result;
  } catch (error) {
    const statusCode: unknown = (error as {statusCode?: unknown})?.statusCode;
    const message: string = error instanceof Error ? error.message : String(error);

    traceStep(event, label, typeof statusCode === 'number' ? `${statusCode} ${message}` : message, 'error');
    throw error;
  }
};
