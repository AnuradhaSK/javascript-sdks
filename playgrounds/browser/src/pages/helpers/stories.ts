// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  ANONYMOUS_ANIMAL_ICONS,
  ANONYMOUS_ENTITY_ICONS,
  AvatarParams,
  AvatarShape,
  AvatarVariant,
  buildAvatarSpec,
  createClassObserver,
  createMediaQueryListener,
  createTheme,
  deriveAvatarContent,
  detectThemeMode,
  extractAvatarParamsFromUri,
  generateAvatarDataUri,
  getActiveTheme,
  isAvatarUri,
  MediaQueryListener,
  normalizeBorderRadius,
  pickAnonymousAvatarName,
  pickAnonymousEntityName,
  ResolvedLogo,
  resolveEmojiUrisInHtml,
  resolveLogoUri,
  Theme,
  ThemeMode,
} from '@thunderid/browser';
import type {Args, ArgValue, HelperDef, RenderContext} from './types';
import {Child, h} from '../../lib/dom';

const VARIANTS: readonly AvatarVariant[] = [
  'two_letter',
  'one_letter',
  'blank',
  'anonymous_animal',
  'anonymous_entity',
];
const SHAPES: readonly AvatarShape[] = ['rounded', 'circle'];

const str = (value: ArgValue | undefined): string => (value === undefined ? '' : String(value));

const quote = (value: ArgValue | undefined): string => `'${str(value).replace(/'/g, "\\'")}'`;

const facts = (rows: [string, Child][]): HTMLElement =>
  h(
    'dl',
    {className: 'pg-dl pg-hp-facts'},
    rows.map(([key, value]: [string, Child]) => [h('dt', {}, key), h('dd', {}, value)]),
  );

const json = (value: unknown): string => JSON.stringify(value, null, 2);

const avatarImg = (src: string, size: number, alt: string, onClick?: () => void): HTMLElement =>
  h('img', {alt, className: 'pg-hp-avatar', height: size, onclick: onClick, src, width: size});

const avatarParams = (args: Args): AvatarParams => {
  const variant: AvatarVariant = args['variant'] as AvatarVariant;

  return {
    ...(str(args['bg']) ? {bg: str(args['bg'])} : {}),
    colors: Number(args['colors']) || 0,
    content: str(args['content']) || deriveAvatarContent(variant, str(args['seed'])),
    shape: args['shape'] as AvatarShape,
    variant,
  };
};

const avatar: HelperDef = {
  code: (args: Args) => ({
    body: [
      `const params = {`,
      `  shape: ${quote(args['shape'])},`,
      `  variant: ${quote(args['variant'])},`,
      `  content: ${
        str(args['content'])
          ? quote(args['content'])
          : `deriveAvatarContent(${quote(args['variant'])}, ${quote(args['seed'])})`
      },`,
      `  colors: ${Number(args['colors']) || 0},`,
      ...(str(args['bg']) ? [`  bg: ${quote(args['bg'])},`] : []),
      `};`,
      ``,
      `img.src = generateAvatarDataUri(params);`,
      `const spec = buildAvatarSpec(params); // store this, not the data URI`,
      `const parsed = extractAvatarParamsFromUri(spec);`,
    ].join('\n'),
    imports: ['buildAvatarSpec', 'extractAvatarParamsFromUri', 'generateAvatarDataUri'].concat(
      str(args['content']) ? [] : ['deriveAvatarContent'],
    ),
  }),
  controls: [
    {control: VARIANTS, description: 'What the avatar shows.', name: 'variant', type: 'AvatarVariant'},
    {control: SHAPES, description: 'Background shape.', name: 'shape', type: 'AvatarShape'},
    {
      control: 'text',
      description: 'Seed text passed to deriveAvatarContent() when content is empty.',
      name: 'seed',
      type: 'string',
    },
    {
      control: 'text',
      description: 'Explicit content: initials, or an icon key for anonymous variants.',
      name: 'content',
      type: 'string',
    },
    {control: 'number', description: 'Rotates through the gradient palette.', name: 'colors', type: 'number'},
    {control: 'text', description: 'Flat background color instead of a gradient.', name: 'bg', type: 'string'},
  ],
  defaults: {bg: '', colors: 0, content: '', seed: 'Ada Lovelace', shape: 'rounded', variant: 'two_letter'},
  group: 'Avatars',
  id: 'avatar',
  name: 'Avatar',
  render: (args: Args, {action}: RenderContext) => {
    const params: AvatarParams = avatarParams(args);
    const uri: string = generateAvatarDataUri(params);
    const spec: string = buildAvatarSpec(params);
    const parsed: AvatarParams = extractAvatarParamsFromUri(spec);

    action('generateAvatarDataUri', `${params.variant}, ${uri.length} chars`);

    return h(
      'div',
      {className: 'pg-hp-stack'},
      h(
        'div',
        {className: 'pg-hp-row'},
        [32, 48, 72, 96].map((size: number) =>
          avatarImg(uri, size, `${params.variant} avatar, ${size}px`, () => action('click', `${size}px avatar`)),
        ),
      ),
      facts([
        ['content', params.content || '(empty)'],
        ['buildAvatarSpec()', spec],
        ['isAvatarUri(spec)', String(isAvatarUri(spec))],
        ['extractAvatarParamsFromUri()', json(parsed)],
        ['data URI', `${uri.length} chars`],
      ]),
    );
  },
  stories: [
    {id: 'initials', name: 'Initials'},
    {args: {seed: 'ThunderID', variant: 'one_letter'}, id: 'one-letter', name: 'One letter'},
    {args: {colors: 3, shape: 'circle', variant: 'blank'}, id: 'blank', name: 'Gradient swatch'},
    {args: {seed: 'user-42', variant: 'anonymous_animal'}, id: 'animal', name: 'Anonymous animal'},
    {args: {seed: 'service-7', variant: 'anonymous_entity'}, id: 'entity', name: 'Anonymous entity'},
    {args: {bg: '#3688FF', content: 'TD'}, id: 'solid', name: 'Solid background'},
  ],
};

