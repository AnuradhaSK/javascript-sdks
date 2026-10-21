// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

export type Child = Node | string | number | false | null | undefined | Child[];

export type Attrs = Record<string, string | number | boolean | null | undefined | EventListener>;

const append = (parent: Node, child: Child): void => {
  if (child === false || child === null || child === undefined) return;

  if (Array.isArray(child)) {
    child.forEach((item: Child) => append(parent, item));

    return;
  }

  parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
};

const applyAttrs = (element: Element, attrs: Attrs): void => {
  Object.entries(attrs).forEach(([key, value]: [string, Attrs[string]]) => {
    if (value === undefined || value === null || value === false) return;

    if (typeof value === 'function') {
      element.addEventListener(key.replace(/^on/, '').toLowerCase(), value);
    } else if (key === 'className') {
      element.setAttribute('class', String(value));
    } else {
      element.setAttribute(key, value === true ? '' : String(value));
    }
  });
};

/**
 * Creates an HTML element. Attributes starting with `on` become event listeners; `false`, `null`, and
 * `undefined` values are skipped.
 */
export const h = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] => {
  const element: HTMLElementTagNameMap[K] = document.createElement(tag);

  applyAttrs(element, attrs);
  append(element, children);

  return element;
};

/**
 * Parses trusted, playground-authored SVG markup into a node.
 */
export const svg = (markup: string): SVGElement => {
  const template: HTMLTemplateElement = document.createElement('template');

  template.innerHTML = markup.trim();

  return template.content.firstElementChild as SVGElement;
};

/**
 * Replaces the children of an element.
 */
export const mount = (parent: Element, ...children: Child[]): void => {
  parent.replaceChildren();
  append(parent, children);
};
