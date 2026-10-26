// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  FetchHttpClient,
  HttpRequestConfig,
  HttpResponse,
  User,
  UpdateMeProfileConfig as BaseUpdateMeProfileConfig,
  updateMeProfile as baseUpdateMeProfile,
} from '@thunderid/browser';

export interface UpdateMeProfileConfig extends Omit<BaseUpdateMeProfileConfig, 'fetcher'> {
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  instanceId?: number;
}

const updateMeProfile = async ({fetcher, instanceId = 0, ...requestConfig}: UpdateMeProfileConfig): Promise<User> => {
  const defaultFetcher = async (url: string, config: RequestInit): Promise<Response> => {
    const httpClient: FetchHttpClient = FetchHttpClient.getInstance(instanceId);

    const response: HttpResponse<any> = await httpClient.request({
      data: config.body ? JSON.parse(config.body as string) : undefined,
      headers: config.headers as Record<string, string>,
      method: config.method || 'PUT',
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

  return baseUpdateMeProfile({
    ...requestConfig,
    fetcher: fetcher || defaultFetcher,
  });
};

export default updateMeProfile;