const anonymous: HelperDef = {
  code: (args: Args) => {
    const animals: boolean = args['set'] === 'animals';
    const pick: string = animals ? 'pickAnonymousAvatarName' : 'pickAnonymousEntityName';

    return {
      body: [
        `// Same seed, same name: stable per user without storing anything.`,
        `const name = ${pick}(${quote(args['seed'])});`,
        `img.src = generateAvatarDataUri({`,
        `  shape: ${quote(args['shape'])},`,
        `  variant: ${quote(animals ? 'anonymous_animal' : 'anonymous_entity')},`,
        `  content: name,`,
        `  colors: 0,`,
        `});`,
        ``,
        `const all = Object.keys(${animals ? 'ANONYMOUS_ANIMAL_ICONS' : 'ANONYMOUS_ENTITY_ICONS'});`,
      ].join('\n'),
      imports: [pick, 'generateAvatarDataUri', animals ? 'ANONYMOUS_ANIMAL_ICONS' : 'ANONYMOUS_ENTITY_ICONS'],
    };
  },
  controls: [
    {control: ['animals', 'entities'], description: 'Which icon set to show.', name: 'set', type: 'string'},
    {control: SHAPES, description: 'Background shape.', name: 'shape', type: 'AvatarShape'},
    {
      control: 'text',
      description: 'Seed for the deterministic pick. Empty picks at random.',
      name: 'seed',
      type: 'string',
    },
  ],
  defaults: {seed: 'ada@example.com', set: 'animals', shape: 'rounded'},
  group: 'Avatars',
  id: 'anonymous',
  name: 'Anonymous names',
  render: (args: Args, {action}: RenderContext) => {
    const animals: boolean = args['set'] === 'animals';
    const icons: Record<string, unknown> = animals ? ANONYMOUS_ANIMAL_ICONS : ANONYMOUS_ENTITY_ICONS;
    const seed: string = str(args['seed']);
    const picked: string = animals
      ? pickAnonymousAvatarName(seed || undefined)
      : pickAnonymousEntityName(seed || undefined);
    const variant: AvatarVariant = animals ? 'anonymous_animal' : 'anonymous_entity';

    action(animals ? 'pickAnonymousAvatarName' : 'pickAnonymousEntityName', `${seed || '(random)'} -> ${picked}`);

    return h(
      'div',
      {className: 'pg-hp-stack'},
      facts([
        ['picked', picked],
        ['icons in set', String(Object.keys(icons).length)],
      ]),
      h(
        'div',
        {className: 'pg-hp-gallery'},
        Object.keys(icons)
          .sort()
          .map((name: string) =>
            h(
              'button',
              {
                'aria-pressed': String(name === picked),
                className: 'pg-hp-tile',
                onclick: () => action('select', name),
                type: 'button',
              },
              h('img', {
                alt: '',
                height: 40,
                src: generateAvatarDataUri({colors: 0, content: name, shape: args['shape'] as AvatarShape, variant}),
                width: 40,
              }),
              h('span', {}, name),
            ),
          ),
      ),
    );
  },
  stories: [
    {id: 'animals', name: 'Animals'},
    {args: {seed: 'billing-service', set: 'entities'}, id: 'entities', name: 'Entities'},
  ],
};

