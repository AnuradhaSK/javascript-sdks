<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {computed, ComputedRef, FunctionalComponent, onBeforeUnmount, onMounted, Ref, ref} from 'vue';
import {COMPONENTS, GROUPS} from './stories';
import type {ComponentDef, PanelTab, PreviewTheme, StoryDef, Viewport} from './types';
import Workbench from './Workbench.vue';
import {Chevron, Desktop, Grid4, GridBg, Mobile, Moon, Search, Sun, Tablet} from '../../components/icons';
import {href} from '../../lib/router';

const props = defineProps<{componentId: string; storyId: string}>();

const VIEWPORTS: [Viewport, string, FunctionalComponent][] = [
  ['desktop', 'Desktop', Desktop],
  ['tablet', 'Tablet', Tablet],
  ['mobile', 'Mobile', Mobile],
];

const component: ComputedRef<ComponentDef> = computed(
  () => COMPONENTS.find((candidate: ComponentDef) => candidate.id === props.componentId) ?? COMPONENTS[0],
);
const story: ComputedRef<StoryDef> = computed(
  () =>
    component.value.stories.find((candidate: StoryDef) => candidate.id === props.storyId) ?? component.value.stories[0],
);

const search: Ref<string> = ref<string>('');
const collapsed: Ref<string[]> = ref<string[]>([]);
const viewport: Ref<Viewport> = ref<Viewport>('desktop');
const previewTheme: Ref<PreviewTheme> = ref<PreviewTheme>('dark');
const grid: Ref<boolean> = ref<boolean>(true);
const tab: Ref<PanelTab> = ref<PanelTab>('controls');
const searchInput: Ref<HTMLInputElement | null> = ref<HTMLInputElement | null>(null);

const onKeyDown = (event: KeyboardEvent): void => {
  const target: HTMLElement | null = event.target as HTMLElement | null;

  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) {
    event.preventDefault();
    searchInput.value?.focus();
  }
};

onMounted(() => window.addEventListener('keydown', onKeyDown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown));

const tree: ComputedRef<{group: string; items: ComponentDef[]; open: boolean}[]> = computed(() => {
  const query: string = search.value.trim().toLowerCase();

  return GROUPS.map((group: string) => ({
    group,
    items: COMPONENTS.filter(
      (candidate: ComponentDef) =>
        candidate.group === group && (!query || candidate.name.toLowerCase().includes(query)),
    ),
    open: query ? true : !collapsed.value.includes(group),
  })).filter(({items}: {items: ComponentDef[]}) => items.length > 0);
});

const toggleGroup = (group: string): void => {
  collapsed.value = collapsed.value.includes(group)
    ? collapsed.value.filter((item: string) => item !== group)
    : [...collapsed.value, group];
};
</script>

<template>
  <div class="pg-explorer">
    <aside class="pg-sidebar">
      <label class="pg-search">
        <Search />
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
        <div v-for="{group, items, open} in tree" :key="group">
          <button type="button" class="pg-tree-group" :aria-expanded="open" @click="toggleGroup(group)">
            <Chevron />
            {{ group }}
            <span>{{ items.length }}</span>
          </button>
          <ul v-if="open">
            <li v-for="item in items" :key="item.id">
              <a
                class="pg-tree-item"
                :href="href('components', item.id, item.stories[0].id)"
                :aria-current="item.id === component.id ? 'true' : undefined"
              >
                <Grid4 />
                {{ item.name }}
                <small v-if="item.live" title="Drives the live SDK">live</small>
              </a>
              <ul v-if="item.id === component.id" class="pg-stories">
                <li v-for="candidate in item.stories" :key="candidate.id">
                  <a
                    class="pg-story-link"
                    :href="href('components', item.id, candidate.id)"
                    :aria-current="candidate.id === story.id ? 'true' : undefined"
                    >{{ candidate.name }}</a
                  >
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
      <div class="pg-spacer" />
      <p class="pg-sidebar-note">
        Stories render the real <span class="pg-accent">@thunderid/vue</span> components. Ones marked live run against
        your local ThunderID server and session.
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
            v-for="[id, label, icon] in VIEWPORTS"
            :key="id"
            type="button"
            class="pg-icon-btn"
            :aria-label="label"
            :aria-pressed="viewport === id"
            @click="viewport = id"
          >
            <component :is="icon" />
          </button>
        </div>
        <button
          type="button"
          class="pg-btn"
          data-size="sm"
          aria-label="Toggle preview theme"
          @click="previewTheme = previewTheme === 'dark' ? 'light' : 'dark'"
        >
          <Moon v-if="previewTheme === 'dark'" />
          <Sun v-else />
          {{ previewTheme === 'dark' ? 'Dark' : 'Light' }}
        </button>
        <button
          type="button"
          class="pg-icon-btn"
          aria-label="Toggle background grid"
          :aria-pressed="grid"
          @click="grid = !grid"
        >
          <GridBg />
        </button>
      </div>

      <Workbench
        :key="`${component.id}/${story.id}`"
        :component="component"
        :story="story"
        :viewport="viewport"
        :preview-theme="previewTheme"
        :grid="grid"
        :tab="tab"
        @tab-change="(next: PanelTab) => (tab = next)"
      />
    </main>
  </div>
</template>
