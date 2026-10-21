// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

export type ArgValue = string | number | boolean;
export type Args = Record<string, ArgValue>;
export type Action = (name: string, detail?: string) => void;

export type ControlKind = 'text' | 'bool' | 'number' | readonly string[];

export interface PropControl {
  control: ControlKind;
  description: string;
  name: string;
  type: string;
}

export interface StoryDef {
  args?: Args;
  id: string;
  name: string;
}

export interface Snippet {
  body: string;
  imports: string[];
}

export interface RenderContext {
  action: Action;
  /** The preview frame, so a story can observe or style it (theme detection, CSS variables). */
  frame: HTMLElement;
  previewTheme: 'dark' | 'light';
  /** Registers teardown for listeners or observers the story starts. */
  onDispose: (cleanup: () => void) => void;
}

export interface HelperDef {
  code: (args: Args) => Snippet;
  controls: PropControl[];
  defaults: Args;
  group: string;
  id: string;
  name: string;
  render: (args: Args, context: RenderContext) => Node;
  stories: StoryDef[];
}
