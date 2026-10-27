// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  FetchHttpClient,
  HttpRequestConfig,
  HttpResponse,
  getUsersMeMeta as baseGetUsersMeMeta,
  GetUsersMeMetaConfig as BaseGetUsersMeMetaConfig,
  UsersMeMetaResponse,
  AttributeSchema,
} from '@thunderid/browser';

export type {AttributeSchema, UsersMeMetaResponse};

/**
 * Configuration for the getUsersMeMeta request (Vue-specific)
 */
export interface GetUsersMeMetaConfig extends Omit<BaseGetUsersMeMetaConfig, 'fetcher'> {
  /**
   * Optional custom fetcher function. If not provided, the ThunderID SPA client's httpClient will be used
   */
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  /**
   * Optional instance ID for multi-instance support. Defaults to 0.
   */
  instanceId?: number;
}

/**
 * Retrieves the user schema metadata from the specified /users/me/meta endpoint.
 * Uses ThunderID SPA client FetchHttpClient by default with multi-instance support.
 */
const getUsersMeMeta = async ({
  fetcher,
  instanceId = 0,
  ...requestConfig
}: GetUsersMeMetaConfig): Promise<UsersMeMetaResponse> => {
  const defaultFetcher = async (url: string, config: RequestInit): Promise<Response> => {
    const httpClient: FetchHttpClient = FetchHttpClient.getInstance(instanceId);
    const response: HttpResponse<UsersMeMetaResponse> = await httpClient.request({
      headers: config.headers as Record<string, string>,
      method: config.method ?? 'GET',
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

  return baseGetUsersMeMeta({
    ...requestConfig,
    fetcher: fetcher ?? defaultFetcher,
  });
};

export default getUsersMeMeta;
