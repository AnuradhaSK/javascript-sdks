// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {createTheme} from '@thunderid/browser';
import {A11yFinding, auditElement, CANVAS_BACKGROUND} from './a11y';
import {GROUPS, HELPERS} from './stories';
import type {Args, ArgValue, HelperDef, PropControl, StoryDef} from './types';
import {chevron, copy, desktop, grid4, gridBg, mobile, moon, search, sun, tablet} from '../../components/icons';
import {h, mount} from '../../lib/dom';
import {describeError, timestamp} from '../../lib/events';
import {href} from '../../lib/router';
import {Scope} from '../../lib/store';

type Viewport = 'desktop' | 'tablet' | 'mobile';
type PreviewTheme = 'dark' | 'light';
type PanelTab = 'controls' | 'code' | 'actions' | 'a11y';

interface ActionEntry {
  detail: string;
  id: number;
  name: string;
  time: string;
}

const VIEWPORT_WIDTH: Record<Viewport, string> = {desktop: '100%', mobile: '375px', tablet: '768px'};

const VIEWPORTS: [Viewport, string, () => SVGElement][] = [
  ['desktop', 'Desktop', desktop],
  ['tablet', 'Tablet', tablet],
  ['mobile', 'Mobile', mobile],
];

const TABS: [PanelTab, string][] = [
  ['controls', 'Controls'],
  ['code', 'Code'],
  ['actions', 'Actions'],
  ['a11y', 'Accessibility'],
];

/** Toolbar and panel choices survive navigation between stories, like Storybook. */
const ui: {
  collapsed: string[];
  grid: boolean;
  previewTheme: PreviewTheme;
  search: string;
  tab: PanelTab;
  viewport: Viewport;
} = {collapsed: [], grid: true, previewTheme: 'dark', search: '', tab: 'controls', viewport: 'desktop'};

const formatDefault = (value: ArgValue | undefined): string => {
  if (value === undefined || value === '') return '-';
  if (typeof value === 'string') return `'${value}'`;

  return String(value);
};

const controlInput = (
  control: PropControl,
  value: ArgValue | undefined,
  onChange: (next: ArgValue) => void,
): HTMLElement => {
  if (control.control === 'bool') {
    return h(
      'button',
      {
        'aria-checked': String(value === true),
        'aria-label': control.name,
        className: 'pg-switch',
        onclick: () => onChange(value !== true),
        role: 'switch',
        type: 'button',
      },
      h('span', {}),
    );
  }

  if (control.control === 'text' || control.control === 'number') {
    const isNumber: boolean = control.control === 'number';
    const input: HTMLInputElement = h('input', {
      'aria-label': control.name,
      className: 'pg-input',
      type: isNumber ? 'number' : 'text',
    });

    input.value = String(value ?? '');
    input.addEventListener('input', () => onChange(isNumber ? Number(input.value) : input.value));

    return input;
  }

  return h(
    'div',
    {'aria-label': control.name, className: 'pg-options', role: 'radiogroup'},
    control.control.map((option: string) =>
      h(
        'button',
        {'aria-checked': String(value === option), onclick: () => onChange(option), role: 'radio', type: 'button'},
        option,
      ),
    ),
  );
};

const buildCode = (helper: HelperDef, args: Args): string => {
  const snippet = helper.code(args);
  const imports: string[] = Array.from(new Set(snippet.imports)).sort();

  return `import {${imports.join(', ')}} from '@thunderid/browser';\n\n${snippet.body}`;
};

