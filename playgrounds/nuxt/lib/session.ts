// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {onBeforeUnmount, onMounted, ref, shallowRef, type Ref, type ShallowRef} from 'vue';
import {describeError} from './events';
import type {PlaygroundSession} from './types';

export const serverSession: ShallowRef<PlaygroundSession | null> = shallowRef<PlaygroundSession | null>(null);
export const serverSessionError: Ref<string | null> = ref<string | null>(null);

/**
 * Loads the server-held session through `GET /api/playground/session` (`useServerSession()`).
 */
export const loadServerSession = async (): Promise<PlaygroundSession | null> => {
  try {
    serverSession.value = await $fetch<PlaygroundSession>('/api/playground/session');
    serverSessionError.value = null;
  } catch (error) {
    serverSession.value = null;
    serverSessionError.value = describeError(error);
  }

  return serverSession.value;
};

/** A clock that ticks on the client only, so server and client render the same first frame. */
export const useNow = (intervalMs = 1000): Ref<number> => {
  const now: Ref<number> = ref<number>(0);
  let timer: ReturnType<typeof setInterval> | undefined;

  onMounted(() => {
    now.value = Date.now();
    timer = setInterval(() => {
      now.value = Date.now();
    }, intervalMs);
  });

  onBeforeUnmount(() => clearInterval(timer));

  return now;
};
