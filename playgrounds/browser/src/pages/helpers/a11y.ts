// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

export type A11yResult = 'Pass' | 'Warn' | 'Fail';

export interface A11yFinding {
  detail: string;
  result: A11yResult;
  rule: string;
}

type Rgba = [number, number, number, number];

const parseColor = (value: string): Rgba | null => {
  const match: RegExpExecArray | null = /rgba?\(([^)]+)\)/.exec(value);

  if (!match) return null;

  const parts: number[] = match[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);

  return [parts[0], parts[1], parts[2], parts[3] ?? 1];
};

const luminance = ([r, g, b]: Rgba): number => {
  const channel = (c: number): number => {
    const v: number = c / 255;

    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const blend = (top: Rgba, bottom: Rgba): Rgba => {
  const alpha: number = top[3];

  return [
    top[0] * alpha + bottom[0] * (1 - alpha),
    top[1] * alpha + bottom[1] * (1 - alpha),
    top[2] * alpha + bottom[2] * (1 - alpha),
    1,
  ];
};

/**
 * Resolves the effective background behind an element by compositing ancestor backgrounds.
 */
const backgroundOf = (element: Element, fallback: Rgba): Rgba => {
  const layers: Rgba[] = [];
  let node: Element | null = element;

  while (node) {
    const color: Rgba | null = parseColor(getComputedStyle(node).backgroundColor);

    if (color && color[3] > 0) {
      layers.push(color);
      if (color[3] >= 1) break;
    }
    node = node.parentElement;
  }

  return layers.reverse().reduce((under: Rgba, layer: Rgba) => blend(layer, under), fallback);
};

const contrast = (a: Rgba, b: Rgba): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x: number, y: number) => y - x);

  return (light + 0.05) / (dark + 0.05);
};

const accessibleName = (element: Element): string => {
  const labelledBy: string | null = element.getAttribute('aria-labelledby');

  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id: string) => element.ownerDocument.getElementById(id)?.textContent ?? '')
      .join(' ')
      .trim();
  }

  return (
    element.getAttribute('aria-label') ??
    element.getAttribute('title') ??
    (element.textContent?.trim() ? element.textContent : (element.querySelector('img')?.getAttribute('alt') ?? ''))
  ).trim();
};

