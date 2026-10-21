// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ReactElement} from 'react';
import SdkObserver from './components/SdkObserver';
import TopBar from './components/TopBar';
import {Section, useHashPath} from './lib/router';
import Explorer from './pages/explorer/Explorer';
import Hooks from './pages/Hooks';
import Overview from './pages/Overview';
import Tokens from './pages/Tokens';

const App = (): ReactElement => {
  const [first, ...rest] = useHashPath();
  const section: Section = first === 'components' || first === 'hooks' || first === 'tokens' ? first : 'overview';

  return (
    <div className="pg-app">
      <SdkObserver />
      <TopBar section={section} />
      {section === 'overview' && <Overview />}
      {section === 'components' && <Explorer componentId={rest[0]} storyId={rest[1]} />}
      {section === 'hooks' && <Hooks />}
      {section === 'tokens' && <Tokens />}
    </div>
  );
};

export default App;