const logoResolver: HelperDef = {
  code: (args: Args) => ({
    body: [
      `const logo = resolveLogoUri(${quote(args['spec'])}, ${quote(args['fallback'])});`,
      ``,
      `if (logo.kind === 'emoji') el.textContent = logo.glyph;`,
      `else img.src = logo.imgSrc;`,
    ].join('\n'),
    imports: ['resolveLogoUri'],
  }),
  controls: [
    {
      control: 'text',
      description: 'A logo value as ThunderID stores it: emoji:, avatar:, or a URL.',
      name: 'spec',
      type: 'string',
    },
    {
      control: 'text',
      description: 'Seed used when an avatar: spec has no content.',
      name: 'fallback',
      type: 'string',
    },
  ],
  defaults: {fallback: 'Acme Corp', spec: 'emoji:🚀'},
  group: 'Avatars',
  id: 'logo',
  name: 'Logo resolver',
  render: (args: Args, {action}: RenderContext) => {
    const resolved: ResolvedLogo = resolveLogoUri(str(args['spec']), str(args['fallback']));

    action('resolveLogoUri', resolved.kind);

    return h(
      'div',
      {className: 'pg-hp-row'},
      h(
        'div',
        {className: 'pg-hp-logo'},
        resolved.kind === 'emoji'
          ? h('span', {'aria-label': 'logo', role: 'img'}, resolved.glyph ?? '')
          : h('img', {alt: 'logo', height: 64, src: resolved.imgSrc ?? '', width: 64}),
      ),
      facts([
        ['kind', resolved.kind],
        ['glyph', resolved.glyph ?? '-'],
        ['imgSrc', resolved.imgSrc ? `${resolved.imgSrc.slice(0, 60)}${resolved.imgSrc.length > 60 ? '…' : ''}` : '-'],
      ]),
    );
  },
  stories: [
    {id: 'emoji', name: 'Emoji'},
    {
      args: {spec: 'avatar:shape=circle,variant=two_letter,content=,colors=2'},
      id: 'avatar',
      name: 'Avatar spec',
    },
    {args: {spec: '/favicon.svg'}, id: 'url', name: 'Image URL'},
  ],
};

const emojiHtml: HelperDef = {
  code: (args: Args) => ({
    body: [`const html = resolveEmojiUrisInHtml(${quote(args['html'])});`, `container.innerHTML = html;`].join('\n'),
    imports: ['resolveEmojiUrisInHtml'],
  }),
  controls: [{control: 'text', description: 'HTML that may contain emoji: URIs.', name: 'html', type: 'string'}],
  defaults: {html: '<img src="emoji:👋" alt="wave"/> Welcome back'},
  group: 'Content',
  id: 'emoji-html',
  name: 'Emoji URIs in HTML',
  render: (args: Args, {action}: RenderContext) => {
    const input: string = str(args['html']);
    const output: string = resolveEmojiUrisInHtml(input);

    action('resolveEmojiUrisInHtml', `${input.length} -> ${output.length} chars`);

    return h(
      'div',
      {className: 'pg-hp-stack'},
      facts([
        ['input', input],
        ['output', output],
      ]),
      // Rendered in a sandboxed frame (no scripts), since the input is free text.
      h('iframe', {
        className: 'pg-hp-render',
        sandbox: '',
        srcdoc: `<body style="margin:0;font:16px system-ui;color:#888">${output}</body>`,
        title: 'Rendered output',
      }),
    );
  },
  stories: [
    {id: 'img', name: 'Image tag'},
    {args: {html: 'Ship it emoji:🚀 today'}, id: 'inline', name: 'Inline text'},
  ],
};

