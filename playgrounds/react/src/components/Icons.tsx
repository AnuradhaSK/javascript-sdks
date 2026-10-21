// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ReactElement} from 'react';

/** The ThunderID mark, with the top bar lightened for the playground's dark background. */
export const Logo = ({height = 26}: {height?: number}): ReactElement => (
  <svg
    width={Math.round((height / 257) * 207)}
    height={height}
    viewBox="0 0 207 257"
    fill="none"
    aria-label="ThunderID"
  >
    <path d="M55.4763 26.4391L58.8866 0H0V26.4391H55.4763Z" fill="#E8F4FF" />
    <path d="M39.8438 147.407L49.5455 72.2839H4.9909e-05V256.743H60.5602L80.048 147.407H39.8438Z" fill="#3688FF" />
    <path
      d="M192.42 59.361C182.782 40.2307 168.929 25.5705 150.903 15.3381C145.501 12.2662 139.761 9.6605 133.703 7.5208L115.401 103.702H159.757L76.2987 256.743H83.3735C109.449 256.743 131.69 251.574 150.14 241.236C168.569 230.897 182.634 216.131 192.356 196.959C202.058 177.765 206.909 154.8 206.909 128.043C206.909 101.286 202.079 78.5123 192.441 59.3821L192.42 59.361Z"
      fill="#3688FF"
    />
  </svg>
);

export const Spinner = ({size = 14}: {size?: number}): ReactElement => (
  <svg
    className="pg-spin"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 11-6.2-8.56" />
  </svg>
);

export const Play = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 2,
};

export const Check = (): ReactElement => (
  <svg width="12" height="12" viewBox="0 0 24 24" {...stroke} strokeWidth={3} aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const Cross = (): ReactElement => (
  <svg width="12" height="12" viewBox="0 0 24 24" {...stroke} strokeWidth={3} aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const Dash = (): ReactElement => (
  <svg width="12" height="12" viewBox="0 0 24 24" {...stroke} strokeWidth={3} aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const Bang = (): ReactElement => (
  <svg width="12" height="12" viewBox="0 0 24 24" {...stroke} strokeWidth={3} aria-hidden="true">
    <line x1="12" y1="6" x2="12" y2="13" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

export const Search = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const Chevron = (): ReactElement => (
  <svg width="12" height="12" viewBox="0 0 24 24" {...stroke} strokeWidth={2.5} aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const Grid4 = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const Desktop = (): ReactElement => (
  <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export const Tablet = (): ReactElement => (
  <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

export const Mobile = (): ReactElement => (
  <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <rect x="6" y="2" width="12" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

export const Moon = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

export const Sun = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

export const GridBg = (): ReactElement => (
  <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

export const Copy = (): ReactElement => (
  <svg width="13" height="13" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);
