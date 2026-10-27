// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApplicationQueryKeys, getApplications} from '@thunderid/browser';
import type {ApplicationListResponse, BasicApplication} from '@thunderid/browser';
import type {Component} from 'vue';
import BaseApplicationList from './BaseApplicationList';
import useManagementEndpoint, {type ManagementEndpoint} from '../../../composables/management/useManagementEndpoint';
import useResourceQuery, {type ResourceQueryResult} from '../../../composables/management/useResourceQuery';
import createConnectedAdminList from '../shared/createConnectedAdminList';

/**
 * Lists the applications the signed-in user is allowed to see, a page at a time.
 *
 * The server guards applications with the root `system` permission, for reading and for changes alike;
 * it defines no application-specific permission. Gate the view and its actions on it with
 * `useGrantedPermissions().can('system')`.
 *
 * Props: `limit`, `selectedApplicationId`, `onSelect` (`@select`), `title`, `description`, `className`,
 * `preferences`. Slots: `actions`; `default`, a scoped slot that replaces the table with custom UI and
 * receives `AdminListRenderProps` (rows, default columns, loading and error state, pagination and selection).
 *
 * @example
 * ```vue
 * <ApplicationList @select="(application) => (selectedApplicationId = application.id)" />
 * ```
 */
const ApplicationList: Component = createConnectedAdminList<ApplicationListResponse, BasicApplication>({
  base: BaseApplicationList,
  errorKey: 'admin.applications.list.error',
  name: 'ApplicationList',
  query: (params: () => Record<string, unknown>): ResourceQueryResult<ApplicationListResponse> => {
    const endpoint: ManagementEndpoint = useManagementEndpoint('applications');

    return useResourceQuery(
      () => {
        const {limit, offset} = params() as {limit?: number; offset?: number};

        return [ApplicationQueryKeys.APPLICATIONS, {limit, offset}];
      },
      (fetcher) => {
        const {limit, offset} = params() as {limit?: number; offset?: number};

        return getApplications({...endpoint, fetcher, limit, offset});
      },
    );
  },
  rows: (data: ApplicationListResponse | undefined) => data?.applications ?? [],
  rowsProp: 'applications',
  selectedProp: 'selectedApplicationId',
  total: (data: ApplicationListResponse | undefined) => data?.totalResults,
});

export default ApplicationList;