const themeDetection: HelperDef = {
  code: (args: Args) => ({
    body: [
      `const mode = getActiveTheme(${quote(args['mode'])}, {targetElement: document.documentElement, darkClass: ${quote(args['darkClass'])}});`,
      `const resolved = detectThemeMode(${quote(args['mode'])}, {darkClass: ${quote(args['darkClass'])}});`,
      ``,
      `// React to changes`,
      `const observer = createClassObserver(document.documentElement, (isDark) => apply(isDark), {darkClass: ${quote(args['darkClass'])}});`,
      `const listener = createMediaQueryListener((isDark) => apply(isDark));`,
      ``,
      `// Stop listening`,
      `observer.disconnect();`,
      `listener?.disconnect();`,
    ].join('\n'),
    imports: ['createClassObserver', 'createMediaQueryListener', 'detectThemeMode', 'getActiveTheme'],
  }),
  controls: [
    {
      control: ['light', 'dark', 'system', 'class'],
      description: 'Theme mode to resolve.',
      name: 'mode',
      type: 'ThemeMode',
    },
    {control: 'text', description: 'Class that marks dark mode in class mode.', name: 'darkClass', type: 'string'},
  ],
  defaults: {darkClass: 'dark', mode: 'system'},
  group: 'Theme',
  id: 'theme-detection',
  name: 'Theme detection',
  render: (args: Args, {action, onDispose}: RenderContext) => {
    const mode: ThemeMode = args['mode'] as ThemeMode;
    const darkClass: string = str(args['darkClass']) || 'dark';
    const target: HTMLElement = h('div', {className: 'pg-hp-target light'}, 'target element');
    const result: HTMLElement = h('div', {});

    const evaluate = (): void => {
      const config = {darkClass, targetElement: target};
      const active: ThemeMode = getActiveTheme(mode, config);
      const detected: string = detectThemeMode(mode, config);

      result.replaceChildren(
        facts([
          ['getActiveTheme()', active],
          ['detectThemeMode()', detected],
          ['target classes', target.className.replace('pg-hp-target', '').trim() || '(none)'],
        ]),
      );
      action('getActiveTheme', `${mode} -> ${active}`);
    };

    const observer: MutationObserver = createClassObserver(
      target,
      (isDark: boolean) => {
        action('createClassObserver', `isDark=${isDark}`);
        evaluate();
      },
      {darkClass},
    );
    const mediaQuery: MediaQueryListener | null = createMediaQueryListener((isDark: boolean) =>
      action('createMediaQueryListener', `isDark=${isDark}`),
    );

    onDispose(() => observer.disconnect());
    onDispose(() => mediaQuery?.disconnect());
    evaluate();

    return h(
      'div',
      {className: 'pg-hp-stack'},
      h(
        'div',
        {className: 'pg-hp-row'},
        target,
        h(
          'button',
          {
            className: 'pg-btn',
            'data-size': 'sm',
            onclick: () => {
              const dark: boolean = target.classList.contains(darkClass);

              target.classList.toggle(darkClass, !dark);
              target.classList.toggle('light', dark);
            },
            type: 'button',
          },
          `Toggle .${darkClass} on target`,
        ),
      ),
      result,
      h(
        'p',
        {className: 'pg-hp-note'},
        `System preference: ${mediaQuery?.matches ? 'dark' : 'light'}. Change it in your OS to see createMediaQueryListener() fire.`,
      ),
    );
  },
  stories: [
    {id: 'system', name: 'System preference'},
    {args: {mode: 'class'}, id: 'class', name: 'Class based'},
    {args: {mode: 'dark'}, id: 'forced', name: 'Forced dark'},
  ],
};

