// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ReactElement} from 'react';
import Explorer from '../../../explorer/Explorer';

const ComponentsPage = async ({params}: {params: Promise<{slug?: string[]}>}): Promise<ReactElement> => {
  const [componentId, storyId] = ((await params).slug ?? []).map(decodeURIComponent);

  return <Explorer componentId={componentId} storyId={storyId} />;
};

export default ComponentsPage;