export const renderHelpers = (root: HTMLElement, scope: Scope, helperId = '', storyId = ''): void => {
  const helper: HelperDef = HELPERS.find((candidate: HelperDef) => candidate.id === helperId) ?? HELPERS[0];
  const story: StoryDef = helper.stories.find((candidate: StoryDef) => candidate.id === storyId) ?? helper.stories[0];

  let args: Args = {...helper.defaults, ...story.args};
  let log: ActionEntry[] = [];
  let findings: A11yFinding[] = [];
  let storyScope: Scope = new Scope();

  const tree: HTMLElement = h('nav', {'aria-label': 'UI helpers', className: 'pg-tree'});
  const toolbarControls: HTMLElement = h('div', {className: 'pg-row', style: 'align-items:center'});
  const canvas: HTMLElement = h('div', {className: 'pg-canvas'});
  const frameInner: HTMLElement = h('div', {className: 'pg-frame-inner'});
  const frame: HTMLElement = h('div', {className: 'pg-frame'}, frameInner);
  const tabs: HTMLElement = h('div', {className: 'pg-tabs', role: 'tablist'});
  const panelBody: HTMLElement = h('div', {className: 'pg-panel-body', role: 'tabpanel'});

  canvas.appendChild(frame);
  scope.add(() => storyScope.dispose());

  const action = (name: string, detail = ''): void => {
    log = [{detail, id: (log[0]?.id ?? 0) + 1, name, time: timestamp()}, ...log].slice(0, 50);
    renderPanel('actions');
  };

  const audit = (): void => {
    findings = auditElement(frame, CANVAS_BACKGROUND[ui.previewTheme]);
    renderPanel('a11y');
  };

  const renderTree = (): void => {
    const query: string = ui.search.trim().toLowerCase();

    mount(
      tree,
      GROUPS.map((group: string) => {
        const items: HelperDef[] = HELPERS.filter(
          (candidate: HelperDef) =>
            candidate.group === group && (!query || candidate.name.toLowerCase().includes(query)),
        );

        if (!items.length) return null;

        const open: boolean = query ? true : !ui.collapsed.includes(group);

        return h(
          'div',
          {},
          h(
            'button',
            {
              'aria-expanded': String(open),
              className: 'pg-tree-group',
              onclick: () => {
                ui.collapsed = ui.collapsed.includes(group)
                  ? ui.collapsed.filter((item: string) => item !== group)
                  : [...ui.collapsed, group];
                renderTree();
              },
              type: 'button',
            },
            chevron(),
            group,
            h('span', {}, String(items.length)),
          ),
          open &&
            h(
              'ul',
              {},
              items.map((item: HelperDef) => {
                const selected: boolean = item.id === helper.id;

                return h(
                  'li',
                  {},
                  h(
                    'a',
                    {
                      'aria-current': selected ? 'true' : undefined,
                      className: 'pg-tree-item',
                      href: href('helpers', item.id, item.stories[0].id),
                    },
                    grid4(),
                    item.name,
                  ),
                  selected &&
                    h(
                      'ul',
                      {className: 'pg-stories'},
                      item.stories.map((candidate: StoryDef) =>
                        h(
                          'li',
                          {},
                          h(
                            'a',
                            {
                              'aria-current': candidate.id === story.id ? 'true' : undefined,
                              className: 'pg-story-link',
                              href: href('helpers', item.id, candidate.id),
                            },
                            candidate.name,
                          ),
                        ),
                      ),
                    ),
                );
              }),
            ),
        );
      }),
    );
  };

  const renderStory = (): void => {
    storyScope.dispose();
    storyScope = new Scope();

    const dark: boolean = ui.previewTheme === 'dark';

    canvas.dataset['theme'] = ui.previewTheme;
    canvas.dataset['grid'] = String(ui.grid);
    frame.dataset['viewport'] = ui.viewport;
    frame.removeAttribute('style');
    Object.entries(createTheme({}, dark).cssVariables).forEach(([name, value]: [string, string]) =>
      frame.style.setProperty(name, value),
    );
    frame.style.width = VIEWPORT_WIDTH[ui.viewport];

    try {
      mount(
        frameInner,
        helper.render(args, {
          action,
          frame,
          onDispose: (cleanup: () => void) => storyScope.add(cleanup),
          previewTheme: ui.previewTheme,
        }),
      );
    } catch (error) {
      mount(frameInner, h('p', {className: 'pg-story-note'}, `This story threw: ${describeError(error)}`));
    }

    requestAnimationFrame(audit);
  };

  const renderToolbar = (): void => {
    mount(
      toolbarControls,
      h(
        'div',
        {'aria-label': 'Viewport', className: 'pg-segmented', role: 'group'},
        VIEWPORTS.map(([id, label, icon]: [Viewport, string, () => SVGElement]) =>
          h(
            'button',
            {
              'aria-label': label,
              'aria-pressed': String(ui.viewport === id),
              className: 'pg-icon-btn',
              onclick: () => {
                ui.viewport = id;
                renderToolbar();
                renderStory();
              },
              type: 'button',
            },
            icon(),
          ),
        ),
      ),
      h(
        'button',
        {
          'aria-label': 'Toggle preview theme',
          className: 'pg-btn',
          'data-size': 'sm',
          onclick: () => {
            ui.previewTheme = ui.previewTheme === 'dark' ? 'light' : 'dark';
            renderToolbar();
            renderStory();
          },
          type: 'button',
        },
        ui.previewTheme === 'dark' ? moon() : sun(),
        ui.previewTheme === 'dark' ? 'Dark' : 'Light',
      ),
      h(
        'button',
        {
          'aria-label': 'Toggle background grid',
          'aria-pressed': String(ui.grid),
          className: 'pg-icon-btn',
          onclick: () => {
            ui.grid = !ui.grid;
            renderToolbar();
            canvas.dataset['grid'] = String(ui.grid);
          },
          type: 'button',
        },
        gridBg(),
      ),
    );
  };

  /**
   * Re-renders the tab strip, and the open tab's body unless `onlyIf` names a different tab. Story
   * renders log actions and re-audit on every keystroke, and must not rebuild the Controls inputs.
   */
  const renderPanel = (onlyIf?: PanelTab): void => {
    const issues: number = findings.filter((finding: A11yFinding) => finding.result !== 'Pass').length;

    mount(
      tabs,
      TABS.map(([id, label]: [PanelTab, string]) =>
        h(
          'button',
          {
            'aria-selected': String(ui.tab === id),
            onclick: () => {
              ui.tab = id;
              renderPanel();
            },
            role: 'tab',
            type: 'button',
          },
          label,
          id === 'actions' && log.length > 0 && h('span', {className: 'pg-count'}, String(log.length)),
          id === 'a11y' && issues > 0 && h('span', {className: 'pg-count'}, String(issues)),
        ),
      ),
    );

    if (onlyIf && onlyIf !== ui.tab) return;

    if (ui.tab === 'controls') {
      mount(
        panelBody,
        h(
          'div',
          {'aria-label': 'Arguments', className: 'pg-props', role: 'table'},
          h(
            'div',
            {className: 'pg-props-row', 'data-head': 'true', role: 'row'},
            ['Name', 'Description', 'Default', 'Control'].map((label: string) =>
              h('span', {role: 'columnheader'}, label),
            ),
          ),
          helper.controls.map((control: PropControl) =>
            h(
              'div',
              {className: 'pg-props-row', role: 'row'},
              h('span', {className: 'pg-prop-name', role: 'cell'}, control.name),
              h('span', {className: 'pg-prop-desc', role: 'cell'}, control.description, h('code', {}, control.type)),
              h('span', {className: 'pg-prop-default', role: 'cell'}, formatDefault(helper.defaults[control.name])),
              h(
                'div',
                {role: 'cell'},
                controlInput(control, args[control.name], (value: ArgValue) => {
                  args = {...args, [control.name]: value};
                  renderStory();

                  // Text inputs keep focus; everything else re-renders to show the new selection.
                  if (control.control !== 'text' && control.control !== 'number') renderPanel();
                }),
              ),
            ),
          ),
        ),
      );
    } else if (ui.tab === 'code') {
      const code: string = buildCode(helper, args);
      const copyButton: HTMLButtonElement = h(
        'button',
        {className: 'pg-btn', 'data-size': 'sm', type: 'button'},
        copy(),
        'Copy',
      );

      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(code).then(
          () => mount(copyButton, copy(), 'Copied'),
          () => undefined,
        );
      });

      mount(
        panelBody,
        h(
          'div',
          {className: 'pg-code'},
          h(
            'div',
            {className: 'pg-row', style: 'align-items:center'},
            h('span', {className: 'pg-card-meta'}, 'TypeScript · generated from the current arguments'),
            h('div', {className: 'pg-spacer'}),
            copyButton,
          ),
          h('pre', {}, code),
        ),
      );
    } else if (ui.tab === 'actions') {
      mount(
        panelBody,
        h(
          'div',
          {className: 'pg-actions-log'},
          log.map((entry: ActionEntry) =>
            h(
              'div',
              {},
              h('span', {}, entry.time),
              h('span', {}, entry.name),
              h('span', {title: entry.detail}, entry.detail),
            ),
          ),
          log.length === 0 && h('p', {className: 'pg-empty'}, 'Interact with the preview to log events here.'),
        ),
      );
    } else {
      mount(
        panelBody,
        h(
          'ul',
          {className: 'pg-a11y'},
          findings.map((finding: A11yFinding) =>
            h(
              'li',
              {},
              h('span', {className: 'pg-a11y-badge', 'data-result': finding.result}, finding.result),
              h('span', {className: 'pg-a11y-rule'}, finding.rule),
              h('span', {className: 'pg-a11y-detail'}, finding.detail),
            ),
          ),
        ),
      );
    }
  };

  const searchInput: HTMLInputElement = h('input', {
    'aria-label': 'Find helpers',
    placeholder: 'Find helpers',
    type: 'search',
  });

  searchInput.value = ui.search;
  searchInput.addEventListener('input', () => {
    ui.search = searchInput.value;
    renderTree();
  });

  const onKeyDown = (event: KeyboardEvent): void => {
    const target: HTMLElement | null = event.target as HTMLElement | null;

    if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) {
      event.preventDefault();
      searchInput.focus();
    }
  };

  window.addEventListener('keydown', onKeyDown);
  scope.add(() => window.removeEventListener('keydown', onKeyDown));

  renderTree();
  renderToolbar();
  renderStory();
  renderPanel();

  mount(
    root,
    h(
      'div',
      {className: 'pg-explorer'},
      h(
        'aside',
        {className: 'pg-sidebar'},
        h('label', {className: 'pg-search'}, search(), searchInput, h('kbd', {}, '/')),
        tree,
        h('div', {className: 'pg-spacer'}),
        h(
          'p',
          {className: 'pg-sidebar-note'},
          h('span', {className: 'pg-accent'}, '@thunderid/browser'),
          ' ships no UI components or stylesheets. These stories exercise the UI helpers it exports: avatars, logos, emoji, and theme utilities.',
        ),
      ),
      h(
        'main',
        {className: 'pg-stage'},
        h(
          'div',
          {className: 'pg-toolbar'},
          h(
            'div',
            {className: 'pg-crumbs'},
            h('span', {}, helper.group),
            h('span', {'aria-hidden': 'true'}, '/'),
            h('span', {}, helper.name),
            h('span', {'aria-hidden': 'true'}, '/'),
            h('strong', {}, story.name),
          ),
          h('div', {className: 'pg-spacer'}),
          toolbarControls,
        ),
        canvas,
        h('section', {'aria-label': 'Story tools', className: 'pg-panel'}, tabs, panelBody),
      ),
    ),
  );
};