const hasLabel = (input: HTMLElement): boolean => {
  if (input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')) return true;
  if (input.closest('label')) return true;
  if (input.id && input.ownerDocument.querySelector(`label[for="${CSS.escape(input.id)}"]`)) return true;

  return false;
};

/**
 * Runs a few lightweight checks against the rendered story. Not a replacement for axe or a screen reader
 * pass, but enough to catch missing names, labels, and low contrast while iterating on props.
 */
export const auditElement = (root: HTMLElement, canvasBackground: Rgba): A11yFinding[] => {
  const findings: A11yFinding[] = [];

  const buttons: HTMLElement[] = Array.from(root.querySelectorAll<HTMLElement>('button, [role="button"], a[href]'));
  const unnamed: HTMLElement[] = buttons.filter((button: HTMLElement) => !accessibleName(button));

  findings.push(
    buttons.length === 0
      ? {detail: 'no buttons or links', result: 'Pass', rule: 'Accessible name'}
      : {
          detail: unnamed.length ? `${unnamed.length} of ${buttons.length} unnamed` : `${buttons.length} named`,
          result: unnamed.length ? 'Fail' : 'Pass',
          rule: 'Accessible name',
        },
  );

  const inputs: HTMLElement[] = Array.from(
    root.querySelectorAll<HTMLElement>('input:not([type="hidden"]), select, textarea'),
  );
  const unlabeled: HTMLElement[] = inputs.filter((input: HTMLElement) => !hasLabel(input));

  findings.push(
    inputs.length === 0
      ? {detail: 'no form fields', result: 'Pass', rule: 'Label associated'}
      : {
          detail: unlabeled.length ? `${unlabeled.length} of ${inputs.length} unlabeled` : `${inputs.length} labeled`,
          result: unlabeled.length ? 'Fail' : 'Pass',
          rule: 'Label associated',
        },
  );

  const invalid: HTMLElement[] = inputs.filter((input: HTMLElement) => input.getAttribute('aria-invalid') === 'true');
  const described: HTMLElement[] = invalid.filter((input: HTMLElement) => input.getAttribute('aria-describedby'));

  if (invalid.length) {
    findings.push({
      detail: `${described.length} of ${invalid.length} invalid fields use aria-describedby`,
      result: described.length === invalid.length ? 'Pass' : 'Warn',
      rule: 'Error described',
    });
  }

  const images: HTMLImageElement[] = Array.from(root.querySelectorAll('img'));
  const noAlt: HTMLImageElement[] = images.filter((image: HTMLImageElement) => !image.hasAttribute('alt'));

  if (images.length) {
    findings.push({
      detail: noAlt.length ? `${noAlt.length} of ${images.length} missing alt` : `${images.length} with alt`,
      result: noAlt.length ? 'Fail' : 'Pass',
      rule: 'Image alternative text',
    });
  }

  const roles: string[] = Array.from(
    new Set(Array.from(root.querySelectorAll('[role]')).map((element: Element) => element.getAttribute('role') ?? '')),
  ).filter(Boolean);

  findings.push({
    detail: roles.length ? roles.join(', ') : 'none (native semantics only)',
    result: 'Pass',
    rule: 'ARIA roles found',
  });

  const busy: HTMLElement[] = Array.from(root.querySelectorAll<HTMLElement>('button:disabled, [aria-disabled="true"]'));

  if (
    root.querySelector('svg[class*="spin"], [class*="spinner"]') &&
    !root.querySelector('[aria-busy="true"], [role="status"], [role="progressbar"]')
  ) {
    findings.push({detail: 'spinner without aria-busy or role="status"', result: 'Warn', rule: 'Busy state announced'});
  } else if (busy.length) {
    findings.push({detail: `${busy.length} disabled control(s)`, result: 'Pass', rule: 'Disabled state'});
  }

  const positiveTab: Element[] = Array.from(root.querySelectorAll('[tabindex]')).filter(
    (element: Element) => Number(element.getAttribute('tabindex')) > 0,
  );

  findings.push({
    detail: positiveTab.length ? `${positiveTab.length} element(s) with tabindex > 0` : 'natural order',
    result: positiveTab.length ? 'Warn' : 'Pass',
    rule: 'Focus order',
  });

  const ids: string[] = Array.from(root.querySelectorAll('[id]')).map((element: Element) => element.id);
  const duplicates: string[] = Array.from(
    new Set(ids.filter((id: string, index: number) => ids.indexOf(id) !== index)),
  );

  if (duplicates.length) {
    findings.push({detail: duplicates.slice(0, 3).join(', '), result: 'Fail', rule: 'Unique ids'});
  }

  let lowest = Infinity;
  let lowestText = '';
  const walker: TreeWalker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  for (let node: Node | null = walker.nextNode(); node; node = walker.nextNode()) {
    const text: string = node.textContent?.trim() ?? '';
    const parent: HTMLElement | null = node.parentElement;

    if (text && parent && parent.offsetParent !== null) {
      const style: CSSStyleDeclaration = getComputedStyle(parent);
      const foreground: Rgba | null = parseColor(style.color);

      if (foreground) {
        const background: Rgba = backgroundOf(parent, canvasBackground);
        const ratio: number = contrast(blend(foreground, background), background);

        if (ratio < lowest) {
          lowest = ratio;
          lowestText = text.slice(0, 24);
        }
      }
    }
  }

  if (lowest !== Infinity) {
    findings.push({
      detail: `lowest ${lowest.toFixed(1)} : 1 ("${lowestText}")`,
      result: lowest >= 4.5 ? 'Pass' : lowest >= 3 ? 'Warn' : 'Fail',
      rule: 'Color contrast',
    });
  }

  return findings;
};

export const CANVAS_BACKGROUND: Record<'dark' | 'light', Rgba> = {
  dark: [7, 16, 34, 1],
  light: [238, 241, 246, 1],
};
