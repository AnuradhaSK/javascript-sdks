<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {EmbeddedFlowComponent, FetchSelectPage, SelectPage} from '@thunderid/browser';
import {
  useFetchAuthFlows,
  useFetchUsers,
  useFetchUserTypes,
  useFlow,
  useFlowMeta,
  useI18n,
  useTheme,
  useThunderID,
  useUser,
} from '@thunderid/vue';
import {computed, ComputedRef, Ref, ref, shallowRef, ShallowRef} from 'vue';
import ComposableCard from '../components/ComposableCard.vue';
import EventLog from '../components/EventLog.vue';
import {describeError, track} from '../lib/events';

interface FetcherState {
  data: SelectPage | null;
  error: string | null;
  isLoading: boolean;
}

const sdk = useThunderID();
const user = useUser();
const i18n = useI18n();
const theme = useTheme();
const flow = useFlow();
const flowMeta = useFlowMeta();
const {isSignedIn} = sdk;
const error: Ref<string | null> = ref<string | null>(null);

const FETCHERS: [string, FetchSelectPage][] = [
  ['useFetchUsers()', useFetchUsers()],
  ['useFetchUserTypes()', useFetchUserTypes()],
  ['useFetchAuthFlows()', useFetchAuthFlows()],
];

const fetched: ShallowRef<Record<string, FetcherState>> = shallowRef<Record<string, FetcherState>>({});

const call = (label: string, run: () => Promise<unknown>): void => {
  error.value = null;
  track(label, run).catch((caught: unknown) => {
    error.value = describeError(caught);
  });
};

const runFetcher = async (name: string, fetcher: FetchSelectPage): Promise<void> => {
  const set = (state: FetcherState): void => {
    fetched.value = {...fetched.value, [name]: state};
  };

  set({data: null, error: null, isLoading: true});

  try {
    const page: SelectPage = await track(
      name,
      () =>
        fetcher({
          // The fetchers only read paging fields; the flow component is passed through by selects.
          component: {} as EmbeddedFlowComponent,
          limit: 5,
          offset: 0,
          signal: new AbortController().signal,
        }),
      (result: SelectPage) => `${(result.options ?? result.items ?? []).length} results`,
    );

    set({data: page, error: null, isLoading: false});
  } catch (caught) {
    set({data: null, error: describeError(caught), isLoading: false});
  }
};

const languages: ComputedRef<string[]> = computed(() => Object.keys(i18n.bundles.value));

const i18nValue: ComputedRef<Record<string, unknown>> = computed(() => ({
  ...i18n,
  bundles: languages.value,
  samples: {
    "t('elements.buttons.signin.text')": i18n.t('elements.buttons.signin.text'),
    "t('elements.buttons.signout.text')": i18n.t('elements.buttons.signout.text'),
    "t('elements.buttons.signup.text')": i18n.t('elements.buttons.signup.text'),
  },
}));

const themeValue: ComputedRef<Record<string, unknown>> = computed(() => {
  const variables: Record<string, string> = theme.theme.value.cssVariables ?? {};

  return {
    colorScheme: theme.colorScheme.value,
    cssVariables: `${Object.keys(variables).length} variables`,
    direction: theme.direction.value,
    sample: Object.fromEntries(Object.entries(variables).slice(0, 8)),
    toggleTheme: theme.toggleTheme,
  };
});
</script>

<template>
  <main class="pg-main">
    <div class="pg-heading">
      <div>
        <h1>Composables</h1>
        <p>
          Live values from every composable <span class="pg-accent">@thunderid/vue</span> exposes. Refs are unwrapped,
          functions are shown as signatures; use the buttons to call them.
        </p>
      </div>
    </div>

    <div v-if="error" class="pg-warning" role="alert">{{ error }}</div>

    <div class="pg-grid-2">
      <ComposableCard
        name="useThunderID()"
        signature="ThunderIDContext: reactive state refs, config, and auth functions"
        :value="sdk"
      >
        <template #actions>
          <button
            type="button"
            class="pg-btn"
            data-size="sm"
            :disabled="isSignedIn"
            @click="call('signIn', sdk.signIn)"
          >
            signIn()
          </button>
          <button
            type="button"
            class="pg-btn"
            data-size="sm"
            @click="call('signInSilently', () => sdk.signInSilently())"
          >
            signInSilently()
          </button>
          <button
            type="button"
            class="pg-btn"
            data-size="sm"
            :disabled="!isSignedIn"
            @click="call('signOut', sdk.signOut)"
          >
            signOut()
          </button>
        </template>
      </ComposableCard>

      <ComposableCard
        name="useUser()"
        signature="{profile, flattenedProfile, userSchema, revalidateProfile, updateProfile, onUpdateProfile}"
        :value="user"
      >
        <template #actions>
          <button
            type="button"
            class="pg-btn"
            data-size="sm"
            :disabled="!isSignedIn"
            @click="call('revalidateProfile', user.revalidateProfile)"
          >
            revalidateProfile()
          </button>
        </template>
      </ComposableCard>

      <ComposableCard
        name="useI18n()"
        signature="{currentLanguage, fallbackLanguage, bundles, setLanguage, injectBundles, t}"
        :value="i18nValue"
      >
        <template #actions>
          <button
            v-for="language in languages"
            :key="language"
            type="button"
            class="pg-btn"
            data-size="sm"
            :aria-pressed="language === i18n.currentLanguage.value"
            @click="i18n.setLanguage(language)"
          >
            {{ language }}
          </button>
        </template>
      </ComposableCard>

      <ComposableCard name="useTheme()" signature="{theme, colorScheme, direction, toggleTheme}" :value="themeValue">
        <template #actions>
          <button type="button" class="pg-btn" data-size="sm" @click="theme.toggleTheme()">toggleTheme()</button>
        </template>
      </ComposableCard>

      <ComposableCard
        name="useFlow()"
        signature="FlowContextValue: current step, title, and messages for embedded flows"
        :value="flow"
      />

      <ComposableCard
        name="useFlowMeta()"
        signature="{meta, isLoading, error, fetchFlowMeta, switchLanguage}"
        :value="{error: flowMeta.error.value?.message ?? null, isLoading: flowMeta.isLoading, meta: flowMeta.meta}"
      >
        <template #actions>
          <button type="button" class="pg-btn" data-size="sm" @click="call('fetchFlowMeta', flowMeta.fetchFlowMeta)">
            fetchFlowMeta()
          </button>
        </template>
      </ComposableCard>

      <ComposableCard
        v-for="[name, fetcher] in FETCHERS"
        :key="name"
        :name="name"
        signature="() => ({limit, offset, filter, signal}) => Promise<SelectPage>"
        :value="fetched[name] ?? {data: null, error: null, isLoading: false}"
      >
        <template #actions>
          <button type="button" class="pg-btn" data-size="sm" @click="runFetcher(name, fetcher)">Fetch</button>
        </template>
        <p class="pg-empty">
          Page loader for the select components. Calls the ThunderID API with the signed-in user's token.
        </p>
      </ComposableCard>

      <EventLog />
    </div>
  </main>
</template>
