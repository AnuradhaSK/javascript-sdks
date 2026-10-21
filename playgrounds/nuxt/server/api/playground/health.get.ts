// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {PlaygroundHealth} from '../../../lib/types';
import {traceStep} from '../../lib/trace';

/**
 * GET /api/playground/health
 *
 * Probes the ThunderID liveness endpoint from the Nuxt server. The browser never talks to ThunderID
 * in a Nuxt app, so reachability is checked where the SDK actually runs.
 */
export default defineEventHandler(async (event): Promise<PlaygroundHealth> => {
  const {baseUrl} = useRuntimeConfig(event).public.thunderid;
  const url = `${String(baseUrl ?? '').replace(/\/+$/, '')}/health/liveness`;

  if (!baseUrl) {
    traceStep(event, 'handler', 'NUXT_PUBLIC_THUNDERID_BASE_URL is not set', 'error');

    return {detail: 'NUXT_PUBLIC_THUNDERID_BASE_URL is not set', state: 'down', url};
  }

  try {
    const response: Response = await fetch(url, {signal: AbortSignal.timeout(3000)});

    traceStep(event, 'fetch /health/liveness', `HTTP ${response.status}`, response.ok ? 'ok' : 'error');

    return {detail: response.ok ? 'healthy' : `HTTP ${response.status}`, state: response.ok ? 'up' : 'down', url};
  } catch (error) {
    const cause: unknown = error instanceof Error ? error.cause : undefined;
    const detail = `unreachable: ${cause instanceof Error ? cause.message : String(error)}`;

    traceStep(event, 'fetch /health/liveness', detail, 'error');

    return {detail, state: 'down', url};
  }
});
