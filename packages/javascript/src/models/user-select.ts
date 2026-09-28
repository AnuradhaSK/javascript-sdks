// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ManagedUser} from './managed-user';
import type {FetchSelectPage} from './select-page';
import type {SelectOptionMapping} from './select';

export type FetchUsers = FetchSelectPage;

export type UserSelectOptionMapping = SelectOptionMapping<ManagedUser>;
