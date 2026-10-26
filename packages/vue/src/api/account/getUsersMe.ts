// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  User,
  HttpResponse,
  FetchHttpClient,
  HttpRequestConfig,
  getUsersMe as baseGetUsersMe,
  GetUsersMeConfig as BaseGetUsersMeConfig,
} from '@thunderid/browser';

export interface GetUsersMeConfig extends Omit<BaseGetUsersMeConfig, 'fetcher'> {
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  instanceId?: number;
}

const getUsersMe = async ({fetcher, instanceId = 0, ...requestConfig}: GetUsersMeConfig): Promise<User> => {
  const defaultFetcher = async (url: string, config: RequestInit): Promise<Response> => {
    const httpClient: FetchHttpClient = FetchHttpClient.getInstance(instanceId);

    const response: HttpResponse<any> = await httpClient.request({
      headers: config.headers as Record<string, string>,
      method: config.method || 'GET',
      url,
    } as HttpRequestConfig);

    return {
      json: () => Promise.resolve(response.data),
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText || '',
      text: () => Promise.resolve(typeof response.data === 'string' ? response.data : JSON.stringify(response.data)),
    } as Response;
  };

  return baseGetUsersMe({
    ...requestConfig,
    fetcher: fetcher || defaultFetcher,
  });
};

export default getUsersMe;
