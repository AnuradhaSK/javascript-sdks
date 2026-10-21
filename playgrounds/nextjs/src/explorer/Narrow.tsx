// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ReactElement, ReactNode} from 'react';

/** Caps a story's width so form-like components render at a realistic size. */
const Narrow = ({children, width = 360}: {children: ReactNode; width?: number}): ReactElement => (
  <div style={{maxWidth: '100%', width}}>{children}</div>
);

export default Narrow;
