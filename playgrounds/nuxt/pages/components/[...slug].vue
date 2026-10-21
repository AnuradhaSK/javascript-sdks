<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {computed, onBeforeUnmount, onMounted, ref, type ComputedRef, type Ref} from 'vue';
import {useRoute} from '#imports';
import {COMPONENTS, GROUPS} from '~/lib/stories';
import type {ComponentDef, StoryDef} from '~/lib/storyTypes';

type Viewport = 'desktop' | 'tablet' | 'mobile';
type PanelTab = 'controls' | 'code' | 'actions' | 'a11y';

const VIEWPORTS: [Viewport, string][] = [
  ['desktop', 'Desktop'],
  ['tablet', 'Tablet'],
  ['mobile', 'Mobile'],
];

const route = useRoute();

const segments: ComputedRef<string[]> = computed(() => {
  const slug: string | string[] | undefined = route.params.slug as string | string[] | undefined;

  return Array.isArray(slug) ? slug : slug ? [slug] : [];
});

const component: ComputedRef<ComponentDef> = computed(
  () => COMPONENTS.find((candidate: ComponentDef) => candidate.id === segments.value[0]) ?? COMPONENTS[0],
);
const story: ComputedRef<StoryDef> = computed(
  () =>
    component.value.stories.find((candidate: StoryDef) => candidate.id === segments.value[1]) ??
    component.value.stories[0],
);

const search: Ref<string> = ref<string>('');
const collapsed: Ref<string[]> = ref<string[]>([]);
const viewport: Ref<Viewport> = ref<Viewport>('desktop');
const previewTheme: Ref<'dark' | 'light'> = ref<'dark' | 'light'>('dark');
const grid: Ref<boolean> = ref<boolean>(true);
const tab: Ref<PanelTab> = ref<PanelTab>('controls');
const searchInput: Ref<HTMLInputElement | null> = ref<HTMLInputElement | null>(null);

const query: ComputedRef<string> = computed(() => search.value.trim().toLowerCase());

const groups: ComputedRef<{items: ComponentDef[]; name: string; open: boolean}[]> = computed(() =>
  GROUPS.map((name: string) => ({
    items: COMPONENTS.filter(
      (candidate: ComponentDef) =>
        candidate.group === name && (!query.value || candidate.name.toLowerCase().includes(query.value)),
    ),
    name,
    open: query.value ? true : !collapsed.value.includes(name),
  })).filter((group: {items: ComponentDef[]}) => group.items.length > 0),
);

const toggleGroup = (name: string): void => {
  collapsed.value = collapsed.value.includes(name)
    ? collapsed.value.filter((item: string) => item !== name)
    : [...collapsed.value, name];
};

const onKeyDown = (event: KeyboardEvent): void => {
  const target: HTMLElement | null = event.target as HTMLElement | null;

  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) {
    event.preventDefault();
    searchInput.value?.focus();
  }
};

onMounted(() => window.addEventListener('keydown', onKeyDown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown));

const storyPath = (componentId: string, storyId: string): string => `/components/${componentId}/${storyId}`;
</script>

<template>
  <div class="pg-explorer">
    <aside class="pg-sidebar">
      <label class="pg-search">
        <PgIcon name="search" />
        <input
          ref="searchInput"
          v-model="search"
          type="search"
          aria-label="Find components"
          placeholder="Find components"
        />
        <kbd>/</kbd>
      </label>

      <nav aria-label="Components" class="pg-tree">
        <div v-for="group in groups" :key="group.name">
          <button type="button" class="pg-tree-group" :aria-expanded="group.open" @click="toggleGroup(group.name)">
            <PgIcon name="chevron" :size="12" />
            {{ group.name }}
            <span>{{ group.items.length }}</span>
          </button>
          <ul v-if="group.open">
            <li v-for="item in group.items" :key="item.id">
              <NuxtLink
                class="pg-tree-item"
                :to="storyPath(item.id, item.stories[0].id)"
                :aria-current="item.id === component.id ? 'true' : undefined"
              >
                <PgIcon name="grid" />
                {{ item.name }}
                <small v-if="item.live" title="Drives the live SDK">live</small>
              </NuxtLink>
              <ul v-if="item.id === component.id" class="pg-stories">
                <li v-for="candidate in item.stories" :key="candidate.id">
                  <NuxtLink
                    class="pg-story-link"
                    :to="storyPath(item.id, candidate.id)"
                    :aria-current="candidate.id === story.id ? 'true' : undefined"
                  >
                    {{ candidate.name }}
                  </NuxtLink>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
      <div class="pg-spacer" />
      <p class="pg-sidebar-note">
        Stories render the real components: the ones <span class="pg-accent">@thunderid/nuxt</span> auto-imports and the
        primitives of <span class="pg-accent">@thunderid/vue</span>. Ones marked live run against the Nuxt server routes
        and your session.
      </p>
    </aside>

    <main class="pg-stage">
      <div class="pg-toolbar">
        <div class="pg-crumbs">
          <span>{{ component.group }}</span>
          <span aria-hidden="true">/</span>
          <span>{{ component.name }}</span>
          <span aria-hidden="true">/</span>
          <strong>{{ story.name }}</strong>
        </div>
        <div class="pg-spacer" />
        <div role="group" aria-label="Viewport" class="pg-segmented">
          <button
            v-for="[id, label] in VIEWPORTS"
            :key="id"
            type="button"
            class="pg-icon-btn"
            :aria-label="label"
            :aria-pressed="viewport === id"
            @click="viewport = id"
          >
            <PgIcon :name="id" :size="15" />
          </button>
        </div>
        <button
          type="button"
          class="pg-btn"
          data-size="sm"
          aria-label="Toggle preview theme"
          @click="previewTheme = previewTheme === 'dark' ? 'light' : 'dark'"
        >
          <PgIcon :name="previewTheme === 'dark' ? 'moon' : 'sun'" />
          {{ previewTheme === 'dark' ? 'Dark' : 'Light' }}
        </button>
        <button
          type="button"
          class="pg-icon-btn"
          aria-label="Toggle background grid"
          :aria-pressed="grid"
          @click="grid = !grid"
        >
          <PgIcon name="grid-bg" :size="15" />
        </button>
      </div>

      <ClientOnly>
        <ExplorerWorkbench
          :key="`${component.id}/${story.id}`"
          :component="component"
          :story="story"
          :viewport="viewport"
          :preview-theme="previewTheme"
          :grid="grid"
          :tab="tab"
          @tab-change="(next: PanelTab) => (tab = next)"
        />
      </ClientOnly>
    </main>
  </div>
</template>