const themeVariables: HelperDef = {
  code: (args: Args) => ({
    body: [
      `const theme = createTheme(${str(args['primary']) ? `{colors: {primary: {main: ${quote(args['primary'])}}}}` : '{}'}, ${String(args['dark'] === true)});`,
      ``,
      `Object.entries(theme.cssVariables).forEach(([name, value]) =>`,
      `  document.documentElement.style.setProperty(name, value),`,
      `);`,
    ].join('\n'),
    imports: ['createTheme'],
  }),
  controls: [
    {control: 'bool', description: 'Start from the dark base theme.', name: 'dark', type: 'boolean'},
    {control: 'text', description: 'Override colors.primary.main.', name: 'primary', type: 'string'},
    {control: 'text', description: 'Only show variables whose name contains this.', name: 'filter', type: 'string'},
  ],
  defaults: {dark: true, filter: 'color', primary: ''},
  group: 'Theme',
  id: 'theme-variables',
  name: 'Theme variables',
  render: (args: Args, {action, frame}: RenderContext) => {
    const primary: string = str(args['primary']);
    const theme: Theme = createTheme(primary ? {colors: {primary: {main: primary}}} : {}, args['dark'] === true);
    const filter: string = str(args['filter']).toLowerCase();
    const entries: [string, string][] = Object.entries(theme.cssVariables).filter(([name]: [string, string]) =>
      name.toLowerCase().includes(filter),
    );

    Object.entries(theme.cssVariables).forEach(([name, value]: [string, string]) =>
      frame.style.setProperty(name, value),
    );
    action('createTheme', `${Object.keys(theme.cssVariables).length} variables, ${entries.length} shown`);

    return h(
      'div',
      {className: 'pg-hp-stack'},
      h(
        'div',
        {className: 'pg-hp-sample'},
        h('strong', {}, 'Sample surface'),
        h('span', {}, 'Styled with var(--thunderid-color-*) from this theme.'),
        h(
          'button',
          {className: 'pg-hp-sample-btn', onclick: () => action('click', 'sample button'), type: 'button'},
          'Continue',
        ),
      ),
      h(
        'div',
        {className: 'pg-hp-swatches'},
        entries.slice(0, 48).map(([name, value]: [string, string]) =>
          h(
            'div',
            {className: 'pg-hp-swatch'},
            h('span', {
              'data-empty': String(!/^(#|rgb|hsl)/.test(value)),
              style: /^(#|rgb|hsl)/.test(value) ? `background:${value}` : undefined,
            }),
            h('code', {}, name.replace(/^--thunderid-/, '')),
            h('small', {}, value),
          ),
        ),
      ),
      entries.length > 48 && h('p', {className: 'pg-hp-note'}, `${entries.length - 48} more not shown.`),
    );
  },
  stories: [
    {id: 'dark', name: 'Dark base'},
    {args: {dark: false}, id: 'light', name: 'Light base'},
    {args: {primary: '#8B6FE8'}, id: 'brand', name: 'Brand primary'},
  ],
};

const parseRadius = (raw: string): Parameters<typeof normalizeBorderRadius>[0] => {
  const trimmed: string = raw.trim();

  if (trimmed === '') return undefined;
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed) as Parameters<typeof normalizeBorderRadius>[0];
    } catch {
      return trimmed;
    }
  }

  return trimmed;
};

const borderRadius: HelperDef = {
  code: (args: Args) => ({
    body: `const radius = normalizeBorderRadius(${str(args['raw']).trim().startsWith('{') ? str(args['raw']) : quote(args['raw'])});\n// -> {small, medium, large} CSS lengths`,
    imports: ['normalizeBorderRadius'],
  }),
  controls: [
    {
      control: 'text',
      description: 'A number-like string, a CSS length, or a {"small","medium","large"} object.',
      name: 'raw',
      type: 'number | string | object',
    },
  ],
  defaults: {raw: '12'},
  group: 'Theme',
  id: 'border-radius',
  name: 'Border radius',
  render: (args: Args, {action}: RenderContext) => {
    const normalized: Record<string, string> | undefined = normalizeBorderRadius(parseRadius(str(args['raw']))) as
      | Record<string, string>
      | undefined;

    action('normalizeBorderRadius', normalized ? JSON.stringify(normalized) : 'undefined');

    return h(
      'div',
      {className: 'pg-hp-stack'},
      h(
        'div',
        {className: 'pg-hp-row'},
        ['small', 'medium', 'large'].map((size: string) =>
          h(
            'div',
            {className: 'pg-hp-radius', style: `border-radius:${normalized?.[size] ?? '0'}`},
            h('span', {}, size),
            h('code', {}, normalized?.[size] ?? 'unset'),
          ),
        ),
      ),
      facts([['result', normalized ? json(normalized) : 'undefined']]),
    );
  },
  stories: [
    {id: 'number', name: 'Number-like'},
    {args: {raw: '0.5rem'}, id: 'css', name: 'CSS length'},
    {args: {raw: '{"small":"4px","large":"20px"}'}, id: 'tokens', name: 'Per-size tokens'},
  ],
};

export const HELPERS: HelperDef[] = [
  avatar,
  anonymous,
  logoResolver,
  emojiHtml,
  themeDetection,
  themeVariables,
  borderRadius,
];

export const GROUPS: string[] = Array.from(new Set(HELPERS.map((helper: HelperDef) => helper.group)));

export const STORY_COUNT: number = HELPERS.reduce(
  (total: number, helper: HelperDef) => total + helper.stories.length,
  0,
);
