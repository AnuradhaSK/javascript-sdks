// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ChangeEvent, ReactElement, useEffect, useRef, useState} from 'react';
import {COMPONENTS, GROUPS} from './stories';
import type {ComponentDef, StoryDef} from './types';
import Workbench, {PanelTab, PreviewTheme, Viewport} from './Workbench';
import {Chevron, Desktop, Grid4, GridBg, Mobile, Moon, Search, Sun, Tablet} from '../../components/Icons';
import {href} from '../../lib/router';

interface ExplorerProps {
  componentId?: string;
  storyId?: string;
}

const VIEWPORTS: [Viewport, string, () => ReactElement][] = [
  ['desktop', 'Desktop', Desktop],
  ['tablet', 'Tablet', Tablet],
  ['mobile', 'Mobile', Mobile],
];

const Explorer = ({componentId = '', storyId = ''}: ExplorerProps): ReactElement => {
  const component: ComponentDef =
    COMPONENTS.find((candidate: ComponentDef) => candidate.id === componentId) ?? COMPONENTS[0];
  const story: StoryDef =
    component.stories.find((candidate: StoryDef) => candidate.id === storyId) ?? component.stories[0];

  const [search, setSearch] = useState<string>('');
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>('dark');
  const [grid, setGrid] = useState<boolean>(true);
  const [tab, setTab] = useState<PanelTab>('controls');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target: HTMLElement | null = event.target as HTMLElement | null;

      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const query: string = search.trim().toLowerCase();

  const toggleGroup = (group: string): void =>
    setCollapsed((previous: string[]) =>
      previous.includes(group) ? previous.filter((item: string) => item !== group) : [...previous, group],
    );

  return (
    <div className="pg-explorer">
      <aside className="pg-sidebar">
        <label className="pg-search">
          <Search />
          <input
            ref={searchRef}
            type="search"
            aria-label="Find components"
            placeholder="Find components"
            value={search}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
          />
          <kbd>/</kbd>
        </label>

        <nav aria-label="Components" className="pg-tree">
          {GROUPS.map((group: string) => {
            const items: ComponentDef[] = COMPONENTS.filter(
              (candidate: ComponentDef) =>
                candidate.group === group && (!query || candidate.name.toLowerCase().includes(query)),
            );

            if (!items.length) return null;

            const open: boolean = query ? true : !collapsed.includes(group);

            return (
              <div key={group}>
                <button type="button" className="pg-tree-group" aria-expanded={open} onClick={() => toggleGroup(group)}>
                  <Chevron />
                  {group}
                  <span>{items.length}</span>
                </button>
                {open && (
                  <ul>
                    {items.map((item: ComponentDef) => {
                      const selected: boolean = item.id === component.id;

                      return (
                        <li key={item.id}>
                          <a
                            className="pg-tree-item"
                            href={href('components', item.id, item.stories[0].id)}
                            aria-current={selected ? 'true' : undefined}
                          >
                            <Grid4 />
                            {item.name}
                            {item.live && <small title="Drives the live SDK">live</small>}
                          </a>
                          {selected && (
                            <ul className="pg-stories">
                              {item.stories.map((candidate: StoryDef) => (
                                <li key={candidate.id}>
                                  <a
                                    className="pg-story-link"
                                    href={href('components', item.id, candidate.id)}
                                    aria-current={candidate.id === story.id ? 'true' : undefined}
                                  >
                                    {candidate.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
        <div className="pg-spacer" />
        <p className="pg-sidebar-note">
          Stories render the real <span className="pg-accent">@thunderid/react</span> components. Ones marked live run
          against your local ThunderID server and session.
        </p>
      </aside>

      <main className="pg-stage">
        <div className="pg-toolbar">
          <div className="pg-crumbs">
            <span>{component.group}</span>
            <span aria-hidden="true">/</span>
            <span>{component.name}</span>
            <span aria-hidden="true">/</span>
            <strong>{story.name}</strong>
          </div>
          <div className="pg-spacer" />
          <div role="group" aria-label="Viewport" className="pg-segmented">
            {VIEWPORTS.map(([id, label, Icon]: [Viewport, string, () => ReactElement]) => (
              <button
                key={id}
                type="button"
                className="pg-icon-btn"
                aria-label={label}
                aria-pressed={viewport === id}
                onClick={() => setViewport(id)}
              >
                <Icon />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="pg-btn"
            data-size="sm"
            aria-label="Toggle preview theme"
            onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}
          >
            {previewTheme === 'dark' ? <Moon /> : <Sun />}
            {previewTheme === 'dark' ? 'Dark' : 'Light'}
          </button>
          <button
            type="button"
            className="pg-icon-btn"
            aria-label="Toggle background grid"
            aria-pressed={grid}
            onClick={() => setGrid(!grid)}
          >
            <GridBg />
          </button>
        </div>

        <Workbench
          key={`${component.id}/${story.id}`}
          component={component}
          story={story}
          viewport={viewport}
          previewTheme={previewTheme}
          grid={grid}
          tab={tab}
          onTabChange={setTab}
        />
      </main>
    </div>
  );
};

export default Explorer;
