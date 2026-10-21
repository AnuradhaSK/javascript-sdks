// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {FunctionalComponent, h, VNode} from 'vue';

type Shape = [string, Record<string, string | number>];

const STROKE: Record<string, string | number> = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'stroke-width': 2,
};

/**
 * Builds a stroke icon from a list of SVG shapes.
 */
const icon = (size: number, shapes: Shape[], strokeWidth = 2): FunctionalComponent => {
  const component: FunctionalComponent = (): VNode =>
    h(
      'svg',
      {
        ...STROKE,
        'aria-hidden': 'true',
        height: size,
        'stroke-width': strokeWidth,
        viewBox: '0 0 24 24',
        width: size,
      },
      shapes.map(([tag, attrs]: Shape) => h(tag, attrs)),
    );

  return component;
};

/** The full ThunderID logo (mark and wordmark), in its variant for dark backgrounds. */
export const Logo: FunctionalComponent<{height?: number}> = ({height = 22}: {height?: number}): VNode =>
  h('img', {alt: 'ThunderID', height, src: '/thunderid-logo.svg', width: Math.round((height / 257) * 1187)});

/** The official Vue logo, in its brand colors. */
export const VueLogo: FunctionalComponent<{size?: number}> = ({size = 22}: {size?: number}): VNode =>
  h('svg', {'aria-label': 'Vue', height: size, role: 'img', viewBox: '0 0 261.76 226.69', width: size}, [
    h('path', {d: 'M161.096.001l-30.225 52.351L100.647.001H-.005l130.877 226.688L261.749.001z', fill: '#41b883'}),
    h('path', {d: 'M161.096.001l-30.225 52.351L100.647.001H52.346l78.526 136.01L209.398.001z', fill: '#34495e'}),
  ]);

export const Spinner: FunctionalComponent<{size?: number}> = ({size = 14}: {size?: number}): VNode =>
  h(
    'svg',
    {
      ...STROKE,
      'aria-hidden': 'true',
      class: 'pg-spin',
      height: size,
      'stroke-width': 2.5,
      viewBox: '0 0 24 24',
      width: size,
    },
    [h('path', {d: 'M21 12a9 9 0 11-6.2-8.56'})],
  );

export const Play: FunctionalComponent = (): VNode =>
  h('svg', {'aria-hidden': 'true', fill: 'currentColor', height: 14, viewBox: '0 0 24 24', width: 14}, [
    h('polygon', {points: '6 4 20 12 6 20 6 4'}),
  ]);

export const Check: FunctionalComponent = icon(12, [['polyline', {points: '20 6 9 17 4 12'}]], 3);

export const Cross: FunctionalComponent = icon(
  12,
  [
    ['line', {x1: 18, x2: 6, y1: 6, y2: 18}],
    ['line', {x1: 6, x2: 18, y1: 6, y2: 18}],
  ],
  3,
);

export const Dash: FunctionalComponent = icon(12, [['line', {x1: 5, x2: 19, y1: 12, y2: 12}]], 3);

export const Bang: FunctionalComponent = icon(
  12,
  [
    ['line', {x1: 12, x2: 12, y1: 6, y2: 13}],
    ['line', {x1: 12, x2: 12.01, y1: 18, y2: 18}],
  ],
  3,
);

export const Search: FunctionalComponent = icon(14, [
  ['circle', {cx: 11, cy: 11, r: 8}],
  ['line', {x1: 21, x2: 16.65, y1: 21, y2: 16.65}],
]);

export const Chevron: FunctionalComponent = icon(12, [['polyline', {points: '9 18 15 12 9 6'}]], 2.5);

export const Grid4: FunctionalComponent = icon(14, [
  ['rect', {height: 7, rx: 1, width: 7, x: 3, y: 3}],
  ['rect', {height: 7, rx: 1, width: 7, x: 14, y: 3}],
  ['rect', {height: 7, rx: 1, width: 7, x: 14, y: 14}],
  ['rect', {height: 7, rx: 1, width: 7, x: 3, y: 14}],
]);

export const Desktop: FunctionalComponent = icon(15, [
  ['rect', {height: 14, rx: 2, width: 20, x: 2, y: 3}],
  ['line', {x1: 8, x2: 16, y1: 21, y2: 21}],
  ['line', {x1: 12, x2: 12, y1: 17, y2: 21}],
]);

export const Tablet: FunctionalComponent = icon(15, [
  ['rect', {height: 20, rx: 2, width: 16, x: 4, y: 2}],
  ['line', {x1: 12, x2: 12.01, y1: 18, y2: 18}],
]);

export const Mobile: FunctionalComponent = icon(15, [
  ['rect', {height: 20, rx: 2, width: 12, x: 6, y: 2}],
  ['line', {x1: 12, x2: 12.01, y1: 18, y2: 18}],
]);

export const Moon: FunctionalComponent = icon(14, [['path', {d: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'}]]);

export const Sun: FunctionalComponent = icon(14, [
  ['circle', {cx: 12, cy: 12, r: 4}],
  [
    'path',
    {
      d: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41',
    },
  ],
]);

export const GridBg: FunctionalComponent = icon(15, [
  ['rect', {height: 18, rx: 2, width: 18, x: 3, y: 3}],
  ['line', {x1: 3, x2: 21, y1: 9, y2: 9}],
  ['line', {x1: 3, x2: 21, y1: 15, y2: 15}],
  ['line', {x1: 9, x2: 9, y1: 3, y2: 21}],
  ['line', {x1: 15, x2: 15, y1: 3, y2: 21}],
]);

export const Copy: FunctionalComponent = icon(13, [
  ['rect', {height: 13, rx: 2, width: 13, x: 9, y: 9}],
  ['path', {d: 'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1'}],
]);
