// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  createHttpClientFetcher,
  UpdateMeCredentialsConfig as BaseUpdateMeCredentialsConfig,
  updateMeCredentials as baseUpdateMeCredentials,
} from '@thunderid/browser';

export interface UpdateMeCredentialsConfig extends Omit<BaseUpdateMeCredentialsConfig, 'fetcher'> {
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  instanceId?: number;
}

const updateMeCredentials = async ({
  fetcher,
  instanceId = 0,
  ...requestConfig
}: UpdateMeCredentialsConfig): Promise<void> => {
  return baseUpdateMeCredentials({
    ...requestConfig,
    fetcher: fetcher || createHttpClientFetcher(instanceId),
  });
};

export default updateMeCredentials;
