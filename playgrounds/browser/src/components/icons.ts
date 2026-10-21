// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {h, svg} from '../lib/dom';

/** The full ThunderID logo (mark and wordmark), in its variant for dark backgrounds. */
export const logo = (height = 22): HTMLImageElement =>
  h('img', {alt: 'ThunderID', height, src: '/thunderid-logo.svg', width: Math.round((height / 257) * 1187)});

/** The official JavaScript logo. */
export const javascriptLogo = (size = 22): SVGElement =>
  svg(`<svg width="${size}" height="${size}" viewBox="0 0 630 630" role="img" aria-label="JavaScript">
    <rect width="630" height="630" rx="40" fill="#f7df1e"/>
    <path fill="#000" d="m423.2 492.19c12.69 20.72 29.2 35.95 58.4 35.95 24.53 0 40.2-12.26 40.2-29.2 0-20.3-16.1-27.49-43.1-39.3l-14.8-6.35c-42.72-18.2-71.1-41-71.1-89.2 0-44.4 33.83-78.2 86.7-78.2 37.64 0 64.7 13.1 84.2 47.4l-46.1 29.6c-10.15-18.2-21.1-25.37-38.1-25.37-17.34 0-28.33 11-28.33 25.37 0 17.76 11 24.95 36.4 35.95l14.8 6.34c50.3 21.57 78.7 43.56 78.7 93 0 53.3-41.87 82.5-98.1 82.5-54.98 0-90.5-26.2-107.88-60.54zm-209.13 5.13c9.3 16.5 17.76 30.45 38.1 30.45 19.45 0 31.72-7.61 31.72-37.2v-201.3h59.2v202.1c0 61.3-35.94 89.2-88.4 89.2-47.4 0-74.85-24.53-88.81-54.075z"/>
  </svg>`);

const STROKE = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';

const icon = (size: number, body: string, width = 2): SVGElement =>
  svg(
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" ${STROKE} stroke-width="${width}" aria-hidden="true">${body}</svg>`,
  );

export const spinner = (size = 14): SVGElement =>
  svg(
    `<svg class="pg-spin" width="${size}" height="${size}" viewBox="0 0 24 24" ${STROKE} stroke-width="2.5" aria-hidden="true"><path d="M21 12a9 9 0 11-6.2-8.56"/></svg>`,
  );

export const play = (): SVGElement =>
  svg(
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
  );

export const check = (): SVGElement => icon(12, '<polyline points="20 6 9 17 4 12"/>', 3);

export const cross = (): SVGElement =>
  icon(12, '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', 3);

export const dash = (): SVGElement => icon(12, '<line x1="5" y1="12" x2="19" y2="12"/>', 3);

export const bang = (): SVGElement =>
  icon(12, '<line x1="12" y1="6" x2="12" y2="13"/><line x1="12" y1="18" x2="12.01" y2="18"/>', 3);

export const search = (): SVGElement =>
  icon(14, '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>');

export const chevron = (): SVGElement => icon(12, '<polyline points="9 18 15 12 9 6"/>', 2.5);

export const grid4 = (): SVGElement =>
  icon(
    14,
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  );

export const desktop = (): SVGElement =>
  icon(
    15,
    '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  );

export const tablet = (): SVGElement =>
  icon(15, '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>');

export const mobile = (): SVGElement =>
  icon(15, '<rect x="6" y="2" width="12" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>');

export const moon = (): SVGElement => icon(14, '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>');

export const sun = (): SVGElement =>
  icon(
    14,
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  );

export const gridBg = (): SVGElement =>
  icon(
    15,
    '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>',
  );

export const copy = (): SVGElement =>
  icon(
    13,
    '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
  );
