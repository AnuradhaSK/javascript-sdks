<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {createTheme, Theme} from '@thunderid/browser';
import {computed, ComputedRef, onBeforeUnmount, onMounted, Ref, ref, shallowRef, ShallowRef, VNode, watch} from 'vue';
import {A11yFinding, auditElement, CANVAS_BACKGROUND} from './a11y';
import {buildCode} from './code';
import ControlInput from './ControlInput.vue';
import StoryHost from './StoryHost';
import type {Args, ArgValue, ComponentDef, PanelTab, PreviewTheme, StoryDef, Viewport} from './types';
import {Copy} from '../../components/icons';
import {timestamp} from '../../lib/events';

interface ActionEntry {
  detail: string;
  id: number;
  name: string;
  time: string;
}

const props = defineProps<{
  component: ComponentDef;
  grid: boolean;
  previewTheme: PreviewTheme;
  story: StoryDef;
  tab: PanelTab;
  viewport: Viewport;
}>();
const emit = defineEmits<{tabChange: [tab: PanelTab]}>();

const VIEWPORT_WIDTH: Record<Viewport, string> = {desktop: '100%', mobile: '375px', tablet: '768px'};

const TABS: [PanelTab, string][] = [
  ['controls', 'Controls'],
  ['code', 'Code'],
  ['actions', 'Actions'],
  ['a11y', 'Accessibility'],
];

const args: Ref<Args> = ref<Args>({...props.component.defaults, ...props.story.args});
const log: Ref<ActionEntry[]> = ref<ActionEntry[]>([]);
const findings: ShallowRef<A11yFinding[]> = shallowRef<A11yFinding[]>([]);
const copied: Ref<boolean> = ref<boolean>(false);
const frame: Ref<HTMLDivElement | null> = ref<HTMLDivElement | null>(null);

const theme: ComputedRef<Theme> = computed(() => createTheme({}, props.previewTheme === 'dark'));

const action = (name: string, detail = ''): void => {
  log.value = [{detail, id: (log.value[0]?.id ?? 0) + 1, name, time: timestamp()}, ...log.value].slice(0, 50);
};

const setArg = (name: string, value: ArgValue): void => {
  args.value = {...args.value, [name]: value};
};

const renderStory: ComputedRef<() => VNode> = computed(() => {
  const current: Args = args.value;

  return (): VNode => props.component.render(current, action);
});

const formatDefault = (value: ArgValue | undefined): string => {
  if (value === undefined || value === '') return '-';
  if (typeof value === 'string') return `'${value}'`;

  return String(value);
};

const code: ComputedRef<string> = computed(() => buildCode(props.component, args.value));

const issues: ComputedRef<number> = computed(
  () => findings.value.filter((finding: A11yFinding) => finding.result !== 'Pass').length,
);

const copyCode = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(code.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    copied.value = false;
  }
};

// Re-audit whenever the rendered story changes, including async renders from live components.
let observer: MutationObserver | null = null;
let pending = 0;

const audit = (): void => {
  cancelAnimationFrame(pending);
  pending = requestAnimationFrame(() => {
    if (frame.value) findings.value = auditElement(frame.value, CANVAS_BACKGROUND[props.previewTheme]);
  });
};

onMounted(() => {
  if (!frame.value) return;

  observer = new MutationObserver(audit);
  observer.observe(frame.value, {attributes: true, characterData: true, childList: true, subtree: true});
  audit();
});

watch(() => [props.previewTheme, props.viewport], audit);

onBeforeUnmount(() => {
  observer?.disconnect();
  cancelAnimationFrame(pending);
});
</script>

<template>
  <div class="pg-canvas" :data-theme="previewTheme" :data-grid="grid">
    <div
      ref="frame"
      class="pg-frame"
      :data-viewport="viewport"
      :style="{...theme.cssVariables, width: VIEWPORT_WIDTH[viewport]}"
    >
      <div class="pg-frame-inner">
        <StoryHost :render="renderStory" :scheme="previewTheme" :theme="theme" />
      </div>
    </div>
  </div>

  <section aria-label="Story tools" class="pg-panel">
    <div role="tablist" class="pg-tabs">
      <button
        v-for="[id, label] in TABS"
        :key="id"
        type="button"
        role="tab"
        :aria-selected="tab === id"
        @click="emit('tabChange', id)"
      >
        {{ label }}
        <span v-if="id === 'actions' && log.length > 0" class="pg-count">{{ log.length }}</span>
        <span v-if="id === 'a11y' && issues > 0" class="pg-count">{{ issues }}</span>
      </button>
    </div>
    <div class="pg-panel-body" role="tabpanel">
      <template v-if="tab === 'controls'">
        <div v-if="component.controls.length" role="table" aria-label="Props" class="pg-props">
          <div role="row" class="pg-props-row" data-head="true">
            <span role="columnheader">Name</span>
            <span role="columnheader">Description</span>
            <span role="columnheader">Default</span>
            <span role="columnheader">Control</span>
          </div>
          <div v-for="control in component.controls" :key="control.name" role="row" class="pg-props-row">
            <span role="cell" class="pg-prop-name">{{ control.name }}</span>
            <span role="cell" class="pg-prop-desc">
              {{ control.description }}
              <code>{{ control.type }}</code>
            </span>
            <span role="cell" class="pg-prop-default">{{ formatDefault(component.defaults[control.name]) }}</span>
            <div role="cell">
              <ControlInput
                :control="control"
                :value="args[control.name]"
                @change="(value: ArgValue) => setArg(control.name, value)"
              />
            </div>
          </div>
        </div>
        <p v-else class="pg-empty">This component has no editable props in the playground.</p>
      </template>

      <div v-else-if="tab === 'code'" class="pg-code">
        <div class="pg-row" style="align-items: center">
          <span class="pg-card-meta">Vue SFC · generated from the current props</span>
          <div class="pg-spacer" />
          <button type="button" class="pg-btn" data-size="sm" @click="copyCode()">
            <Copy />
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <pre>{{ code }}</pre>
      </div>

      <div v-else-if="tab === 'actions'" class="pg-actions-log">
        <div v-for="entry in log" :key="entry.id">
          <span>{{ entry.time }}</span>
          <span>{{ entry.name }}</span>
          <span :title="entry.detail">{{ entry.detail }}</span>
        </div>
        <p v-if="log.length === 0" class="pg-empty">Interact with the preview to log events here.</p>
      </div>

      <ul v-else class="pg-a11y">
        <li v-for="finding in findings" :key="finding.rule">
          <span class="pg-a11y-badge" :data-result="finding.result">{{ finding.result }}</span>
          <span class="pg-a11y-rule">{{ finding.rule }}</span>
          <span class="pg-a11y-detail">{{ finding.detail }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
