// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {topBar} from './components/topbar';
import {bootstrap} from './lib/client';
import {h} from './lib/dom';
import {checkServerHealth} from './lib/health';
import {currentPath, Section, toSection} from './lib/router';
import {Scope} from './lib/store';
import {renderHelpers} from './pages/helpers/explorer';
import {renderOverview} from './pages/overview';
import {renderTokens} from './pages/tokens';
import './styles.css';

const app: HTMLElement = document.getElementById('app')!;
const outlet: HTMLElement = h('div', {style: 'display:contents'});
const shell = new Scope();
let page = new Scope();

const section = (): Section => toSection(currentPath()[0]);

const route = (): void => {
  const [, ...rest] = currentPath();

  page.dispose();
  page = new Scope();
  window.scrollTo(0, 0);

  if (section() === 'helpers') renderHelpers(outlet, page, rest[0], rest[1]);
  else if (section() === 'tokens') renderTokens(outlet, page);
  else renderOverview(outlet, page);
};

app.className = 'pg-app';
app.append(topBar(shell, section), outlet);
window.addEventListener('hashchange', route);
route();

void checkServerHealth();
void bootstrap();
