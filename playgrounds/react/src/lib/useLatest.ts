// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {MutableRefObject, useEffect, useRef} from 'react';

/** Holds the latest value of a callback, so a stable function can call it. */
const useLatest = <F>(value: F): MutableRefObject<F> => {
  const ref: MutableRefObject<F> = useRef<F>(value);

  useEffect(() => {
    ref.current = value;
  });

  return ref;
};

export default useLatest;
