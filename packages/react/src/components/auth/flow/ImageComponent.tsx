// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {resolveLogoUri, ResolvedLogo} from '@thunderid/browser';
import {FC, SyntheticEvent} from 'react';
import useTheme from '../../../contexts/Theme/useTheme';
import {AdapterProps} from '../../../models/adapters';
import {css} from '../../../styles/emotion';

const DEFAULT_EMOJI_CONTAINER_HEIGHT = '4em';

/**
 * Image component for sign-up forms.
 */
const ImageComponent: FC<AdapterProps> = ({component}: AdapterProps) => {
  const {theme} = useTheme();
  // Computed per render (not at module scope): a CSP nonce configured on <ThunderIDProvider>
  // isn't known until the provider renders, and Emotion needs it applied before any style
  // insertion happens. These are static, so Emotion's own cache dedupes the repeat calls to a
  // no-op after the first render — this isn't a real per-render cost.
  const centerClass: string = css({textAlign: 'center'});
  const emojiGlyphClass: string = css({fontSize: '100cqmin', lineHeight: 1});
  const config: Record<string, unknown> = component.config || {};
  const src: string = (config['src'] as string) || '';
  const alt: string = (config['alt'] as string) || (config['label'] as string) || 'Image';
  const width: string = (config['width'] as string) || '100%';
  const height: string = (config['height'] as string) || 'auto';
  const variant: string = component.variant?.toLowerCase() || 'image_block';

  const imageStyle = {
    borderRadius: theme.vars.borderRadius.small,
    display: 'block',
    margin: variant === 'image_block' ? '1rem auto' : '0',
  };

  const imageClass: string = css(imageStyle);

  if (!src) {
    return null;
  }

  const resolvedIcon: ResolvedLogo = resolveLogoUri(src, alt);

  if (resolvedIcon.kind === 'emoji') {
    // Bare numbers (e.g. "48") are valid for <img> width/height attributes but
    // are unit-less and ignored as CSS properties — normalize them to px.
    const toCSSLength = (value: string): string => (/^\d+(\.\d+)?$/.test(value) ? `${value}px` : value);
    const cssWidth: string = toCSSLength(width);
    const cssHeight: string = toCSSLength(height);

    // container-type: size needs a concrete block dimension — percentage and
    // 'auto' values both collapse to 0 when the parent has no defined height.
    // Priority: explicit height → explicit width (square) → fallback constant.
    const isConcrete = (v: string): boolean => v !== 'auto' && !v.endsWith('%');
    let containerHeight: string;
    if (isConcrete(cssHeight)) {
      containerHeight = cssHeight;
    } else if (isConcrete(cssWidth)) {
      containerHeight = cssWidth;
    } else {
      containerHeight = DEFAULT_EMOJI_CONTAINER_HEIGHT;
    }

    const emojiContainerClass: string = css({
      ...imageStyle,
      containerType: 'size',
      display: 'inline-grid',
      height: containerHeight,
      placeItems: 'center',
      width: cssWidth,
    });

    return (
      <div key={component.id} className={centerClass}>
        {/*
         * container-type: size lets the inner span use cqmin (= min(cqw, cqh))
         * so the emoji font-size tracks the rendered container dimensions
         * rather than the parent's font-size.
         */}
        <span className={emojiContainerClass}>
          <span aria-label={alt} role="img" className={emojiGlyphClass}>
            {resolvedIcon.glyph}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div key={component.id} className={centerClass}>
      <img
        src={resolvedIcon.imgSrc}
        alt={alt}
        height={height}
        width={width}
        className={imageClass}
        onError={(e: SyntheticEvent<HTMLImageElement>): void => {
          // Hide broken images
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};

export default ImageComponent;
